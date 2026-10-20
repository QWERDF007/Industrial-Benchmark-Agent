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
    constructor(config?: PythonBridgeConfig);
    /**
     * Execute an operation against python -m iad_core.entry via stdin/stdout JSON streaming (DS-S04).
     */
    execute<T = any>(operation: string, argumentsPayload?: Record<string, any>, signal?: AbortSignal, onProgress?: (progressEvent: any) => void): Promise<T>;
}
//# sourceMappingURL=index.d.ts.map