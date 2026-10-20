import { spawn } from "node:child_process";
import path from "node:path";

export interface PythonBridgeConfig {
  pythonPath?: string;
  cwd?: string;
  timeoutMs?: number;
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

import fs from "node:fs";

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

export class PythonBridge {
  readonly pythonPath: string;
  readonly cwd: string;
  readonly timeoutMs: number;

  constructor(config: PythonBridgeConfig = {}) {
    this.cwd = config.cwd ? path.resolve(config.cwd) : findWorkspaceRoot();
    this.pythonPath = resolvePythonPath(config.pythonPath);
    this.timeoutMs = config.timeoutMs || 60000;
  }

  /**
   * Execute an operation against python -m iad_core.entry via stdin/stdout JSON streaming (DS-S04).
   */
  async execute<T = any>(
    operation: string,
    argumentsPayload: Record<string, any> = {},
    signal?: AbortSignal,
    onProgress?: (progressEvent: any) => void
  ): Promise<T> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const inputPayload = JSON.stringify({
      request_id: requestId,
      operation,
      arguments: argumentsPayload,
    }) + "\n";

    return new Promise<T>((resolve, reject) => {
      let settled = false;
      let timer: NodeJS.Timeout | undefined;

      const pythonPathEnv = process.env.PYTHONPATH
        ? `${path.join(this.cwd, "python")}:${process.env.PYTHONPATH}`
        : path.join(this.cwd, "python");

      const child = spawn(this.pythonPath, ["-m", "iad_core.entry"], {
        cwd: this.cwd,
        env: {
          ...process.env,
          PYTHONPATH: pythonPathEnv,
          PYTHONUNBUFFERED: "1",
        },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdoutAccum = "";
      let stderrAccum = "";
      let lastResult: any = null;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        if (signal) signal.removeEventListener("abort", onAbort);
      };

      const onAbort = () => {
        if (settled) return;
        settled = true;
        cleanup();
        try {
          child.kill("SIGTERM");
          setTimeout(() => {
            if (!child.killed) child.kill("SIGKILL");
          }, 1000);
        } catch {
          // ignore kill errors
        }
        reject(new Error(`Operation '${operation}' was aborted by caller.`));
      };

      if (signal) {
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener("abort", onAbort);
      }

      if (this.timeoutMs > 0) {
        timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          try {
            child.kill("SIGKILL");
          } catch {}
          reject(new Error(`Operation '${operation}' timed out after ${this.timeoutMs}ms.`));
        }, this.timeoutMs);
      }

      child.stdout.on("data", (chunk: Buffer) => {
        stdoutAccum += chunk.toString("utf8");
        const lines = stdoutAccum.split("\n");
        stdoutAccum = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed) as PythonBridgeResponse<T>;
            if (parsed.event === "progress") {
              onProgress?.(parsed);
            } else if (parsed.event === "result") {
              lastResult = parsed.data !== undefined ? parsed.data : parsed;
            } else if (parsed.event === "error") {
              lastResult = parsed;
            }
          } catch {
            // Ignore non-json line or diagnostic log
          }
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        stderrAccum += chunk.toString("utf8");
      });

      child.on("error", (err: Error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error(`Failed to spawn Python process (${this.pythonPath}): ${err.message}`));
      });

      child.on("close", (code: number | null) => {
        if (settled) return;
        settled = true;
        cleanup();

        // Process any remaining stdout
        if (stdoutAccum.trim()) {
          try {
            const parsed = JSON.parse(stdoutAccum.trim()) as PythonBridgeResponse<T>;
            if (parsed.event === "result") {
              lastResult = parsed.data !== undefined ? parsed.data : parsed;
            } else if (parsed.event === "error") {
              lastResult = parsed;
            }
          } catch {}
        }

        if (lastResult && lastResult.event === "error") {
          const errPayload = lastResult.error || {};
          const msg = errPayload.message || "Python bridge reported an error";
          const err = new Error(msg);
          (err as any).code = errPayload.code;
          (err as any).details = errPayload.details;
          return reject(err);
        }

        if (code !== 0 && lastResult === null) {
          const errMsg = stderrAccum.trim() || `Python process exited with code ${code}`;
          return reject(new Error(`Python bridge execution failure: ${errMsg}`));
        }

        if (lastResult !== null) {
          return resolve(lastResult as T);
        }

        return reject(new Error(`Python bridge produced no result. Stderr: ${stderrAccum.trim()}`));
      });

      // Write payload to stdin and close
      try {
        child.stdin.write(inputPayload, "utf8");
        child.stdin.end();
      } catch (e: any) {
        if (!settled) {
          settled = true;
          cleanup();
          reject(new Error(`Failed to write to Python stdin: ${e.message}`));
        }
      }
    });
  }
}
