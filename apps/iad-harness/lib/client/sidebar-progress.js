import { request } from "./api.js";
import { pages } from "./workspace.js";
/** One plugin-level observer; labels are projections of persisted dataset and job records. */
export class SidebarProgress {
    workspace;
    constructor(workspace) {
        this.workspace = workspace;
    }
    connect(present) {
        let datasetId, controller;
        let timer;
        const reset = () => {
            const next = this.workspace.getSnapshot().datasetId;
            if (next === datasetId)
                return;
            datasetId = next;
            controller?.abort();
            clearTimeout(timer);
            for (const page of Object.keys(pages))
                present(page, pages[page]);
            if (!next)
                return;
            const current = new AbortController();
            controller = current;
            let labels = {}, updatedAt = "";
            const poll = async () => {
                try {
                    const [dataset, audit, knowledge] = await Promise.all([
                        request(`/datasets/${encodeURIComponent(next)}`, undefined, undefined, current.signal),
                        ...["audit", "knowledge"].map(kind => request(`/${kind}/jobs?dataset_id=${encodeURIComponent(next)}`, undefined, undefined, current.signal)),
                    ]);
                    if (current.signal.aborted)
                        return;
                    const jobs = [...audit.jobs, ...knowledge.jobs];
                    labels = {};
                    for (const page of Object.keys(pages)) {
                        const kind = page === "industrial-normal" ? "NORMAL_KNOWLEDGE" : page === "industrial-defect" ? "DEFECT_KNOWLEDGE" : page === "industrial-audit" ? "MODEL_AUDIT" : null;
                        const attempts = jobs.filter(job => job.job_type === kind);
                        const running = attempts.filter(job => ["PENDING", "RUNNING"].includes(job.status)).length;
                        const roots = new Set(attempts.map(job => job.root_run_id));
                        const failed = [...roots].filter(root => {
                            const chain = attempts.filter(job => job.root_run_id === root);
                            const completed = new Set(chain.flatMap(job => job.completed_sample_ids));
                            const active = new Set(chain.filter(job => ["PENDING", "RUNNING"].includes(job.status)).flatMap(job => job.sample_ids));
                            return chain.some(job => ["FAILED", "PARTIAL", "INTERRUPTED"].includes(job.status)
                                && job.sample_ids.some(id => !completed.has(id) && !active.has(id)));
                        }).length;
                        const status = [];
                        if (running)
                            status.push(`运行 ${running}`);
                        if (failed)
                            status.push(`近期失败 ${failed}`);
                        if ((page === "industrial-images" || page === "industrial-audit") && !running && dataset.total_samples > dataset.vlm_audited_count)
                            status.push(`待审计 ${dataset.total_samples - dataset.vlm_audited_count}`);
                        if (page === "industrial-review" && dataset.pending_risk_count)
                            status.push(`待复核 ${dataset.pending_risk_count}`);
                        if (page === "industrial-datasets" && dataset.technical_quality_issues)
                            status.push(`技术问题 ${dataset.technical_quality_issues}`);
                        labels[page] = [pages[page], ...status].join(" · ");
                        present(page, labels[page]);
                    }
                    updatedAt = new Date().toLocaleTimeString();
                }
                catch {
                    if (!current.signal.aborted)
                        for (const page of Object.keys(pages))
                            present(page, `${labels[page] || pages[page]} · 更新失败${updatedAt ? `（${updatedAt}）` : ""}`);
                }
                finally {
                    if (!current.signal.aborted)
                        timer = setTimeout(poll, 5000);
                }
            };
            void poll();
        };
        const unsubscribe = this.workspace.subscribe(reset);
        reset();
        return () => { unsubscribe(); controller?.abort(); clearTimeout(timer); };
    }
}
