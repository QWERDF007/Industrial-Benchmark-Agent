import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
export function findWorkspaceRoot(startDir = process.cwd()) {
    let cur = path.resolve(startDir);
    while (cur !== path.dirname(cur)) {
        if (fs.existsSync(path.join(cur, "python/iad_core")) || fs.existsSync(path.join(cur, "data/benchmark.db"))) {
            return cur;
        }
        cur = path.dirname(cur);
    }
    return path.resolve(startDir);
}
export function resolvePythonPath(configured) {
    if (configured)
        return configured;
    if (process.env.IAD_PYTHON_PATH && fs.existsSync(process.env.IAD_PYTHON_PATH)) {
        return process.env.IAD_PYTHON_PATH;
    }
    const defaultIadAgent = "/home/dell/anaconda3/envs/iad_agent/bin/python";
    if (fs.existsSync(defaultIadAgent)) {
        return defaultIadAgent;
    }
    if (process.env.CONDA_PREFIX && process.env.CONDA_PREFIX !== "/home/dell/anaconda3") {
        const condaPython = path.join(process.env.CONDA_PREFIX, "bin/python");
        if (fs.existsSync(condaPython))
            return condaPython;
    }
    return "python3";
}
export class PythonBridge {
    pythonPath;
    cwd;
    timeoutMs;
    worker = null;
    pendingRequests = new Map();
    stdoutAccum = "";
    stderrAccum = "";
    constructor(config = {}) {
        this.cwd = config.cwd ? path.resolve(config.cwd) : findWorkspaceRoot();
        this.pythonPath = resolvePythonPath(config.pythonPath);
        this.timeoutMs = config.timeoutMs || 60000;
    }
    ensureWorker() {
        if (this.worker && !this.worker.killed && this.worker.exitCode === null) {
            return this.worker;
        }
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
        this.stdoutAccum = "";
        this.stderrAccum = "";
        child.stdout.on("data", (chunk) => {
            this.stdoutAccum += chunk.toString("utf8");
            const lines = this.stdoutAccum.split("\n");
            this.stdoutAccum = lines.pop() || "";
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed)
                    continue;
                try {
                    const parsed = JSON.parse(trimmed);
                    const reqId = parsed.request_id;
                    if (!reqId)
                        continue;
                    const pending = this.pendingRequests.get(reqId);
                    if (!pending)
                        continue;
                    if (parsed.event === "progress") {
                        pending.onProgress?.(parsed);
                    }
                    else if (parsed.event === "result") {
                        if (pending.timer)
                            clearTimeout(pending.timer);
                        this.pendingRequests.delete(reqId);
                        pending.resolve(parsed.data !== undefined ? parsed.data : parsed);
                    }
                    else if (parsed.event === "error") {
                        if (pending.timer)
                            clearTimeout(pending.timer);
                        this.pendingRequests.delete(reqId);
                        const errPayload = parsed.error || {};
                        const err = new Error(errPayload.message || "Python bridge error");
                        err.code = errPayload.code;
                        err.details = errPayload.details;
                        pending.reject(err);
                    }
                }
                catch {
                    // ignore non-json line
                }
            }
        });
        child.stderr.on("data", (chunk) => {
            this.stderrAccum += chunk.toString("utf8");
            if (this.stderrAccum.length > 50000) {
                this.stderrAccum = this.stderrAccum.slice(-20000);
            }
        });
        child.on("error", (err) => {
            this.handleWorkerExit(new Error(`Python process error: ${err.message}`));
        });
        child.on("close", (code) => {
            this.handleWorkerExit(new Error(`Python worker exited with code ${code}. Stderr: ${this.stderrAccum.slice(-1000)}`));
        });
        this.worker = child;
        return child;
    }
    handleWorkerExit(err) {
        this.worker = null;
        for (const [, pending] of this.pendingRequests.entries()) {
            if (pending.timer)
                clearTimeout(pending.timer);
            pending.reject(err);
        }
        this.pendingRequests.clear();
    }
    /**
     * Execute an operation against persistent python -m iad_core.entry worker via streaming NDJSON (DS-S04).
     * Achieves sub-millisecond dispatch by avoiding per-call process spawn overhead.
     */
    async execute(operation, argumentsPayload = {}, signal, onProgress) {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const worker = this.ensureWorker();
        return new Promise((resolve, reject) => {
            let timer;
            const cleanup = () => {
                if (timer)
                    clearTimeout(timer);
                if (signal)
                    signal.removeEventListener("abort", onAbort);
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
            }) + "\n";
            try {
                worker.stdin?.write(payload, "utf8");
            }
            catch (err) {
                cleanup();
                reject(new Error(`Failed to write to Python worker: ${err.message}`));
            }
        });
    }
    destroy() {
        if (this.worker) {
            try {
                this.worker.kill("SIGTERM");
            }
            catch { }
            this.worker = null;
        }
    }
}
