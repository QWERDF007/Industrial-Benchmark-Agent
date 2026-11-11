import {Modal} from './Modal.js';
import {ThumbnailCard} from "./ThumbnailCard.js";
import React, { useRef, useState } from "react";

import { IconButton } from "./IconButton.js";
import {ReferencedText, type EvidenceReference} from "../direction-evidence.js";

export interface DirectionEvidenceItem {
  evidenceId: string;
  sampleId: string;
  ref: string;
  label: string;
  kind: "normal" | "defect" | "unknown";
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
  onOpenFullscreen: (ref: string) => void;
  onClose: () => void;
}

/**
 * Reusable modal dialog for displaying exploration direction details,
 * comparative rationale with linked evidence chips, limitations, and visual evidence cards.
 */
export function DirectionDetailDialog({
  direction: dir,
  onOpenFullscreen,
  onClose,
}: DirectionDetailDialogProps) {
  const evidenceContainerRef = useRef<HTMLDivElement>(null);
  const [highlightRef,setHighlightRef]=useState<string|null>(null);
  const groups=([{kind:'normal',label:'良品'},{kind:'defect',label:'异常'},{kind:'unknown',label:'未分类'}] as const)
    .map(group=>({...group,items:dir.evidences.filter(item=>item.kind===group.kind)}))
    .filter(group=>group.kind!=='unknown'||group.items.length);

  const handleChipClick = (ref: string) => {
    setHighlightRef(ref);
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
    onPreview={(ref,active)=>{if(active)handleChipClick(ref);else setHighlightRef(null);}}/>;

  return (
    <Modal title={dir.title} className="exp-dialog exp-direction-dialog" id="exp-modal" header={false} onClose={onClose}>
        <div className="exp-dialog-head">
          <strong>{dir.title}</strong>
          <IconButton icon="close" label="关闭方向详情" title="关闭" onClick={onClose} />
        </div>
        <div className="exp-dialog-main" ref={evidenceContainerRef}>
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
              <div className="exp-direction-evidence-groups" style={{gridTemplateColumns:`repeat(${groups.length},minmax(0,1fr))`}}>
                {groups.map(group=><section key={group.kind} className="exp-scroll-group" data-evidence-kind={group.kind}>
                  <div className="exp-evidence-viewport" role="group" tabIndex={0}
                    aria-label={`${group.label}图像证据，可在区域内滚轮横向滚动`}
                    onWheel={event=>{
                      const motion=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;
                      if(motion)event.currentTarget.scrollLeft+=motion;
                    }}>
                    {group.items.length?group.items.map(image=><ThumbnailCard key={image.ref}
                      className={`exp-direction-evidence-card ${highlightRef===image.ref?'is-related':''}`}
                      data-evidence-card={image.ref} data-highlighted={highlightRef===image.ref}
                      aria-label={`查看${image.label}大图`} title={`点击放大 ${image.label}`}
                      src={image.url} label={image.label}
                      onMouseEnter={()=>setHighlightRef(image.ref)} onMouseLeave={()=>setHighlightRef(null)}
                      onFocus={()=>setHighlightRef(image.ref)} onBlur={()=>setHighlightRef(null)}
                      onClick={()=>onOpenFullscreen(image.ref)}/>):<p className="exp-direction-empty">未精选{group.label}原图</p>}
                  </div>
                </section>)}
              </div>
            </section>
          </div>
        </div>
    </Modal>
  );
}
