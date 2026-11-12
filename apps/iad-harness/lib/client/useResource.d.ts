export declare function useResource<T>(path: string | null, revision?: number | string, live?: boolean): {
    data: NonNullable<T> | null;
    error: string;
    loading: boolean;
    refreshing: boolean;
};
//# sourceMappingURL=useResource.d.ts.map