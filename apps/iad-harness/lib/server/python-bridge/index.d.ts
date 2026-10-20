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
export declare function findWorkspaceRoot(startDir?: string): string;
export declare function resolvePythonPath(configured?: string): string;
export declare class PythonBridge {
    readonly pythonPath: string;
    readonly cwd: string;
    readonly timeoutMs: number;
    private worker;
    private pendingRequests;
    private stdoutAccum;
    private stderrAccum;
    constructor(config?: PythonBridgeConfig);
    private ensureWorker;
    private handleWorkerExit;
    /**
     * Execute an operation against persistent python -m iad_core.entry worker via streaming NDJSON (DS-S04).
     * Achieves sub-millisecond dispatch by avoiding per-call process spawn overhead.
     */
    execute<T = any>(operation: string, argumentsPayload?: Record<string, any>, signal?: AbortSignal, onProgress?: (progressEvent: any) => void): Promise<T>;
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map