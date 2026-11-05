import { useCallback, useEffect, useRef, useState } from "react";
import { message, request } from "./api.js";
export function useJobs(kind, datasetId, onProgress, selectedRunId = "", refreshRevision = 0) {
    const scope = JSON.stringify([...new Set((Array.isArray(datasetId) ? datasetId : [datasetId]).filter(Boolean))].sort());
    const identity = `${kind}:${scope}`;
    const [snapshot, setSnapshot] = useState({
        identity,
        jobs: [],
        pendingCount: 0,
        error: "",
        lastSyncedAt: null,
        syncState: "syncing",
    });
    const [revision, setRevision] = useState(0);
    const observed = useRef({ identity: "", signature: "" });
    const refresh = useCallback(() => setRevision((value) => value + 1), []);
    useEffect(() => {
        const controller = new AbortController();
        if (observed.current.identity !== identity) {
            observed.current = { identity, signature: "" };
            setSnapshot({
                identity,
                jobs: [],
                pendingCount: 0,
                error: "",
                lastSyncedAt: null,
                syncState: "syncing",
            });
        }
        const datasetIds = JSON.parse(scope);
        if (!datasetIds.length)
            return;
        let timer, reading = false, active = true, failures = 0;
        let currentRequest;
        async function poll() {
            if (reading || controller.signal.aborted || document.hidden)
                return;
            reading = true;
            currentRequest = new AbortController();
            const readingController = currentRequest;
            const timeout = setTimeout(() => readingController.abort(), 10000);
            setSnapshot((previous) => previous.identity === identity
                ? { ...previous, syncState: previous.error ? "stale" : "syncing" }
                : previous);
            try {
                const results = await Promise.all(datasetIds.map(id => request(kind === 'audit' ? `/audit/jobs?dataset_id=${encodeURIComponent(id)}` : `/analysis/jobs?${new URLSearchParams({ dataset_id: id, analysis_kind: kind })}`, undefined, undefined, readingController.signal)));
                const result = {
                    jobs: [...new Map(results.flatMap(result => result.jobs).map(job => [job.run_id, job])).values()]
                        .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at)),
                    pending_count: results.reduce((total, result) => total + (result.pending_count || 0), 0),
                };
                if (selectedRunId &&
                    !result.jobs.some((job) => job.run_id === selectedRunId ||
                        (job.job_type === 'ANALYSIS_WORKFLOW' && job.root_run_id === selectedRunId))) {
                    const selected = await request(`/${kind === 'audit' ? 'audit' : 'analysis'}/status/${encodeURIComponent(selectedRunId)}`, undefined, undefined, readingController.signal);
                    if (!datasetIds.includes(selected.dataset_id) && !selected.dataset_ids.some(id => datasetIds.includes(id)))
                        throw new Error("所选作业不属于当前数据集");
                    if (!result.jobs.some(job => job.run_id === selected.run_id))
                        result.jobs.push(selected);
                }
                if (controller.signal.aborted)
                    return;
                if (readingController.signal.aborted)
                    throw new Error("状态读取超时");
                const signature = JSON.stringify(result.jobs
                    .filter((job) => kind === "audit" ||
                    !["RUNNING", "PENDING"].includes(job.status) ||
                    job.knowledge_version_id ||
                    job.exploration_version_id)
                    .map((job) => [
                    job.run_id,
                    job.status,
                    job.completed,
                    job.failed,
                    job.knowledge_version_id,
                    job.exploration_version_id,
                ])
                    .sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
                if (observed.current.signature &&
                    observed.current.signature !== signature)
                    onProgress();
                observed.current = { identity, signature };
                setSnapshot({
                    identity,
                    jobs: result.jobs,
                    pendingCount: result.pending_count || 0,
                    error: "",
                    lastSyncedAt: Date.now(),
                    syncState: "current",
                });
                active = result.jobs.some((job) => ["RUNNING", "PENDING"].includes(job.status));
                failures = 0;
            }
            catch (error) {
                if (!controller.signal.aborted) {
                    failures++;
                    setSnapshot((previous) => previous.identity === identity
                        ? {
                            ...previous,
                            syncState: "stale",
                            error: readingController.signal.aborted
                                ? "状态读取超过 10 秒，请重试。"
                                : message(error),
                        }
                        : previous);
                }
            }
            finally {
                clearTimeout(timeout);
                reading = false;
                if (!controller.signal.aborted)
                    timer = setTimeout(poll, failures
                        ? Math.min(10000, 1200 * 2 ** failures)
                        : active
                            ? 1200
                            : 5000);
            }
        }
        const foreground = () => {
            if (!document.hidden) {
                clearTimeout(timer);
                void poll();
            }
        };
        document.addEventListener("visibilitychange", foreground);
        void poll();
        return () => {
            controller.abort();
            currentRequest?.abort();
            clearTimeout(timer);
            document.removeEventListener("visibilitychange", foreground);
        };
    }, [
        identity,
        kind,
        scope,
        onProgress,
        revision,
        selectedRunId,
        refreshRevision,
    ]);
    const current = snapshot.identity === identity
        ? snapshot
        : {
            identity,
            jobs: [],
            pendingCount: 0,
            error: "",
            lastSyncedAt: null,
            syncState: "syncing",
        };
    return { ...current, refresh };
}
