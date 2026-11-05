import {useState} from 'react';
import type {JobSnapshot} from '../shared/contracts.js';

export function useAuditJobSelection(jobs: JobSnapshot[], scope: string) {
  const empty = {scope, search: '', status: '', page: 1, runId: ''};
  const [saved, setSaved] = useState(empty);
  const state = saved.scope === scope ? saved : empty;
  const filtered = jobs.filter(job => (!state.status || job.status === state.status)
    && [job.run_id, job.root_run_id].some(id=>id.toLocaleLowerCase().includes(state.search.trim().toLocaleLowerCase())));
  const selected = filtered.find(job => job.root_run_id === state.runId || job.run_id === state.runId) || filtered[0] || null;
  const page = Math.min(state.page, Math.max(1, Math.ceil(filtered.length / 8)));
  const update = (patch: Partial<typeof state>) => setSaved({...state, ...patch});
  return {state, selected, filtered, page, visible: filtered.slice((page - 1) * 8, page * 8),
    search: (search: string) => update({search, page: 1}), status: (status: string) => update({status, page: 1}),
    select: (runId: string) => update({runId:jobs.find(job=>job.run_id===runId)?.root_run_id || runId}), setPage: (page: number) => update({page}),
    clear: () => setSaved(empty)};
}
