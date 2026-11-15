export declare function runConcurrent<T>(items: readonly T[], concurrency: number, signal: AbortSignal, execute: (item: T) => Promise<void>): Promise<void>;
export interface DependencyTask<T> {
    id: string;
    dependencies: readonly string[];
    value: T;
    priority?: number;
    resource?: string;
}
export declare function runDependencies<T>(tasks: readonly DependencyTask<T>[], concurrency: number | Readonly<Record<string, number>>, signal: AbortSignal, execute: (value: T) => Promise<void>): Promise<void>;
//# sourceMappingURL=concurrency.d.ts.map