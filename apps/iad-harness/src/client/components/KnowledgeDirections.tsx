import React, { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import type {
  ExploredDirection,
  ExplorationCatalog,
  ExplorationSnapshot,
  MiningPrompt,
  MiningPromptConfiguration,
} from "../../shared/domain.generated.js";
import { message, request } from "../api.js";
import { useUnsavedChanges } from "../useUnsavedChanges.js";
import { useWorkspace } from "../workspace.js";
import { DirectionDetail } from "./DirectionDetail.js";
import { Modal } from "./Modal.js";
import { MiningDirectionList } from "./MiningDirectionList.js";

export interface DirectionProposal {
  id: string;
  datasetId: string;
  kind: "normal" | "defect";
  title: string;
  instruction: string;
}
export interface MiningConfigurationState {
  reason: string;
  count: number;
  revision: string;
}

export function KnowledgeDirections({
  datasetId,
  kind,
  proposal,
  onPending,
  onProposalUsed,
  onState,
}: {
  datasetId: string;
  kind: "normal" | "defect";
  proposal?: DirectionProposal;
  onPending(value: boolean): void;
  onProposalUsed(): void;
  onState?(state: MiningConfigurationState): void;
}) {
  const { workspace } = useWorkspace(),
    view = workspace.view("industrial-knowledge");
  const [catalog, setCatalog] = useState<ExplorationCatalog | null>(null),
    [catalogError, setCatalogError] = useState("");
  const [saved, setSaved] = useState<MiningPrompt | null>(null),
    [draft, setDraft] = useState<MiningPromptConfiguration | null>(null);
  const [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [revision, setRevision] = useState(0);
  const [focus, setFocus] = useState("");
  const [confirmation, setConfirmation] = useState<
      "discard" | "reset" | "reload" | null
    >(null),
    [preview, setPreview] = useState<MiningPrompt | null>(null);
  const [source, setSource] = useState<{
      snapshot: ExplorationSnapshot;
      direction: ExploredDirection;
    } | null>(null),
    [opening, setOpening] = useState("");
  const applied = useRef(""),
    alive = useRef(true);
  const query = new URLSearchParams({ dataset_id: datasetId, kind }).toString();
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setCatalogError("");
    setCatalog(null);
    const params = new URLSearchParams({ dataset_id: datasetId });
    if (view.explorationVersion)
      params.set("version_id", view.explorationVersion);
    request<ExplorationCatalog>(
      `/exploration?${params}`,
      undefined,
      undefined,
      controller.signal,
    )
      .then((value) => {
        if (!controller.signal.aborted) setCatalog(value);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setCatalogError(message(error));
      });
    return () => controller.abort();
  }, [datasetId, view.explorationVersion]);
  useEffect(() => {
    const controller = new AbortController();
    setSaved(null);
    setDraft(null);
    setError("");
    request<MiningPrompt>(
      `/knowledge/prompt?${query}`,
      undefined,
      undefined,
      controller.signal,
    )
      .then((value) => {
        if (!controller.signal.aborted) {
          setSaved(value);
          setDraft(value.configuration);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(message(error));
      });
    return () => controller.abort();
  }, [query, revision]);
  useEffect(() => {
    if (
      !proposal ||
      !draft ||
      saving ||
      applied.current === proposal.id ||
      proposal.datasetId !== datasetId ||
      proposal.kind !== kind
    )
      return;
    applied.current = proposal.id;
    onProposalUsed();
    if (
      draft.directions.some(
        (item) =>
          item.title.trim().toLocaleLowerCase() ===
          proposal.title.trim().toLocaleLowerCase(),
      )
    ) {
      setError("已有同名方向，请编辑现有说明。");
      return;
    }
    const directionId = uuid();
    setFocus(directionId);
    setDraft({
      ...draft,
      directions: [
        ...draft.directions,
        {
          direction_id: directionId,
          title: proposal.title,
          instruction: proposal.instruction,
          enabled: true,
          origin: "dataset",
        },
      ],
    });
  }, [proposal, draft, saving, datasetId, kind, onProposalUsed]);
  const dirty =
    !!saved && JSON.stringify(saved.configuration) !== JSON.stringify(draft);
  const invalid =
    !!draft &&
    (!draft.objective.trim() ||
      draft.directions.some(
        (item) => !item.title.trim() || !item.instruction.trim(),
      ) ||
      new Set(
        draft.directions.map((item) => item.title.trim().toLocaleLowerCase()),
      ).size !== draft.directions.length);
  const reason = saving
    ? "正在保存挖掘方向。"
    : invalid
      ? "请填写目标、方向名称和说明，方向名称不能重复。"
      : error
        ? "方向保存或读取失败，请先处理。"
        : !saved
          ? "正在读取挖掘方向。"
          : dirty
            ? "请先保存有效的挖掘方向。"
            : "";
  useUnsavedChanges(dirty);
  useEffect(() => {
    onPending(!!reason);
    onState?.({
      reason,
      count:
        saved?.configuration.directions.filter((item) => item.enabled).length ||
        0,
      revision: saved?.revision || "",
    });
  }, [reason, saved, onPending, onState]);
  async function save(reset = false) {
    if (!saved || !draft) return;
    setSaving(true);
    setError("");
    try {
      const value = await request<MiningPrompt>("/knowledge/prompt", {
        dataset_id: datasetId,
        kind,
        expected_revision: saved.revision,
        configuration: reset ? null : draft,
      });
      if (alive.current) {
        setSaved(value);
        setDraft(value.configuration);
      }
    } catch (error) {
      if (alive.current) setError(message(error));
    } finally {
      if (alive.current) setSaving(false);
    }
  }
  async function openSource(id: string) {
    setOpening(id);
    setCatalogError("");
    try {
      const value = catalog?.exploration?.directions.some(
        (direction) => direction.direction_id === id,
      )
        ? catalog
        : await request<ExplorationCatalog>(
            `/exploration?${new URLSearchParams({ dataset_id: datasetId, direction_id: id })}`,
          );
      const snapshot = value?.exploration,
        direction = snapshot?.directions.find(
          (item) => item.direction_id === id,
        );
      if (!snapshot || !direction)
        throw new Error("没有找到该方向的原始探索记录。");
      if (alive.current) setSource({ snapshot, direction });
    } catch (error) {
      if (alive.current) setCatalogError(message(error));
    } finally {
      if (alive.current) setOpening("");
    }
  }
  return (
    <div className="iad-mining-directions">
      {!draft ? (
        <section className="iad-setup-section">
          <h3>2. 挖掘目标</h3>
          {!error && <p role="status">正在读取挖掘方向…</p>}
        </section>
      ) : (
        <>
          <section className="iad-setup-section">
            <h3>2. 挖掘目标</h3>
            <label className="iad-field">
              本次观察目标
              <textarea
                aria-label="挖掘目标"
                disabled={saving}
                rows={3}
                value={draft.objective}
                onChange={(event) => {
                  setDraft({ ...draft, objective: event.target.value });
                  setError("");
                }}
              />
            </label>
          </section>
          <section className="iad-setup-section">
            <h3 data-action="mining-directions">3. 挖掘方向</h3>
            <fieldset className="iad-directions-form" disabled={saving}>
              {catalogError && <p role="alert">{catalogError}</p>}
              <MiningDirectionList
                configuration={draft}
                catalog={catalog}
                opening={opening}
                focusId={focus || view.directionFocus}
                savedRevision={saved?.revision || ""}
                onChange={(value) => {
                  setDraft(value);
                  setError("");
                }}
                onSource={(id) => void openSource(id)}
              />
              {invalid && <p role="alert">{reason}</p>}
              <div className="iad-direction-savebar">
                <span className="iad-muted">{dirty ? "未保存" : "已保存"}</span>
                <button
                  className="iad-primary"
                  data-action="save-mining-directions"
                  disabled={!dirty || invalid || saving}
                  onClick={() => void save()}
                >
                  {saving ? "保存中…" : "保存方向"}
                </button>
                <button
                  disabled={!dirty || saving}
                  onClick={() => setConfirmation("discard")}
                >
                  放弃修改
                </button>
                <button
                  disabled={saving || (!saved?.customized && !dirty)}
                  onClick={() => setConfirmation("reset")}
                >
                  恢复默认方向
                </button>
                <button disabled={!saved} onClick={() => setPreview(saved)}>
                  预览已保存提示词
                </button>
              </div>
            </fieldset>
          </section>
        </>
      )}
      {error && (
        <p role="alert" className="iad-error">
          {error}{" "}
          <button
            onClick={() =>
              dirty
                ? setConfirmation("reload")
                : setRevision((value) => value + 1)
            }
          >
            重新载入
          </button>
          <button
            onClick={() => {
              void request<MiningPrompt>(`/knowledge/prompt?${query}`)
                .then((value) => {
                  if (alive.current) setPreview(value);
                })
                .catch((error) => {
                  if (alive.current) setError(message(error));
                });
            }}
          >
            查看服务器版本
          </button>
        </p>
      )}
      {confirmation && (
        <Modal
          title={
            confirmation === "reset"
              ? "恢复默认方向？"
              : confirmation === "discard"
                ? "放弃修改？"
                : "载入服务器配置？"
          }
          className="iad-confirm-dialog"
          onClose={() => setConfirmation(null)}
        >
          <p>
            {confirmation === "reset"
              ? "恢复默认会移除自定义和已采用方向。"
              : confirmation === "discard"
                ? "恢复上次保存的目标和方向。"
                : "服务器配置将替换当前草稿。"}
          </p>
          <div className="iad-form-actions">
            <button onClick={() => setConfirmation(null)}>保留当前编辑</button>
            <button
              className="iad-primary"
              onClick={() => {
                if (confirmation === "reset") void save(true);
                else if (confirmation === "discard") {
                  setDraft(saved!.configuration);
                  setError("");
                } else setRevision((value) => value + 1);
                setConfirmation(null);
              }}
            >
              {confirmation === "reset"
                ? "确认恢复默认"
                : confirmation === "discard"
                  ? "确认放弃"
                  : "重新载入服务器配置"}
            </button>
          </div>
        </Modal>
      )}
      {preview && (
        <Modal title="已保存的挖掘提示词" onClose={() => setPreview(null)}>
          <p className="iad-muted" title={preview.revision}>
            保存版本 {preview.revision}
          </p>
          <pre className="iad-observation">{preview.instruction}</pre>
          <button onClick={() => setPreview(null)}>关闭</button>
        </Modal>
      )}
      {source && (
        <DirectionDetail {...source} onClose={() => setSource(null)} />
      )}
    </div>
  );
}
