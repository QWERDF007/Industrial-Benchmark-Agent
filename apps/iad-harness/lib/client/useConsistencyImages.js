import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ConsistencyView } from './consistency-view.js';
import { message } from './api.js';
import { queryClient } from './query-client.js';
export function useConsistencyImages(jobId, revision, running) {
    const result = useQuery({ queryKey: ['iad', 'consistency-images', jobId], enabled: !!jobId,
        queryFn: ({ signal }) => ConsistencyView.loadImages(jobId, signal), refetchInterval: running ? 5000 : false, }, queryClient);
    const previous = useRef(revision);
    useEffect(() => {
        if (jobId && previous.current !== revision)
            void result.refetch({ cancelRefetch: false });
        previous.current = revision;
    }, [jobId, revision, result.refetch]);
    return { items: result.data || [], pending: result.isPending, error: result.error ? message(result.error) : null };
}
