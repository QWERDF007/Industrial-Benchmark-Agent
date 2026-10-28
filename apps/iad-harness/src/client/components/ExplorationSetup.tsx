import React, { useEffect, useRef, useState } from "react";
import type { Dataset, JobSnapshot } from "../../shared/contracts.js";
import type { ExplorationPromptPreset } from "../../shared/domain.generated.js";
import { message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { useJobs } from "../useJobs.js";
import { useWorkbenchModel, WorkbenchModelStatus } from "../models.js";
import { ExplorationSources } from "./ExplorationSources.js";
import { ExplorationPromptEditor } from "./ExplorationPromptEditor.js";
import { ExplorationProgress } from "./ExplorationProgress.js";
import { Modal } from "./Modal.js";

export function ExplorationSetup({
  dataset,
  jobs,
  refreshRevision,
}: {
  dataset: Dataset;
  jobs: ReturnType<typeof useJobs>;
  refreshRevision: number;
}) {
  const { workspace } = useWorkspace(),
    pageId = "industrial-exploration",
    view = workspace.view(pageId);
  const model = useWorkbenchModel();
  const [presets, setPresets] = useState<ExplorationPromptPreset[]>([]),
    [presetError, setPresetError] = useState("");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [normalSelecting, setNormalSelecting] = useState(false),
    [defectSelecting, setDefectSelecting] = useState(false),
    [preview, setPreview] = useState(false),
    [uncertainAfter, setUncertainAfter] = useState<number | null>(null);
  const [enteredAt] = useState(Date.now);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => jobs.refresh(), [jobs.refresh]);
  useEffect(() => {
    const controller = new AbortController();
    request<{ presets: ExplorationPromptPreset[] }>(
      "/exploration/presets",
      undefined,
      undefined,
      controller.signal,
    )
      .then((value) => {
        if (controller.signal.aborted) return;
        setPresets(value.presets);
        setPresetError("");
        const current = workspace.view(pageId);
        const original = value.presets.find(
          (preset) => preset.id === current.explorationPrompt?.preset_id,
        );
        if (
          current.explorationPrompt &&
          !current.explorationPromptBase &&
          original &&
          workspace.getSnapshot().datasetId === dataset.dataset_id
        )
          workspace.updateView(
            pageId,
            { explorationPromptBase: original.text },
            true,
          );
        if (
          !workspace.view(pageId).explorationPrompt &&
          workspace.getSnapshot().datasetId === dataset.dataset_id
        ) {
          const preset = value.presets[0];
          workspace.updateView(
            pageId,
            {
              explorationPrompt: {
                preset_id: preset.id,
                preset_name: preset.name,
                text: preset.text,
              },
              explorationPromptBase: preset.text,
            },
            true,
          );
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setPresetError(message(error));
      });
    return () => controller.abort();
  }, [dataset.dataset_id, workspace, refreshRevision]);
  const active = jobs.jobs.find((job) => job.status === "RUNNING"),
    occupied = active || jobs.pendingCount > 0;
  const normalCount = Number(view.explorationNormalCount),
    defectCount = Number(view.explorationDefectCount);
  const valid =
    Number.isInteger(normalCount) &&
    normalCount > 0 &&
    Number.isInteger(defectCount) &&
    defectCount > 0 &&
    view.explorationNormalImages.length === normalCount &&
    view.explorationDefectImages.length === defectCount;
  const unconfirmed =
    uncertainAfter !== null &&
    (!jobs.lastSyncedAt || jobs.lastSyncedAt < uncertainAfter);
  const reason = busy
    ? "正在提交本次探索。"
    : normalSelecting || defectSelecting
      ? "请先完成图组选择。"
      : jobs.syncState === "stale" ||
          !jobs.lastSyncedAt ||
          jobs.lastSyncedAt < enteredAt ||
          unconfirmed
        ? "请先同步作业状态，确认已有提交。"
        : !view.explorationPrompt?.text.trim()
          ? "请填写提示词正文。"
          : !valid
            ? "请按目标数量选择两组图像。"
            : !model.ready
              ? "请先配置工作台模型。"
              : "";
  async function run() {
    setBusy(true);
    setError("");
    try {
      const job = await request<JobSnapshot>("/exploration/start", {
        dataset_id: dataset.dataset_id,
        normal_images: view.explorationNormalImages,
        defect_images: view.explorationDefectImages,
        prompt: view.explorationPrompt,
        ...(view.explorationObjective.trim()
          ? { objective: view.explorationObjective }
          : {}),
      });
      if (!alive.current) return;
      const current = workspace.getSnapshot();
      if (current.datasetId === dataset.dataset_id && current.pageId === pageId)
        workspace.updateView(pageId, { job: job.run_id, tab: "jobs" });
      jobs.refresh();
    } catch (error) {
      if (alive.current) {
        setError(message(error));
        setUncertainAfter(Date.now());
        jobs.refresh();
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <>
      {error && (
        <p role="alert" className="iad-error">
          {error}
        </p>
      )}
      <div className="iad-exploration-setup-layout" aria-label="方向探索配置">
        <div className="iad-exploration-fields iad-panel">
          <section className="iad-setup-section">
            <h3>1. 探索提示词</h3>
            {presetError && <p role="alert">{presetError}</p>}
            {view.explorationPrompt ? (
              <ExplorationPromptEditor
                presets={presets}
                value={view.explorationPrompt}
                base={view.explorationPromptBase}
                disabled={busy}
                onChange={(explorationPrompt, explorationPromptBase) => {
                  if (workspace.getSnapshot().datasetId === dataset.dataset_id)
                    workspace.updateView(
                      pageId,
                      { explorationPrompt, explorationPromptBase },
                      true,
                    );
                }}
                onCreated={(preset) =>
                  setPresets((values) => [...values, preset])
                }
              />
            ) : (
              <p role="status">正在读取提示词预设…</p>
            )}
            <label className="iad-field">
              补充目标（可选）
              <textarea
                aria-label="方向探索目标"
                disabled={busy}
                value={view.explorationObjective}
                rows={2}
                onChange={(event) =>
                  workspace.updateView(
                    pageId,
                    { explorationObjective: event.target.value },
                    true,
                  )
                }
              />
            </label>
          </section>
          <section className="iad-setup-section">
            <h3>2. 对比样例</h3>
            <div className="iad-exploration-groups">
              <ExplorationSources
                dataset={dataset}
                kind="normal"
                disabled={busy}
                count={view.explorationNormalCount}
                images={view.explorationNormalImages}
                onCount={(explorationNormalCount) =>
                  workspace.updateView(pageId, { explorationNormalCount })
                }
                onImages={(explorationNormalImages) => {
                  if (workspace.getSnapshot().datasetId === dataset.dataset_id)
                    workspace.updateView(pageId, { explorationNormalImages });
                }}
                onSelecting={setNormalSelecting}
              />
              <ExplorationSources
                dataset={dataset}
                kind="defect"
                disabled={busy}
                count={view.explorationDefectCount}
                images={view.explorationDefectImages}
                onCount={(explorationDefectCount) =>
                  workspace.updateView(pageId, { explorationDefectCount })
                }
                onImages={(explorationDefectImages) => {
                  if (workspace.getSnapshot().datasetId === dataset.dataset_id)
                    workspace.updateView(pageId, { explorationDefectImages });
                }}
                onSelecting={setDefectSelecting}
              />
            </div>
          </section>
        </div>
        <aside className="iad-exploration-side">
          <section className="iad-panel">
            <h3>3. 运行确认</h3>
            <WorkbenchModelStatus />
            <dl>
              <dt>提示词</dt>
              <dd>
                {view.explorationPrompt?.preset_name || "自定义提示词"}
                {view.explorationPrompt &&
                  view.explorationPrompt.text !== view.explorationPromptBase &&
                  " · 已修改"}
              </dd>
              <dt>输入图组</dt>
              <dd>
                良品 {view.explorationNormalImages.length} · 异常{" "}
                {view.explorationDefectImages.length}
              </dd>
              <dt>执行方式</dt>
              <dd>全部图像一次联合输入</dd>
            </dl>
            <button
              disabled={!view.explorationPrompt}
              onClick={() => setPreview(true)}
            >
              查看本次执行文本
            </button>
            <div className="iad-form-footer">
              {reason && <p className="iad-muted">{reason}</p>}
              <button
                className="iad-primary"
                disabled={!!reason}
                onClick={() => void run()}
              >
                {busy ? "提交中…" : occupied ? "加入队列" : "开始探索"}
              </button>
            </div>
          </section>
          <section className="iad-panel iad-execution-rail">
            <h3>运行队列</h3>
            {active ? (
              <>
                <ExplorationProgress
                  job={active}
                  stale={jobs.syncState === "stale"}
                  lastSyncedAt={jobs.lastSyncedAt}
                />
                <button
                  onClick={() =>
                    workspace.updateView(pageId, {
                      tab: "jobs",
                      job: active.run_id,
                    })
                  }
                >
                  查看运行状态
                </button>
              </>
            ) : (
              <p className="iad-muted">暂无运行任务。</p>
            )}
            {jobs.pendingCount > 0 && <p>排队 {jobs.pendingCount} 项</p>}
          </section>
        </aside>
      </div>{" "}
      {preview && (
        <Modal title="本次探索提示词" onClose={() => setPreview(false)}>
          <pre className="iad-observation">
            {view.explorationPrompt?.text}
            {view.explorationObjective.trim() &&
              `\n\n补充目标：${view.explorationObjective}`}
          </pre>
          <button onClick={() => setPreview(false)}>关闭</button>
        </Modal>
      )}
    </>
  );
}
