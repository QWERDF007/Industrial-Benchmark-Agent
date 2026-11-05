import { useState } from 'react';
export function useAuditJobSelection(jobs, scope) {
    const empty = { scope, search: '', status: '', page: 1, runId: '' };
    const [saved, setSaved] = useState(empty);
    const state = saved.scope === scope ? saved : empty;
    const filtered = jobs.filter(job => (!state.status || job.status === state.status)
        && job.run_id.toLocaleLowerCase().includes(state.search.trim().toLocaleLowerCase()));
    const selected = filtered.find(job => job.run_id === state.runId) || filtered[0] || null;
    const page = Math.min(state.page, Math.max(1, Math.ceil(filtered.length / 8)));
    const update = (patch) => setSaved({ ...state, ...patch });
    return { state, selected, filtered, page, visible: filtered.slice((page - 1) * 8, page * 8),
        search: (search) => update({ search, page: 1 }), status: (status) => update({ status, page: 1 }),
        select: (runId) => update({ runId }), setPage: (page) => update({ page }),
        clear: () => setSaved(empty) };
}
