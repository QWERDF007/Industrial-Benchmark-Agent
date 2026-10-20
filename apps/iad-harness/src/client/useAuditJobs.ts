import { useCallback, useEffect, useRef, useState } from "react";
import type { AuditJob } from "../shared/contracts.js";
import { message, request } from "./api.js";

export function useAuditJobs(datasetId: string, onProgress: () => void) {
  const [jobs, setJobs] = useState<AuditJob[]>([]);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const observed = useRef({ datasetId: "", signature: "" });
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (observed.current.datasetId !== datasetId) {
      observed.current = { datasetId, signature: "" };
      setJobs([]);
    }
    if (!datasetId) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>, running = true;
    async function poll() {
      try {
        const result = await request<{ jobs: AuditJob[] }>(`/audit/jobs?dataset_id=${encodeURIComponent(datasetId)}`, undefined, undefined, controller.signal);
        if (controller.signal.aborted) return;
        const signature = JSON.stringify(result.jobs.map(job => [job.run_id, job.status, job.completed, job.failed]));
        if (observed.current.signature && observed.current.signature !== signature) onProgress();
        observed.current.signature = signature;
        setJobs(result.jobs); setError("");
        running = result.jobs.some(job => job.status === "RUNNING" || job.status === "PENDING");
      } catch (error) { if (!controller.signal.aborted) setError(message(error)); }
      finally { if (!controller.signal.aborted) timer = setTimeout(poll, running ? 1200 : 5000); }
    }
    poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [datasetId, onProgress, revision]);
  return { jobs, error, refresh };
}
