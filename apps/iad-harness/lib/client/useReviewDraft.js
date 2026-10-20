import { useState } from "react";
export function useReviewDraft(datasetId, sampleId) {
    const key = `iad.review-draft:${datasetId}:${sampleId}`;
    const [state, setState] = useState(() => {
        const draft = { reviewer: localStorage.getItem("iad.reviewer") || "auditor_qc", comment: "" };
        try {
            const stored = JSON.parse(sessionStorage.getItem(key) || "null");
            if (stored && typeof stored.reviewer === "string" && typeof stored.comment === "string")
                return { draft: stored, dirty: true };
        }
        catch {
            sessionStorage.removeItem(key);
        }
        return { draft, dirty: false };
    });
    function update(patch) {
        const draft = { ...state.draft, ...patch };
        sessionStorage.setItem(key, JSON.stringify(draft));
        setState({ draft, dirty: true });
    }
    function discard() {
        sessionStorage.removeItem(key);
        setState({ draft: { reviewer: localStorage.getItem("iad.reviewer") || "auditor_qc", comment: "" }, dirty: false });
    }
    return { ...state.draft, dirty: state.dirty, update, discard };
}
