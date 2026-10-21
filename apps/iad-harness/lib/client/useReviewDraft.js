import { useState } from "react";
import { v4 as uuid } from "uuid";
export function useReviewDraft(datasetId, sampleId) {
    const key = `iad.review-draft:${datasetId}:${sampleId}`;
    const [state, setState] = useState(() => {
        const draft = { reviewer: localStorage.getItem("iad.reviewer") || "auditor_qc", comment: "", decision: null, pending: null };
        try {
            const stored = JSON.parse(sessionStorage.getItem(key) || "null");
            if (stored && typeof stored.reviewer === "string" && typeof stored.comment === "string")
                return { draft: { ...draft, ...stored }, dirty: true };
        }
        catch {
            sessionStorage.removeItem(key);
        }
        return { draft, dirty: false };
    });
    function persist(draft) {
        sessionStorage.setItem(key, JSON.stringify(draft));
        setState({ draft, dirty: true });
    }
    function update(patch) {
        persist({ ...state.draft, ...patch });
    }
    function prepare(decision, duration) {
        if (state.draft.pending)
            return state.draft.pending;
        const pending = { submission_id: uuid(), dataset_id: datasetId, sample_id: sampleId,
            reviewer: state.draft.reviewer.trim(), comment: state.draft.comment, decision, duration_ms: duration };
        persist({ ...state.draft, pending });
        return pending;
    }
    function discard() {
        sessionStorage.removeItem(key);
        setState({ draft: { reviewer: localStorage.getItem("iad.reviewer") || "auditor_qc", comment: "", decision: null, pending: null }, dirty: false });
    }
    return { ...state.draft, dirty: state.dirty, update, prepare, discard };
}
