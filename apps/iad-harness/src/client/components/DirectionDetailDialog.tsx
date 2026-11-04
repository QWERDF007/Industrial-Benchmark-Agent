import React, { useEffect, useRef } from "react";
import { CloseIcon } from "../AuditIcon.js";
import { IconButton } from "./IconButton.js";

export interface DirectionEvidenceItem {
  evidenceId: string;
  sampleId: string;
  ref: string;
  label: string;
  kind: "normal" | "defect";
  url: string;
  fullUrl: string;
  filename: string;
}

export interface DirectionItem {
  id: string;
  title: string;
  applies: string;
  brief: string;
  rationale?: string;
  evidenceIds?: string[];
  limit: string;
  limitations?: string[];
  evidences?: DirectionEvidenceItem[];
}

export interface DirectionDetailDialogProps {
  direction: DirectionItem;
  evidence: {
    normals: DirectionEvidenceItem[];
    defects: DirectionEvidenceItem[];
    all: DirectionEvidenceItem[];
  };
  highlightRef: string | null;
  onHighlightRef: (ref: string | null) => void;
  onChipFocus: (ref: string) => void;
  onOpenFullscreen: (ref: string) => void;
  onClose: () => void;
}

/**
 * Reusable modal dialog for displaying exploration direction details,
 * comparative rationale with linked evidence chips, limitations, and visual evidence cards.
 */
