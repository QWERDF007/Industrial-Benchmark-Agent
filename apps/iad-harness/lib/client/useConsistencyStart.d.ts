export declare function useConsistencyStart(onStarted: (batchId: string) => void): {
    start: (endpoint: string, body: Record<string, unknown>) => Promise<void>;
    busy: boolean;
    error: string;
    notice: string;
};
//# sourceMappingURL=useConsistencyStart.d.ts.map