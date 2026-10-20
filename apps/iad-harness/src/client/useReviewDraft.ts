import { useState } from "react";
import { v4 as uuid } from "uuid";
import type { Decision, ReviewSubmission } from "../shared/contracts.js";

interface ReviewDraft { reviewer: string; comment: string; pending: ReviewSubmission | null }
export function useReviewDraft(datasetId: string, sampleId: string) {
  const key = `iad.review-draft:${datasetId}:${sampleId}`;
  const [state, setState] = useState(() => {
    const draft: ReviewDraft = { reviewer: localStorage.getItem("iad.reviewer") || "auditor_qc", comment: "", pending: null };
    try {
      const stored = JSON.parse(sessionStorage.getItem(key) || "null");
      if (stored && typeof stored.reviewer === "string" && typeof stored.comment === "string") return { draft: { ...draft, ...stored } as ReviewDraft, dirty: true };
    } catch { sessionStorage.removeItem(key); }
    return { draft, dirty: false };
  });
  function persist(draft: ReviewDraft) {
    sessionStorage.setItem(key, JSON.stringify(draft));
    setState({ draft, dirty: true });
  }
  function update(patch: Partial<Pick<ReviewDraft, "reviewer" | "comment">>) {
    persist({ ...state.draft, ...patch });
  }
  function prepare(decision: Decision, duration: number): ReviewSubmission {
    if (state.draft.pending) return state.draft.pending;
    const pending: ReviewSubmission = { submission_id: uuid(), dataset_id: datasetId, sample_id: sampleId,
      reviewer: state.draft.reviewer.trim(), comment: state.draft.comment, decision, duration_ms: duration };
    persist({ ...state.draft, pending });
    return pending;
  }
  function discard() {
    sessionStorage.removeItem(key);
    setState({ draft: { reviewer: localStorage.getItem("iad.reviewer") || "auditor_qc", comment: "", pending: null }, dirty: false });
  }
  return { ...state.draft, dirty: state.dirty, update, prepare, discard };
}
