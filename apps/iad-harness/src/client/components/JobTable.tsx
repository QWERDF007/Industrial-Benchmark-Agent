import React, { useEffect, useRef, useState } from "react";
import type { JobSnapshot } from "../../shared/contracts.js";
import { jobPhases, jobStatuses } from "../../shared/job-display.js";
import { useWorkspace, type PageId } from "../workspace.js";
import { JobDetail } from "./JobDetail.js";
import { Pagination } from "./Pagination.js";
import { Modal } from "./Modal.js";

const types: Record<JobSnapshot["job_type"], string> = {
  MODEL_AUDIT: "模型审计",
  NORMAL_KNOWLEDGE: "良品知识",
  DEFECT_KNOWLEDGE: "异常知识",
  DIRECTION_EXPLORATION: "方向探索",
  IMAGE_INDEX: "图像索引",
  DATA_CONSISTENCY: "数据一致性",
  CONSISTENCY_ANALYSIS: "图组模型分析",
};

export function JobTable({
  jobs,
  pageId,
  onChanged,
  stale = false,
  lastSyncedAt,
  onCopy,
}: {
  jobs: JobSnapshot[];
  pageId: PageId;
  onChanged(): void;
  stale?: boolean;
  lastSyncedAt?: number | null;
  onCopy?(job: JobSnapshot): void;
}) {
  const { workspace } = useWorkspace(),
    selected = workspace.view(pageId).job;
  const [page, setPage] = useState(1),
    [status, setStatus] = useState("");
  const [search, setSearch] = useState(""), [drawerOpen, setDrawerOpen] = useState(false);
  const rows = useRef(new Map<string, HTMLTableRowElement>()), filter = useRef<HTMLSelectElement>(null);
  const exploration = pageId === "industrial-exploration";
  const knowledge = pageId === "industrial-knowledge";
  const filtered = jobs.filter((job) => (!status || job.status === status) && (!knowledge || `${job.run_id} ${job.model_name}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())));
  const index = filtered.findIndex((job) => job.run_id === selected);
  useEffect(() => {
    if (index >= 0) setPage(Math.floor(index / 10) + 1);
  }, [selected, index]);
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10))),
    visible = filtered.slice((current - 1) * 10, current * 10);
  const job = jobs.find((job) => job.run_id === selected) || (!knowledge ? visible[0] : undefined);
  function open(item: JobSnapshot) { workspace.updateView(pageId, { job: item.run_id }); setDrawerOpen(true); }
  return (
    <div
      className={`iad-job-table ${knowledge ? "iad-knowledge-job-table" : exploration && job ? "iad-exploration-jobs-layout" : ""}`}
    >
      <label className="iad-field iad-job-filter">
        任务状态
        <select
          ref={filter}
          aria-label="任务状态"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">全部状态</option>
          {Object.entries(jobStatuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {knowledge && <label className="iad-field iad-job-search">搜索任务<input type="search" aria-label="搜索任务" placeholder="任务 ID / 模型名称" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>}
      <div>
        <div className="iad-table-scroll">
          <table className="iad-resource-table" aria-label="作业列表">
            <thead>
              <tr>
                <th>任务</th>
                {!exploration && <th>类型</th>}
                <th>状态{exploration && " / 当前阶段"}</th>
                {exploration ? (
                  <th>输入图组</th>
                ) : (
                  <>
                    <th className="iad-number">完成 / 总数</th>
                    <th className="iad-number">失败</th>
                  </>
                )}
                <th className="iad-job-time">
                  {exploration ? "提交时间" : "开始时间"}
                </th>
                {!knowledge && <th>操作</th>}
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr
                  key={item.run_id}
                  data-selected={job?.run_id === item.run_id}
                  ref={row => { if (row) rows.current.set(item.run_id, row); else rows.current.delete(item.run_id); }}
                  tabIndex={knowledge ? 0 : undefined}
                  aria-selected={knowledge ? selected === item.run_id : undefined}
                  aria-haspopup={knowledge ? "dialog" : undefined}
                  onClick={knowledge ? () => open(item) : undefined}
                  onKeyDown={knowledge ? event => { if (event.key === "Enter" || event.key === " ") event.preventDefault(); } : undefined}
                  onKeyUp={knowledge ? event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(item); } } : undefined}
                >
                  <td title={item.run_id}>
                    <span className="iad-identifier">{item.run_id}</span>
                  </td>
                  {!exploration && <td>{types[item.job_type]}</td>}
                  <td>
                    {item.cancel_requested &&
                    (item.status === "RUNNING" || item.status === "PENDING")
                      ? "正在停止"
                      : jobStatuses[item.status]}
                    {exploration && (
                      <small className="iad-job-stage">
                        {item.status === "PENDING"
                          ? `排队第 ${item.queue_position} 项`
                          : jobPhases[item.phase || ""] || item.message}
                      </small>
                    )}
                  </td>
                  {exploration ? (
                    <td>
                      良品{" "}
                      {item.exploration_request?.normal_images.length ?? "—"}
                      <br />
                      异常{" "}
                      {item.exploration_request?.defect_images.length ?? "—"}
                    </td>
                  ) : (
                    <>
                      <td className="iad-number">
                        {item.completed} / {item.total_samples}
                      </td>
                      <td className="iad-number">{item.failed}</td>
                    </>
                  )}
                  <td className="iad-job-time">
                    <time
                      dateTime={
                        (exploration ? item.submitted_at : item.started_at) ||
                        undefined
                      }
                    >
                      {(exploration ? item.submitted_at : item.started_at)
                        ? new Date(
                            (exploration
                              ? item.submitted_at
                              : item.started_at)!,
                          ).toLocaleString()
                        : "未提供"}
                    </time>
                  </td>
                  {!knowledge && <td>
                    <button
                      aria-label={`查看作业 ${item.run_id}`}
                      onClick={() =>
                        workspace.updateView(pageId, { job: item.run_id })
                      }
                    >
                      详情
                    </button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!exploration || filtered.length > 10 ? (
          <Pagination
            total={filtered.length}
            page={current}
            size={10}
            unit="个作业"
            onPage={setPage}
          />
        ) : (
          <p className="iad-muted">
            {filtered.length} 个作业 · 最近 30 项及运行项
          </p>
        )}
        {!filtered.length && <p role="status">没有匹配的作业。</p>}
      </div>
      {job && !knowledge && (
        <section aria-label="作业详情">
          <h3>作业详情</h3>
          <JobDetail
            key={job.run_id}
            job={job}
            onChanged={onChanged}
            stale={stale}
            lastSyncedAt={lastSyncedAt}
            onCopy={onCopy}
          />
        </section>
      )}
      {knowledge && drawerOpen && job && <Modal title="作业详情" className="iad-drawer iad-knowledge-job-drawer" onClose={() => setDrawerOpen(false)} restoreFocus={() => rows.current.get(selected) || filter.current}>
        <JobDetail key={job.run_id} job={job} onChanged={onChanged} stale={stale} lastSyncedAt={lastSyncedAt} onClose={() => setDrawerOpen(false)} presentation="drawer" />
      </Modal>}
    </div>
  );
}
