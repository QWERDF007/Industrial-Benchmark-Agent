import React, { useEffect, useState } from "react";
import type { Dataset, Report } from "../../shared/contracts.js";
import { message, request } from "../api.js";
import { JobCard } from "./JobCard.js";
import { QualityReport } from "./QualityReport.js";
import { AuditSetup, type AuditSetupProps } from "./AuditSetup.js";

export function AuditJobs(props: AuditSetupProps) {
  return <><AuditSetup {...props} /><section className="iad-job-section"><h2>审计作业</h2>
    {props.jobs.map(job => <JobCard key={job.run_id} job={job} onChanged={props.onJobsChanged} />)}
    {!props.jobs.length && <p className="iad-muted">尚无审计作业。</p>}
  </section></>;
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
  return <section className="iad-job-section iad-quality-report"><h2>审计汇总</h2>{!report && !error && <p role="status">正在读取当前数据集报告…</p>}{error && <p role="alert" className="iad-error">{error}</p>}{report && <><QualityReport report={report} /><button onClick={download}>导出 JSON</button></>}</section>;
}