export function DirectionDetailDialog({
  direction: dir,
  evidence,
  highlightRef,
  onHighlightRef,
  onChipFocus,
  onOpenFullscreen,
  onClose,
}: DirectionDetailDialogProps) {
  const evidenceContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleChipClick = (ref: string) => {
    onChipFocus(ref);
    if (!evidenceContainerRef.current) return;
    const cardEl = evidenceContainerRef.current.querySelector<HTMLElement>(`[data-evidence-card="${ref}"]`);
    if (cardEl && cardEl.parentElement) {
      const vp = cardEl.parentElement;
      const left = cardEl.offsetLeft - vp.offsetLeft;
      const right = left + cardEl.offsetWidth;
      if (left < vp.scrollLeft + 6) vp.scrollTo({ left: Math.max(0, left - 4), behavior: "smooth" });
      else if (right > vp.scrollLeft + vp.clientWidth - 6) vp.scrollTo({ left: right - vp.clientWidth + 4, behavior: "smooth" });
    }
  };

  return (
    <div
      className="exp-modal exp-direction-modal"
      id="exp-modal"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="exp-dialog exp-direction-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={dir.title}
        ref={evidenceContainerRef}
      >
        <div className="exp-dialog-head">
          <strong>{dir.title}</strong>
          <IconButton
            label="关闭方向详情"
            title="关闭"
            className="exp-direction-icon modal-x"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </div>
        <div className="exp-dialog-main">
          <div className="exp-direction-body">
            {/* Goal */}
            <section className="exp-direction-goal">
              <h3>观察目标</h3>
              <p>{dir.brief}</p>
            </section>

            {/* Reasoning & Limitations */}
            <div className="exp-direction-reasoning">
              <section>
                <h3>比较依据</h3>
                {(() => {
                  if (dir.rationale) {
                    const fullText = dir.rationale;
                    const regex = /(img_[a-f0-9]{8,64}|[NA]\d+)/g;
                    const parts: React.ReactNode[] = [];
                    let lastIndex = 0;
                    let match: RegExpExecArray | null;

                    while ((match = regex.exec(fullText)) !== null) {
                      if (match.index > lastIndex) {
                        parts.push(fullText.slice(lastIndex, match.index));
                      }
                      const token = match[0];
                      const matchedEv = evidence.all.find(
                        (e) =>
                          e.evidenceId.startsWith(token) ||
                          token.startsWith(e.evidenceId.slice(0, 8)) ||
                          e.ref === token
                      );

                      if (matchedEv) {
                        parts.push(
                          <button
                            key={matchedEv.ref + match.index}
                            type="button"
                            className={`exp-evidence-ref ${highlightRef === matchedEv.ref ? "is-related" : ""}`}
                            data-evidence-ref={matchedEv.ref}
                            aria-label={`定位证据图像 ${matchedEv.label}`}
                            onMouseEnter={() => handleChipClick(matchedEv.ref)}
                            onMouseLeave={() => onHighlightRef(null)}
                            onClick={() => handleChipClick(matchedEv.ref)}
                          >
                            {matchedEv.label}
                          </button>
                        );
                      } else {
                        parts.push(token);
                      }
                      lastIndex = regex.lastIndex;
                    }
                    if (lastIndex < fullText.length) {
                      parts.push(fullText.slice(lastIndex));
                    }
                    return <p>{parts}</p>;
                  }

                  return (
                    <>
                      <p>
                        良品样例{" "}
                        {evidence.normals.length ? (
                          evidence.normals.map((item, idx) => (
                            <React.Fragment key={item.ref}>
                              {idx > 0 && "、"}
                              <button
                                type="button"
                                className={`exp-evidence-ref ${highlightRef === item.ref ? "is-related" : ""}`}
                                data-evidence-ref={item.ref}
                                aria-label={`定位证据图像 ${item.label}`}
                                onMouseEnter={() => handleChipClick(item.ref)}
                                onMouseLeave={() => onHighlightRef(null)}
                                onClick={() => handleChipClick(item.ref)}
                              >
                                {item.label}
                              </button>
                            </React.Fragment>
                          ))
                        ) : (
                          "暂无"
                        )}{" "}
                        用于观察正常状态下的共有结构与波动。
                      </p>
                      <p>
                        异常样例{" "}
                        {evidence.defects.length ? (
                          evidence.defects.map((item, idx) => (
                            <React.Fragment key={item.ref}>
                              {idx > 0 && "、"}
                              <button
                                type="button"
                                className={`exp-evidence-ref ${highlightRef === item.ref ? "is-related" : ""}`}
                                data-evidence-ref={item.ref}
                                aria-label={`定位证据图像 ${item.label}`}
                                onMouseEnter={() => handleChipClick(item.ref)}
                                onMouseLeave={() => onHighlightRef(null)}
                                onClick={() => handleChipClick(item.ref)}
                              >
                                {item.label}
                              </button>
                            </React.Fragment>
                          ))
                        ) : (
                          "暂无"
                        )}{" "}
                        用于比较同一位置或相似结构的变化；具体结论需结合原图再次核验。
                      </p>
                    </>
                  );
                })()}
              </section>
              <section>
                <h3>限制与待确认</h3>
                <ul>
                  {dir.limitations && dir.limitations.length > 0 ? (
                    dir.limitations.map((lim, i) => <li key={i}>{lim}</li>)
                  ) : (
                    <>
                      <li>{dir.limit || "候选方向仅基于本次样例，需结合原图再次核验。"}</li>
                      <li>候选方向仅基于本次样例，不能直接作为缺陷判定。</li>
                    </>
                  )}
                </ul>
              </section>
            </div>

            {/* Image Evidence Strips */}
            <section className="exp-direction-evidence">
              <div className="exp-direction-evidence-head">
                <h3>图像证据</h3>
              </div>
              <div className="exp-direction-evidence-groups">
                {/* Normal Strip */}
                <section className="exp-scroll-group" data-evidence-kind="normal">
                  <div
                    className="exp-evidence-viewport"
                    role="group"
                    tabIndex={0}
                    aria-label="候选良品图像证据，可在区域内滚轮横向滚动"
                    onWheel={(e) => {
                      const motion = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                      if (motion) e.currentTarget.scrollLeft += motion;
                    }}
                  >
                    {evidence.normals.length ? (
                      evidence.normals.map((image) => (
                        <button
                          key={image.ref}
                          type="button"
                          className={`exp-direction-evidence-card ${highlightRef === image.ref ? "is-related" : ""}`}
                          data-evidence-card={image.ref}
                          aria-label={`查看${image.label}大图`}
                          title={`点击放大 ${image.label}`}
                          onMouseEnter={() => onHighlightRef(image.ref)}
                          onMouseLeave={() => onHighlightRef(null)}
                          onClick={() => onOpenFullscreen(image.ref)}
                        >
                          <img src={image.url} alt={image.label} loading="eager" />
                        </button>
                      ))
                    ) : (
                      <p className="exp-direction-empty">暂无可用良品证据</p>
                    )}
                  </div>
                </section>

                {/* Defect Strip */}
                <section className="exp-scroll-group" data-evidence-kind="defect">
                  <div
                    className="exp-evidence-viewport"
                    role="group"
                    tabIndex={0}
                    aria-label="候选异常图像证据，可在区域内滚轮横向滚动"
                    onWheel={(e) => {
                      const motion = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                      if (motion) e.currentTarget.scrollLeft += motion;
                    }}
                  >
                    {evidence.defects.length ? (
                      evidence.defects.map((image) => (
                        <button
                          key={image.ref}
                          type="button"
                          className={`exp-direction-evidence-card ${highlightRef === image.ref ? "is-related" : ""}`}
                          data-evidence-card={image.ref}
                          aria-label={`查看${image.label}大图`}
                          title={`点击放大 ${image.label}`}
                          onMouseEnter={() => onHighlightRef(image.ref)}
                          onMouseLeave={() => onHighlightRef(null)}
                          onClick={() => onOpenFullscreen(image.ref)}
                        >
                          <img src={image.url} alt={image.label} loading="eager" />
                        </button>
                      ))
                    ) : (
                      <p className="exp-direction-empty">暂无可用异常证据</p>
                    )}
                  </div>
                </section>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
