import { useCallback, useEffect, useRef, useState } from "react";
import type { JobSnapshot } from "../shared/contracts.js";
import { message, request } from "./api.js";

export function useJobs(kind: "audit" | "knowledge", datasetId: string, onProgress: () => void, selectedRunId = "") {
  const [jobs, setJobs] = useState<JobSnapshot[]>([]);
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
        const result = await request<{ jobs: JobSnapshot[] }>(`/${kind}/jobs?dataset_id=${encodeURIComponent(datasetId)}`, undefined, undefined, controller.signal);
        if (selectedRunId && !result.jobs.some(job => job.run_id === selectedRunId)) {
          const selected = await request<JobSnapshot>(`/${kind}/status/${encodeURIComponent(selectedRunId)}`, undefined, undefined, controller.signal);
          if (selected.dataset_id !== datasetId) throw new Error("所选作业不属于当前数据集");
          result.jobs.push(selected);
        }
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
  }, [kind, datasetId, onProgress, revision, selectedRunId]);
  return { jobs, error, refresh };
}
