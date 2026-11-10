import {useCallback} from 'react';
import {useQueries, type Query} from '@tanstack/react-query';
import type {ConsistencyBatch, ConsistencyBatchSummary, ConsistencyCheckReport} from '../shared/domain.generated.js';
import type {JobSnapshot} from '../shared/contracts.js';
import {message, request} from './api.js';
import {queryClient} from './query-client.js';
import {useJobs} from './useJobs.js';

export type ConsistencyJob = Pick<ConsistencyBatchSummary, 'batch_id'|'status'|'created_at'|'duration_seconds'|'conflict_count'> & {
  analysis: JobSnapshot; dataset_ids: string[];
};

export function useConsistencyJobs(datasetIds: string[], onProgress: () => void) {
  const polling = useJobs('consistency', datasetIds, onProgress);
  const programIds = [...new Set(polling.jobs.flatMap(job => job.program_batch_id ? [job.program_batch_id] : []))].sort();
  const programs = useQueries({queries: programIds.map(id => ({queryKey: ['iad', 'resource', `/consistency/runs/${id}`],
    queryFn: () => request<ConsistencyBatch>(`/consistency/runs/${encodeURIComponent(id)}`), staleTime: Infinity,
  }))}, queryClient);
  const checks = useQueries({queries: polling.jobs.filter(job => job.consistency_check_version === 1).map(job => ({
    queryKey: ['iad', 'consistency-check-report', job.run_id],
    queryFn: () => request<ConsistencyCheckReport>(`/consistency/checks/${encodeURIComponent(job.run_id)}/report`),
    refetchInterval: (query: Query<ConsistencyCheckReport>) => ['PENDING', 'RUNNING'].includes(query.state.data?.status || '') ? 1200 : false,
  }))}, queryClient);
  const resources = [...programs, ...checks];
  const jobs: ConsistencyJob[] = polling.jobs.map(job => ({
    batch_id: job.program_batch_id || job.run_id, analysis: job, status: job.status, dataset_ids: job.dataset_ids,
    created_at: job.submitted_at,
    conflict_count: job.consistency_check_version === 1 ? checks.find(item => item.data?.job_id === job.run_id)?.data?.original_conflicts ?? null
      : programs.find(item => item.data?.batch_id === job.program_batch_id)?.data?.conflict_count ?? null,
    duration_seconds: job.finished_at && job.started_at ? Math.max(0, Math.round((Date.parse(job.finished_at) - Date.parse(job.started_at)) / 1000)) : null,
  }));
  const refresh = useCallback(() => {
    polling.refresh();resources.forEach(resource => void resource.refetch({cancelRefetch: false}));
  }, [polling.refresh, programs, checks]);
  const error = resources.find(resource => resource.error)?.error;
  return {...polling, jobs, refresh, loading: polling.loading || resources.some(resource => resource.isPending),
    error: polling.error || (error ? message(error) : '')};
}
