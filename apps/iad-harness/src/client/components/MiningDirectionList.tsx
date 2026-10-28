import React, { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import type {
  ExplorationCatalog,
  MiningDirection,
  MiningPromptConfiguration,
} from "../../shared/domain.generated.js";
import { useWorkspace } from "../workspace.js";
import { Modal } from "./Modal.js";

export function MiningDirectionList({
  configuration,
  catalog,
  opening,
  focusId,
  savedRevision,
  onChange,
  onSource,
}: {
  configuration: MiningPromptConfiguration;
  catalog: ExplorationCatalog | null;
  opening: string;
  focusId: string;
  savedRevision: string;
  onChange(configuration: MiningPromptConfiguration): void;
  onSource(id: string): void;
}) {
  const { workspace, state } = useWorkspace(),
    view = workspace.view("industrial-knowledge"),
    kind = state.knowledgeKind;
  const draft = configuration;
  const focusTarget = useRef<HTMLDivElement | null>(null);
  const [category, setCategory] = useState<MiningDirection["origin"]>(
      view.explorationVersion ? "explored" : "preset",
    ),
    [search, setSearch] = useState(""),
    [selectedOnly, setSelectedOnly] = useState(false);
  const [editing, setEditing] = useState<{
    original: MiningDirection;
    existed: boolean;
  } | null>(null);
  const [title, setTitle] = useState(""),
    [instruction, setInstruction] = useState(""),
    [adding, setAdding] = useState(false);
  const candidates =
    catalog?.exploration?.directions.filter(
      (item) => item.applies_to === "both" || item.applies_to === kind,
    ) || [];
  const rows: MiningDirection[] = [
    ...(draft?.directions || []),
    ...candidates
      .filter(
        (item) =>
          !draft?.directions.some(
            (row) => row.direction_id === item.direction_id,
          ),
      )
      .map((item) => ({
        direction_id: item.direction_id,
        title: item.title,
        instruction: item.instruction,
        enabled: false,
        origin: "explored" as const,
      })),
  ];
  const visible = rows.filter(
    (item) =>
      item.origin === category &&
      (!selectedOnly || item.enabled) &&
      `${item.title}\n${item.instruction}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  const focusOrigin = rows.find(
    (item) => item.direction_id === focusId,
  )?.origin;
  useEffect(() => {
    if (focusOrigin) setCategory(focusOrigin);
  }, [focusId, focusOrigin]);
  useEffect(() => {
    if (focusId) focusTarget.current?.scrollIntoView({ block: "nearest" });
  }, [category, focusId, catalog]);
  useEffect(() => {
    setEditing(null);
  }, [savedRevision]);
  function change(item: MiningDirection, patch: Partial<MiningDirection>) {
    if (!draft) return;
    const exists = draft.directions.some(
      (row) => row.direction_id === item.direction_id,
    );
    onChange({
      ...draft,
      directions: exists
        ? draft.directions.map((row) =>
            row.direction_id === item.direction_id ? { ...row, ...patch } : row,
          )
        : [...draft.directions, { ...item, ...patch }],
    });
  }
  return (
    <>
      <div className="iad-direction-tabs">
        {(
          [
            ["preset", "通用"],
            ["explored", "探索"],
            ["dataset", "自定义"],
          ] as const
        ).map(([origin, label]) => (
          <button
            key={origin}
            aria-label={`${label}方向`}
            aria-pressed={category === origin}
            onClick={() => setCategory(origin)}
          >
            {label} {rows.filter((item) => item.origin === origin).length}
          </button>
        ))}
      </div>
      {category === "explored" && (
        <label className="iad-field iad-exploration-version">
          探索版本
          <select
            aria-label="选用探索版本"
            value={catalog?.exploration?.version_id || ""}
            onChange={(event) =>
              workspace.updateView("industrial-knowledge", {
                explorationVersion: event.target.value,
              })
            }
          >
            <option value="" disabled>
              尚无探索结果
            </option>
            {catalog?.versions.map((version) => (
              <option key={version.version_id} value={version.version_id}>
                {version.created_at.slice(0, 19).replace("T", " ")} ·{" "}
                {version.direction_count} 项
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="iad-direction-tools">
        <label className="iad-field">
          搜索方向
          <input
            type="search"
            aria-label="搜索挖掘方向"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={selectedOnly}
            onChange={(event) => setSelectedOnly(event.target.checked)}
          />
          仅看已选
        </label>
        <button
          onClick={() => {
            setTitle("");
            setInstruction("");
            setAdding(true);
          }}
        >
          添加方向
        </button>
      </div>
      <p className="iad-muted">
        显示 {visible.length} 项 · 已选{" "}
        {draft.directions.filter((item) => item.enabled).length} 项
      </p>

      <div className="iad-direction-list">
        {visible.map((item) => (
          <div
            key={item.direction_id}
            ref={focusId === item.direction_id ? focusTarget : undefined}
            data-focused={focusId === item.direction_id}
          >
            <div className="iad-direction-row">
              <input
                type="checkbox"
                aria-label={`${draft.directions.some((row) => row.direction_id === item.direction_id) ? "启用方向" : "启用探索方向"} ${item.title}`}
                checked={item.enabled}
                onChange={(event) =>
                  change(item, { enabled: event.target.checked })
                }
              />
              <div className="iad-direction-label">
                <strong>{item.title}</strong>
                <p title={item.instruction}>{item.instruction}</p>
              </div>
              <div className="iad-direction-actions">
                {item.origin === "explored" && (
                  <button
                    disabled={opening === item.direction_id}
                    onClick={() => void onSource(item.direction_id)}
                  >
                    查看来源
                  </button>
                )}
                <button
                  aria-label={`编辑方向 ${item.title}`}
                  disabled={
                    !!editing &&
                    editing.original.direction_id !== item.direction_id
                  }
                  onClick={() =>
                    setEditing({
                      original: { ...item },
                      existed: draft.directions.some(
                        (row) => row.direction_id === item.direction_id,
                      ),
                    })
                  }
                >
                  编辑
                </button>
              </div>
            </div>
            {editing?.original.direction_id === item.direction_id && (
              <div className="iad-direction-editor">
                <label className="iad-field">
                  名称
                  <input
                    aria-label={`方向名称 ${item.direction_id}`}
                    value={item.title}
                    onChange={(event) =>
                      change(item, { title: event.target.value })
                    }
                  />
                </label>
                <label className="iad-field">
                  观察说明
                  <textarea
                    aria-label={`方向说明 ${item.direction_id}`}
                    rows={4}
                    value={item.instruction}
                    onChange={(event) =>
                      change(item, { instruction: event.target.value })
                    }
                  />
                </label>
                <div className="iad-row">
                  <button onClick={() => setEditing(null)}>完成编辑</button>
                  <button
                    onClick={() => {
                      onChange({
                        ...draft,
                        directions: editing.existed
                          ? draft.directions.map((row) =>
                              row.direction_id === item.direction_id
                                ? editing.original
                                : row,
                            )
                          : draft.directions.filter(
                              (row) => row.direction_id !== item.direction_id,
                            ),
                      });
                      setEditing(null);
                    }}
                  >
                    取消本行编辑
                  </button>
                  {draft.directions.some(
                    (row) => row.direction_id === item.direction_id,
                  ) && (
                    <button
                      className="iad-danger"
                      onClick={() => {
                        onChange({
                          ...draft,
                          directions: draft.directions.filter(
                            (row) => row.direction_id !== item.direction_id,
                          ),
                        });
                        setEditing(null);
                      }}
                    >
                      删除方向
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {!visible.length && <p className="iad-muted">没有匹配的方向。</p>}
      {adding && (
        <Modal
          title="添加自定义方向"
          onClose={() => setAdding(false)}
          className="iad-direction-add"
        >
          <label className="iad-field">
            名称
            <input
              aria-label="新方向名称"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="iad-field">
            观察说明
            <textarea
              aria-label="新方向说明"
              rows={3}
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
            />
          </label>
          <button
            disabled={!title.trim() || !instruction.trim()}
            onClick={() => {
              onChange({
                ...draft!,
                directions: [
                  ...draft!.directions,
                  {
                    direction_id: uuid(),
                    title: title.trim(),
                    instruction: instruction.trim(),
                    enabled: true,
                    origin: "dataset",
                  },
                ],
              });
              setCategory("dataset");
              setAdding(false);
            }}
          >
            添加数据集方向
          </button>
        </Modal>
      )}
    </>
  );
}
