import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { message, request } from './api.js';
import { queryClient } from './query-client.js';
export function useDatasetCatalog() {
    const result = useQuery({ queryKey: ['iad', 'resource', '/datasets'], queryFn: () => request('/datasets'), staleTime: Infinity }, queryClient);
    const refresh = useCallback(async () => {
        const value = await result.refetch({ cancelRefetch: false });
        return value.isError ? null : value.data ?? null;
    }, [result.refetch]);
    return { data: result.data ?? null, loading: result.isFetching, error: result.error ? message(result.error) : '', refresh };
}
