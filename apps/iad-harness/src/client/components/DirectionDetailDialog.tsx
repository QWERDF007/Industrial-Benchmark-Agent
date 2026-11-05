import {ThumbnailCard} from "./ThumbnailCard.js";
import React, { useEffect, useRef } from "react";

import { IconButton } from "./IconButton.js";
import {ReferencedText, type EvidenceReference} from "../direction-evidence.js";

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
  versionId: string;
  datasetId: string;
  title: string;
  applies: string;
  brief: string;
  rationale: string;
  limitations: string[];
  evidences: DirectionEvidenceItem[];
  references: Map<string,EvidenceReference>;
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
      if (e.key === "Escape" && !e.defaultPrevented) {
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

  const renderText=(text:string)=><ReferencedText text={text} references={dir.references}
    className="exp-evidence-ref" highlightedId={highlightRef} onReference={handleChipClick}
    onPreview={(ref,active)=>{if(active)handleChipClick(ref);else onHighlightRef(null);}}/>;

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
          <IconButton icon="close" label="关闭方向详情" title="关闭" onClick={onClose} />
        </div>
        <div className="exp-dialog-main">
          <div className="exp-direction-body">
            {/* Goal */}
            <section className="exp-direction-goal">
              <h3>观察目标</h3>
              <p>{renderText(dir.brief)}</p>
            </section>

            <section className="exp-direction-rationale">
              <h3>比较依据</h3>
              <p>{renderText(dir.rationale)}</p>
            </section>
            <section className="exp-direction-limitations">
              <h3>限制与待确认</h3>
              {dir.limitations.length ? <ul>
                {dir.limitations.map((lim,i)=><li key={i}>{renderText(lim)}</li>)}
              </ul> : <p>未记录限制</p>}
            </section>

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
                        <ThumbnailCard
                          key={image.ref}
                          type="button"
                          className={`exp-direction-evidence-card ${highlightRef === image.ref ? "is-related" : ""}`}
                          data-evidence-card={image.ref}
                          aria-label={`查看${image.label}大图`}
                          title={`点击放大 ${image.label}`}
                          src={image.url} label={image.label} data-highlighted={highlightRef===image.ref}
                          onMouseEnter={() => onHighlightRef(image.ref)}
                          onMouseLeave={() => onHighlightRef(null)}
                          onClick={() => onOpenFullscreen(image.ref)}
                        />
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
                        <ThumbnailCard
                          key={image.ref}
                          type="button"
                          className={`exp-direction-evidence-card ${highlightRef === image.ref ? "is-related" : ""}`}
                          data-evidence-card={image.ref}
                          aria-label={`查看${image.label}大图`}
                          title={`点击放大 ${image.label}`}
                          src={image.url} label={image.label} data-highlighted={highlightRef===image.ref}
                          onMouseEnter={() => onHighlightRef(image.ref)}
                          onMouseLeave={() => onHighlightRef(null)}
                          onClick={() => onOpenFullscreen(image.ref)}
                        />
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
