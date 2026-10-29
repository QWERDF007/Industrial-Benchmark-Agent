import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import {queryOperations} from "../../shared/execution.generated.js";

const queryOperationNames = new Set<string>(queryOperations);

export interface PythonBridgeConfig {
  pythonPath?: string;
  cwd?: string;
  timeoutMs?: number;
  dbPath?: string;
}

export interface PythonBridgeResponse<T = any> {
  event: "result" | "error" | "progress";
  request_id: string;
  status?: string;
  data?: T;
  metrics?: Record<string, any>;
  artifacts?: any[];
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export function findWorkspaceRoot(startDir: string = process.cwd()): string {
  let cur = path.resolve(startDir);
  while (cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, "python/iad_core")) || fs.existsSync(path.join(cur, "data/benchmark.db"))) {
      return cur;
    }
    cur = path.dirname(cur);
  }
  return path.resolve(startDir);
}

export function resolvePythonPath(configured?: string): string {
  if (configured) return configured;
  if (process.env.IAD_PYTHON_PATH && fs.existsSync(process.env.IAD_PYTHON_PATH)) {
    return process.env.IAD_PYTHON_PATH;
  }
  const defaultIadAgent = "/home/dell/anaconda3/envs/iad_agent/bin/python";
  if (fs.existsSync(defaultIadAgent)) {
    return defaultIadAgent;
  }
  if (process.env.CONDA_PREFIX && process.env.CONDA_PREFIX !== "/home/dell/anaconda3") {
    const condaPython = path.join(process.env.CONDA_PREFIX, "bin/python");
    if (fs.existsSync(condaPython)) return condaPython;
  }
  return "python3";
}

interface PendingRequest<T = any> {
  resolve: (value: T) => void;
  reject: (err: any) => void;
  onProgress?: (progressEvent: any) => void;
  timer?: NodeJS.Timeout;
  operation: string;
}

export type BridgeDispatch = (operation: string, args?: Record<string, any>, signal?: AbortSignal) => Promise<any>;
export interface ModelRouting {
  execute(operation: string, args: Record<string, any>, signal: AbortSignal | undefined, dispatch: BridgeDispatch): Promise<any>;
}

class PythonWorker {
  readonly pythonPath: string;
  readonly cwd: string;
  readonly timeoutMs: number;
  readonly dbPath?: string;

  private worker: ChildProcess | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private stdoutAccum = "";
  private stderrAccum = "";

  constructor(config: PythonBridgeConfig, private readonly role: "workbench" | "query") {
    this.cwd = config.cwd ? path.resolve(config.cwd) : findWorkspaceRoot();
    this.pythonPath = resolvePythonPath(config.pythonPath);
    this.timeoutMs = config.timeoutMs ?? 120000;
    this.dbPath = config.dbPath;
  }

