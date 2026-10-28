import React, { useCallback, useEffect, useState } from "react";
import type { Dataset, JobSnapshot } from "../../shared/contracts.js";
import type {
  ExploredDirection,
  ExplorationCatalog,
  ExplorationSnapshot,
} from "../../shared/domain.generated.js";
import { message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { useJobs } from "../useJobs.js";
import { DirectionDetail } from "./DirectionDetail.js";
import { ExplorationSetup } from "./ExplorationSetup.js";
import { JobSync } from "./JobSync.js";
import { JobTable } from "./JobTable.js";
import { WorkbenchHeader } from "./layout/WorkbenchHeader.js";
import { PageTabs } from "./layout/PageTabs.js";

export function ExplorationPage({
  dataset,
  refreshRevision,
  headerActions,
}: {
  dataset: Dataset;
  refreshRevision: number;
  headerActions: React.ReactNode;
}) {
  const { workspace } = useWorkspace(),
    pageId = "industrial-exploration",
    view = workspace.view(pageId);
  const [catalog, setCatalog] = useState<ExplorationCatalog | null>(null),
    [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<{
    snapshot: ExplorationSnapshot;
    direction: ExploredDirection;
  } | null>(null);
  const changed = useCallback(() => setRevision((value) => value + 1), []);
  const jobs = useJobs(
    "exploration",
    dataset.dataset_id,
    changed,
    view.job,
    refreshRevision,
  );
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ dataset_id: dataset.dataset_id });
    if (view.version) query.set("version_id", view.version);
    request<ExplorationCatalog>(
      `/exploration?${query}`,
      undefined,
      undefined,
      controller.signal,
    )
      .then((value) => {
        if (!controller.signal.aborted) {
          setCatalog((previous) =>
            !view.version && previous?.exploration
              ? { ...value, exploration: previous.exploration }
              : value,
          );
          setError("");
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(message(error));
      });
    return () => controller.abort();
  }, [dataset.dataset_id, view.version, revision, refreshRevision]);
  const active = jobs.jobs.find((job) => job.status === "RUNNING");
  function refresh() {
    jobs.refresh();
    changed();
  }
  function copy(job: JobSnapshot) {
    const input = job.exploration_request;
    if (!input) return;
    const prompt = job.exploration_prompt;
    workspace.updateView(pageId, {
      tab: "setup",
      explorationNormalImages: [...input.normal_images],
      explorationDefectImages: [...input.defect_images],
      explorationNormalCount: String(input.normal_images.length),
      explorationDefectCount: String(input.defect_images.length),
      explorationObjective: input.objective || "",
      explorationPrompt: prompt,
      explorationPromptBase: prompt?.preset_id ? "" : prompt?.text || "",
    });
  }
  const result = catalog?.exploration,
    latest = catalog?.versions[0];
  return (
    <div className="iad-exploration-page">
      <WorkbenchHeader
        pageId={pageId}
        title={view.tab === "setup" ? "新建探索" : undefined}
      >
        {headerActions}
        <button
          className={view.tab === "setup" ? "" : "iad-primary"}
          onClick={() =>
            workspace.updateView(pageId, {
              tab: view.tab === "setup" ? "results" : "setup",
            })
          }
        >
          {view.tab === "setup" ? "返回探索结果" : "新建探索"}
        </button>
      </WorkbenchHeader>
      <JobSync {...jobs} refresh={refresh} />
      {error && (
        <p role="alert" className="iad-error">
          {error}
        </p>
      )}
      {view.tab === "setup" ? (
        <ExplorationSetup
          dataset={dataset}
          jobs={jobs}
          refreshRevision={refreshRevision}
        />
      ) : (
        <PageTabs
          label="方向探索视图"
          items={[
            { id: "results", label: "探索结果" },
            { id: "jobs", label: "探索作业" },
          ]}
          value={view.tab}
          onChange={(tab) => workspace.updateView(pageId, { tab })}
        >
          {view.tab === "jobs" ? (
            <section className="iad-job-section">
              <div className="iad-section-header">
                <h2>探索作业</h2>
                <span>排队 {jobs.pendingCount} 项</span>
              </div>
              <JobTable
                jobs={jobs.jobs}
                pageId={pageId}
                onChanged={jobs.refresh}
                stale={jobs.syncState === "stale"}
                lastSyncedAt={jobs.lastSyncedAt}
                onCopy={copy}
              />
            </section>
          ) : !result ? (
            <div className="iad-empty">
              <h2>
                {active || jobs.pendingCount ? "探索正在进行" : "尚无探索结果"}
              </h2>
              <p>
                {active || jobs.pendingCount
                  ? "整组结果返回后发布方向。"
                  : "选择良品和异常样例，建立适合当前数据集的探索方向。"}
              </p>
              <button
                className="iad-primary"
                onClick={() =>
                  workspace.updateView(pageId, {
                    tab: active || jobs.pendingCount ? "jobs" : "setup",
                  })
                }
              >
                {active || jobs.pendingCount ? "查看运行状态" : "新建探索"}
              </button>
            </div>
          ) : (
            <section className="iad-exploration-results">
              <div className="iad-section-header">
                <h2>候选方向</h2>
                <select
                  aria-label="探索结果版本"
                  value={result.version_id}
                  onChange={(event) =>
                    workspace.updateView(pageId, {
                      version: event.target.value,
                    })
                  }
                >
                  {catalog.versions.map((version) => (
                    <option key={version.version_id} value={version.version_id}>
                      {version.created_at.slice(0, 19).replace("T", " ")} ·{" "}
                      {version.direction_count} 项方向
                    </option>
                  ))}
                </select>
              </div>
              {latest && latest.version_id !== result.version_id && (
                <button
                  onClick={() =>
                    workspace.updateView(pageId, { version: latest.version_id })
                  }
                >
                  查看新发布结果
                </button>
              )}
              <p className="iad-muted">{result.summary}</p>
              {result.directions.length ? (
                <div className="iad-table-scroll">
                  <table className="iad-resource-table" aria-label="探索方向">
                    <thead>
                      <tr>
                        <th>方向</th>
                        <th>适用知识</th>
                        <th className="iad-number">证据</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.directions.map((direction) => (
                        <tr key={direction.direction_id}>
                          <td>
                            <strong>{direction.title}</strong>
                          </td>
                          <td>
                            {direction.applies_to === "both"
                              ? "良品与异常"
                              : direction.applies_to === "normal"
                                ? "良品"
                                : "异常"}
                          </td>
                          <td className="iad-number">
                            {direction.evidence_ids.length}
                          </td>
                          <td>
                            <button
                              onClick={() =>
                                setDetail({ snapshot: result, direction })
                              }
                            >
                              查看方向
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>本批样例未形成可用探索方向。</p>
              )}
              {!!result.limitations.length && (
                <details>
                  <summary>整体限制</summary>
                  {result.limitations.map((text, index) => (
                    <p key={index}>{text}</p>
                  ))}
                </details>
              )}
            </section>
          )}
        </PageTabs>
      )}
      {detail && (
        <DirectionDetail
          {...detail}
          onClose={() => setDetail(null)}
          onGo={(kind) =>
            workspace.openLocation({
              pageId: "industrial-knowledge",
              datasetId: dataset.dataset_id,
              knowledgeKind: kind,
              explorationVersion: detail.snapshot.version_id,
              directionFocus: detail.direction.direction_id,
              tab: "setup",
            })
          }
        />
      )}
    </div>
  );
}
