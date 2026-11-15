import { useEffect, useRef } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ConsistencyView } from './consistency-view.js';
import { message } from './api.js';
import { queryClient } from './query-client.js';
import { JOB_POLL_INTERVAL } from '../shared/job-display.js';
export function useConsistencyImages(jobId, revision, running, query, page) {
    const result = useQuery({ queryKey: ['iad', 'consistency-images', jobId, query, page], enabled: !!jobId,
        queryFn: ({ signal }) => ConsistencyView.loadImagePage(jobId, query, page, signal),
        placeholderData: (previous, previousQuery) => previousQuery?.queryKey[2] === jobId ? keepPreviousData(previous) : undefined,
        refetchInterval: running ? JOB_POLL_INTERVAL : false, }, queryClient);
    const previous = useRef(revision);
    useEffect(() => {
        if (jobId && previous.current !== revision)
            void result.refetch({ cancelRefetch: false });
        previous.current = revision;
    }, [jobId, revision, result.refetch]);
    return { items: result.data?.items || [], total: result.data?.total || 0, counts: result.data?.counts || {},
        pending: result.isPending || result.isPlaceholderData, error: result.error ? message(result.error) : null };
}
