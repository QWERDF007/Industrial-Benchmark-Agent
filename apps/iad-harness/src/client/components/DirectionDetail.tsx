import {Select} from './Select.js';
import {Button} from './Button.js';
import {ThumbnailCard} from "./ThumbnailCard.js";
import {IconButton} from "./IconButton.js";

import React, { useEffect, useRef, useState } from "react";
import type {
  ExploredDirection,
  ExplorationSnapshot,
  FrozenExplorationPrompt,
  JobSnapshot,
} from "../../shared/domain.generated.js";
import { message, request } from "../api.js";
import { Modal } from "./Modal.js";
import { ImageViewer, type EvidenceCollection } from "./ImageViewer.js";
import { MediaImage, MediaLoad } from "./MediaLoad.js";

import {directionEvidence, ReferencedText} from "../direction-evidence.js";

export function DirectionDetail({
  snapshot,
  direction,
  onClose,
  onGo,
}: {
  snapshot: ExplorationSnapshot;
  direction: ExploredDirection;
  onClose(): void;
  onGo?(kind: "normal" | "defect"): void;
}) {
  const [imageIndex, setImageIndex] = useState<number | null>(null),
    [expanded, setExpanded] = useState(false),
    [focused, setFocused] = useState<{ id: string } | null>(null),
    [previewed, setPreviewed] = useState("");
  const [destination, setDestination] = useState<"normal" | "defect">(
    direction.applies_to === "defect" ? "defect" : "normal",
  );
  const [promptOpen, setPromptOpen] = useState(false),
    [promptRevision, setPromptRevision] = useState(0),
    [frozenPrompt, setFrozenPrompt] = useState<FrozenExplorationPrompt | null>(
      snapshot.request.prompt || null,
    ),
    [promptError, setPromptError] = useState(""),
    [promptLoading, setPromptLoading] = useState(false);
  useEffect(() => {
    if (!promptOpen || frozenPrompt) return;
    const controller = new AbortController();
    setPromptLoading(true);
    setPromptError("");
    request<JobSnapshot>(
      `/exploration/status/${encodeURIComponent(snapshot.run_id)}`,
      undefined,
      undefined,
      controller.signal,
    )
      .then((job) => {
        if (!controller.signal.aborted) {
          setPromptLoading(false);
          setFrozenPrompt(job.exploration_prompt);
          if (!job.exploration_prompt) setPromptError("原任务未记录提示词。");
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setPromptError(message(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setPromptLoading(false);
      });
    return () => controller.abort();
  }, [promptOpen, promptRevision, snapshot.run_id, frozenPrompt]);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const {entries, references, counters}=directionEvidence(snapshot,direction);
  const collection: EvidenceCollection = {
    title: direction.title,
    instruction: direction.instruction,
    index: imageIndex || 0,
    images: entries.flatMap((entry) =>
      entry.evidence
        ? [
            {
              id: entry.id,
              originalSize: entry.evidence.image.original_size,
              label: entry.label,
              group:
                entry.kind === "normal"
                  ? "候选良品"
                  : entry.kind === "defect"
                    ? "候选异常"
                    : "其他证据",
              image: {
                src: `/api/iad/exploration/evidence/${encodeURIComponent(snapshot.version_id)}/${encodeURIComponent(entry.id)}`,
                title: entry.title,
                width: entry.evidence.image.sent_size[0],
                height: entry.evidence.image.sent_size[1],sampleId:entry.evidence.sample_id,evidence:entry.evidence.image,
              },
            },
          ]
        : [],
    ),
  };
  useEffect(() => {
    if (focused) {
      const element = buttons.current.get(focused.id);
      element?.scrollIntoView({ block: "nearest" });
      element?.focus({ preventScroll: true });
    }
  }, [focused, expanded]);
  const locate = (id: string) => {
    setExpanded(true);
    setFocused({ id });
  };
  const preview = (id: string, active: boolean) => {
    if (active) setExpanded(true);
    setPreviewed((current) => active ? id : current === id ? "" : current);
  };
  return (
    <>
      <Modal
        title={direction.title}
        className="iad-direction-dialog"
        onClose={onClose}
      >
        <div className="iad-direction-body">
          <div className="iad-direction-meta">
            <span>候选方向</span>
            <span>
              {direction.applies_to === "both"
                ? "良品与异常"
                : direction.applies_to === "normal"
                  ? "良品"
                  : "异常"}
            </span>
            <span title={snapshot.version_id}>
              来源 {snapshot.created_at.slice(0, 19).replace("T", " ")}
            </span>
          </div>
          <section className="iad-direction-objective">
            <h3>观察目标</h3>
            <p>
              <ReferencedText
                text={direction.instruction}
                references={references}
                onReference={locate}
                onPreview={preview}
              />
            </p>
          </section>
          <div className="iad-direction-text-grid">
            <section>
              <h3>比较依据</h3>
              <p>
                <ReferencedText
                  text={direction.rationale}
                  references={references}
                  onReference={locate}
                  onPreview={preview}
                />
              </p>
            </section>
            <section>
              <h3>限制与待确认</h3>
              {direction.limitations.length ? (
                <ul>
                  {direction.limitations.map((text, index) => (
                    <li key={index}>
                      <ReferencedText
                        text={text}
                        references={references}
                        onReference={locate}
                        onPreview={preview}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="iad-muted">未记录限制。</p>
              )}
            </section>
          </div>
          <section className="iad-direction-evidence">
            <h3>图像证据，{entries.length}</h3>
            <div
              className="iad-evidence-groups"
              style={
                {
                  "--iad-normal-width": `${Math.max(counters.normal, 1)}fr`,
                  "--iad-defect-width": `${Math.max(counters.defect, 1)}fr`,
                } as React.CSSProperties
              }
            >
              {(
                [
                  ["normal", "候选良品"],
                  ["defect", "候选异常"],
                  ["unknown", "其他与缺失"],
                ] as const
              ).map(([kind, label]) => {
                const group = entries.filter((entry) => entry.kind === kind);
                return (
                  !!group.length && (
                    <section key={kind} className="iad-evidence-group">
                      <h4>
                        {label} <span>{group.length} 张</span>
                      </h4>
                      <MediaLoad className="iad-evidence-thumbnails">
                        <div
                          style={
                            {
                              "--iad-evidence-columns": Math.min(
                                group.length,
                                8,
                              ),
                            } as React.CSSProperties
                          }
                        >
                          {group
                            .slice(0, expanded ? undefined : 8)
                            .map((entry) => {
                              const item = collection.images.find(
                                (item) => item.id === entry.id,
                              );
                              return item ? (
                                <ThumbnailCard
                                  key={entry.id}
                                  ref={(element) => {
                                    if (element)
                                      buttons.current.set(entry.id, element);
                                    else buttons.current.delete(entry.id);
                                  }}
                                  src={item.image.src} label={item.label}
                                  data-focused={(previewed || focused?.id) === entry.id}
                                  aria-label={`查看证据 ${entry.label}`}
                                  onClick={() =>
                                    setImageIndex(
                                      collection.images.indexOf(item),
                                    )
                                  }
                                />
                              ) : (
                                <div
                                  key={entry.id}
                                  className="iad-missing-evidence"
                                  role="status"
                                >
                                  证据缺失<code>{entry.id}</code>
                                </div>
                              );
                            })}
                        </div>
                      </MediaLoad>
                      {!expanded && group.length > 8 && (
                        <button onClick={() => setExpanded(true)}>
                          展开更多，{group.length - 8} 张
                        </button>
                      )}
                    </section>
                  )
                );
              })}
            </div>
          </section>
          <details className="iad-direction-trace">
            <summary>完整 ID 与来源明细</summary>
            <dl>
              <dt>方向 ID</dt>
              <dd>{direction.direction_id}</dd>
              <dt>版本 ID</dt>
              <dd>{snapshot.version_id}</dd>
              <dt>作业 ID</dt>
              <dd>{snapshot.run_id}</dd>
            </dl>
            {entries.map((entry) => (
              <p key={entry.id}>
                {entry.label}，{entry.id}
                <br />
                {entry.evidence?.sample_id || "未记录来源"}
              </p>
            ))}
            <details
              open={promptOpen}
              onToggle={(event) => setPromptOpen(event.currentTarget.open)}
            >
              <summary>探索冻结提示词</summary>
              {promptLoading ? (
                <p role="status">正在读取原任务提示词…</p>
              ) : frozenPrompt ? (
                <pre className="iad-observation">{frozenPrompt.text}</pre>
              ) : (
                <p>
                  {promptError || "未记录"}
                  <IconButton icon="refresh" label="重新读取提示词" onClick={() => setPromptRevision((value) => value + 1)} />
                </p>
              )}
            </details>
          </details>
        </div>
        <footer className="iad-direction-footer">
          <button onClick={onClose}>返回</button>
          {onGo && (
            <>
              <label className="iad-direction-destination">
                用于知识类型
                <Select
                  aria-label="采用知识类型"
                  value={destination}
                  onChange={(event) =>
                    setDestination(event.target.value as "normal" | "defect")
                  }
                >
                  {(
                    [
                      ["normal", "良品"],
                      ["defect", "异常"],
                    ] as const
                  )
                    .filter(
                      ([kind]) =>
                        direction.applies_to === "both" ||
                        direction.applies_to === kind,
                    )
                    .map(([kind, label]) => (
                      <option key={kind} value={kind}>
                        {label}
                      </option>
                    ))}
                </Select>
              </label>
              <Button variant="primary" onClick={() => onGo(destination)}>
                去知识挖掘
              </Button>
            </>
          )}
        </footer>
      </Modal>
      {imageIndex !== null && collection.images[imageIndex] && (
        <ImageViewer
          image={collection.images[imageIndex].image}
          collection={collection}
          onClose={() => setImageIndex(null)}
        />
      )}
    </>
  );
}
