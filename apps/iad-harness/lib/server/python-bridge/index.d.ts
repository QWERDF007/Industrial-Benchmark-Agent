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
export declare function findWorkspaceRoot(startDir?: string): string;
export declare function resolvePythonPath(configured?: string): string;
export type BridgeDispatch = (operation: string, args?: Record<string, any>, signal?: AbortSignal) => Promise<any>;
export interface ModelRouting {
    execute(operation: string, args: Record<string, any>, signal: AbortSignal | undefined, dispatch: BridgeDispatch): Promise<any>;
}
export declare class PythonBridge {
    private readonly workbench;
    private readonly queries;
    private modelRouting?;
    constructor(config?: PythonBridgeConfig);
    get pythonPath(): string;
    get cwd(): string;
    get timeoutMs(): number;
    get dbPath(): string | undefined;
    useModelRouting(routing: ModelRouting): () => void;
    execute<T = any>(operation: string, args?: Record<string, any>, signal?: AbortSignal, onProgress?: (progressEvent: any) => void): Promise<T>;
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map