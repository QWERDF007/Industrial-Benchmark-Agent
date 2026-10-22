import React, { useEffect, useState } from "react";
import type { Dataset, Report, JobSnapshot } from "../../shared/contracts.js";
import { message, request } from "../api.js";
import { JobTable } from "./JobTable.js";
import { QualityReport } from "./QualityReport.js";

export function AuditJobs(props: {jobs: JobSnapshot[]; onJobsChanged(): void}) {
  return <section className="iad-job-section"><h2>审计作业</h2>
    <JobTable jobs={props.jobs} pageId="industrial-audit" onChanged={props.onJobsChanged} />
  </section>;
}

export function AuditReport({ dataset }: { dataset: Dataset }) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    request<Report>(`/report/${dataset.task_id}?dataset_id=${dataset.dataset_id}`, undefined, undefined, controller.signal).then(value => { if (!controller.signal.aborted) { setReport(value); setError(""); } }).catch(e => { if (!controller.signal.aborted) setError(message(e)); });
    return () => controller.abort();
  }, [dataset]);
  function download() {
    const blob = new Blob([JSON.stringify({ dataset_id: dataset.dataset_id, name: dataset.name, ...report }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob), anchor = document.createElement("a"); anchor.href = url; anchor.download = `${dataset.name}-report.json`; anchor.click(); URL.revokeObjectURL(url);
  }
  return <section className="iad-job-section iad-quality-report"><div className="iad-section-header"><h2>审计汇总</h2>{report && <button onClick={download}>导出 JSON</button>}</div><p className="iad-muted">全部数据集图像 · 每图最新已保存记录 · 不受网格筛选影响</p>{!report && !error && <p role="status">正在读取当前数据集报告…</p>}{error && <p role="alert" className="iad-error">{error}</p>}{report && <><QualityReport report={report} /></>}</section>;
}