  private ensureWorker(): ChildProcess {
    if (this.worker && !this.worker.killed && this.worker.exitCode === null) {
      return this.worker;
    }

    const pythonPathEnv = process.env.PYTHONPATH
      ? `${path.join(this.cwd, "python")}:${process.env.PYTHONPATH}`
      : path.join(this.cwd, "python");

    const child = spawn(this.pythonPath, ["-m", "iad_core.entry", ...(this.role === "query" ? ["--query-worker"] : [])], {
      cwd: this.cwd,
      env: {
        ...process.env,
        PYTHONPATH: pythonPathEnv,
        PYTHONUNBUFFERED: "1",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.stdoutAccum = "";
    this.stderrAccum = "";

    child.stdout.on("data", (chunk: Buffer) => {
      this.stdoutAccum += chunk.toString("utf8");
      const lines = this.stdoutAccum.split("\n");
      this.stdoutAccum = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          const reqId = parsed.request_id;
          if (!reqId) continue;
          const pending = this.pendingRequests.get(reqId);
          if (!pending) continue;

          if (parsed.event === "progress") {
            pending.onProgress?.(parsed);
          } else if (parsed.event === "result") {
            if (pending.timer) clearTimeout(pending.timer);
            this.pendingRequests.delete(reqId);
            pending.resolve(parsed.data !== undefined ? parsed.data : parsed);
          } else if (parsed.event === "error") {
            if (pending.timer) clearTimeout(pending.timer);
            this.pendingRequests.delete(reqId);
            const errPayload = parsed.error || {};
            const err = new Error(errPayload.message || "Python bridge error");
            (err as any).code = errPayload.code;
            (err as any).details = errPayload.details;
            pending.reject(err);
          }
        } catch {
          // ignore non-json line
        }
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      this.stderrAccum += chunk.toString("utf8");
      if (this.stderrAccum.length > 50000) {
        this.stderrAccum = this.stderrAccum.slice(-20000);
      }
    });

    child.on("error", (err: Error) => {
      if (this.worker !== child) return;
      this.handleWorkerExit(new Error(`Python process error: ${err.message}`));
    });

    child.on("close", (code: number | null) => {
      if (this.worker !== child) return;
      this.handleWorkerExit(
        new Error(`Python worker exited with code ${code}. Stderr: ${this.stderrAccum.slice(-1000)}`)
      );
    });

    this.worker = child;
    return child;
  }

  private handleWorkerExit(err: Error) {
    this.worker = null;
    for (const [, pending] of this.pendingRequests.entries()) {
      if (pending.timer) clearTimeout(pending.timer);
      pending.reject(err);
    }
    this.pendingRequests.clear();
  }

  async execute<T = any>(operation: string, argumentsPayload: Record<string, any> = {}, signal?: AbortSignal,
                         onProgress?: (progressEvent: any) => void): Promise<T> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const worker = this.ensureWorker();

    return new Promise<T>((resolve, reject) => {
      let timer: NodeJS.Timeout | undefined;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        if (signal) signal.removeEventListener("abort", onAbort);
        this.pendingRequests.delete(requestId);
      };

      const onAbort = () => {
        cleanup();
        reject(new Error(`Operation '${operation}' was aborted by caller.`));
      };

      if (signal) {
        if (signal.aborted) {
          return onAbort();
        }
        signal.addEventListener("abort", onAbort);
      }

      if (this.timeoutMs > 0) {
        timer = setTimeout(() => {
          cleanup();
          reject(new Error(`Operation '${operation}' timed out after ${this.timeoutMs}ms.`));
        }, this.timeoutMs);
      }

      this.pendingRequests.set(requestId, {
        resolve: (val) => {
          cleanup();
          resolve(val);
        },
        reject: (err) => {
          cleanup();
          reject(err);
        },
        onProgress,
        timer,
        operation,
      });

      const payload = JSON.stringify({
        request_id: requestId,
        operation,
        arguments: argumentsPayload,
        db_path: this.dbPath,
      }) + "\n";

      try {
        worker.stdin?.write(payload, "utf8");
      } catch (err: any) {
        cleanup();
        reject(new Error(`Failed to write to Python worker: ${err.message}`));
      }
    });
  }

  destroy() {
    if (this.worker) {
      try {
        this.worker.kill("SIGTERM");
      } catch {}
      this.worker = null;
    }
    this.handleWorkerExit(new Error("Python bridge was disposed"));
  }
}


export class PythonBridge {
  private readonly workbench: PythonWorker;
  private readonly queries: PythonWorker;
  private modelRouting?: ModelRouting;

  constructor(config: PythonBridgeConfig = {}) {
    this.workbench = new PythonWorker(config, "workbench");
    this.queries = new PythonWorker(config, "query");
  }

  get pythonPath() { return this.workbench.pythonPath; }
  get cwd() { return this.workbench.cwd; }
  get timeoutMs() { return this.workbench.timeoutMs; }
  get dbPath() { return this.workbench.dbPath; }

  useModelRouting(routing: ModelRouting): () => void {
    if (this.modelRouting) throw new Error('工作台模型解析入口已注册');
    this.modelRouting = routing;
    return () => { if (this.modelRouting === routing) this.modelRouting = undefined; };
  }

  execute<T = any>(operation: string, args: Record<string, any> = {}, signal?: AbortSignal,
                   onProgress?: (progressEvent: any) => void): Promise<T> {
    const dispatch: BridgeDispatch = (name, values = {}, cancellation) =>
      (queryOperationNames.has(name) ? this.queries : this.workbench).execute<T>(name, values, cancellation, onProgress);
    return this.modelRouting ? this.modelRouting.execute(operation, args, signal, dispatch) : dispatch(operation, args, signal);
  }

  destroy() {
    this.queries.destroy();
    this.workbench.destroy();
  }
}
