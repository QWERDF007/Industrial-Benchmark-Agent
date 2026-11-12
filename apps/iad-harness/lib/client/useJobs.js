import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { message, request } from './api.js';
import { queryClient } from './query-client.js';
import { JOB_POLL_INTERVAL, jobIsActive } from '../shared/job-display.js';
export function useJobs(kind, datasetId, onProgress, selectedRunId = '', refreshRevision = 0) {
    const scope = JSON.stringify([...new Set((Array.isArray(datasetId) ? datasetId : [datasetId]).filter(Boolean))].sort());
    const identity = `${kind}:${scope}`;
    const query = useQuery({ queryKey: ['iad', 'jobs', kind, scope], enabled: scope !== '[]',
        queryFn: async ({ signal: querySignal }) => {
            const ids = JSON.parse(scope);
            const signal = AbortSignal.any([querySignal, AbortSignal.timeout(10000)]);
            try {
                const results = await Promise.all(ids.map(id => request(kind === 'audit'
                    ? `/audit/jobs?dataset_id=${encodeURIComponent(id)}`
                    : `/analysis/jobs?${new URLSearchParams({ dataset_id: id, analysis_kind: kind })}`, undefined, undefined, signal)));
                const jobs = [...new Map(results.flatMap(result => result.jobs).map(job => [job.run_id, job])).values()]
                    .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
                return { jobs, pendingCount: results.reduce((sum, result) => sum + (result.pending_count || 0), 0) };
            }
            catch (error) {
                if (signal.aborted)
                    throw new Error('状态读取超过 10 秒，请重试。');
                throw error;
            }
        },
        refetchInterval: query => !query.state.error && query.state.data?.jobs.some(jobIsActive) ? JOB_POLL_INTERVAL : 5000,
        refetchOnWindowFocus: true, }, queryClient);
    const needsSelected = !!selectedRunId && !!query.data && !query.data.jobs.some(job => job.run_id === selectedRunId || job.root_run_id === selectedRunId);
    const selected = useQuery({ queryKey: ['iad', 'selected-job', kind, scope, selectedRunId], enabled: needsSelected,
        queryFn: async () => {
            const job = await request(`/${kind === 'audit' ? 'audit' : 'analysis'}/status/${encodeURIComponent(selectedRunId)}`);
            if (job.deleted_at)
                return null;
            const ids = JSON.parse(scope);
            if (!ids.includes(job.dataset_id) && !job.dataset_ids.some(id => ids.includes(id)))
                throw new Error('所选作业不属于当前数据集');
            return job;
        },
        refetchInterval: query => jobIsActive(query.state.data) ? JOB_POLL_INTERVAL : false, }, queryClient);
    const jobs = useMemo(() => needsSelected && selected.data ? [...(query.data?.jobs || []), selected.data] : query.data?.jobs || [], [query.data, selected.data, needsSelected]);
    const observed = useRef({ identity, signature: '' });
    useEffect(() => {
        if (!query.data)
            return;
        const signature = JSON.stringify(jobs.map(job => [job.run_id, job.status, job.completed, job.failed, job.analysis_version_id, job.knowledge_version_id, job.exploration_version_id])
            .sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
        if (observed.current.identity === identity && observed.current.signature && observed.current.signature !== signature)
            onProgress();
        observed.current = { identity, signature };
    }, [query.data, jobs, identity, kind, onProgress]);
    const previous = useRef(refreshRevision);
    useEffect(() => {
        if (previous.current !== refreshRevision)
            void query.refetch({ cancelRefetch: false });
        previous.current = refreshRevision;
    }, [refreshRevision, query.refetch]);
    const refresh = useCallback(() => { void query.refetch({ cancelRefetch: false }); }, [query.refetch]);
    return { identity, loading: scope !== '[]' && query.isPending && !query.isError, jobs, pendingCount: query.data?.pendingCount || 0, error: query.error ? message(query.error) : needsSelected && selected.error ? message(selected.error) : '',
        lastSyncedAt: query.dataUpdatedAt || null, syncState: query.isError ? 'stale' : query.isFetching ? 'syncing' : 'current', refresh };
}
