import type {AnalysisReadSource} from '../analysis-results.js';
import {Modal} from './Modal.js';
import {ThumbnailCard} from "./ThumbnailCard.js";
import React from "react";

import { IconButton } from "./IconButton.js";

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
  source: AnalysisReadSource;
  datasetId: string;
  title: string;
  applies: string;
  brief: string;
  rationale: string;
  limitations: string[];
  evidences: DirectionEvidenceItem[];
}

export interface DirectionDetailDialogProps {
  direction: DirectionItem;
  onOpenFullscreen: (ref: string) => void;
  onClose: () => void;
}

export function DirectionDetailDialog({
  direction: dir,
  onOpenFullscreen,
  onClose,
}: DirectionDetailDialogProps) {
  const groups=([{kind:'normal',label:'良品'},{kind:'defect',label:'异常'},{kind:'unknown',label:'未分类'}] as const)
    .map(group=>({...group,items:dir.evidences.filter(item=>item.kind===group.kind)}))
    .filter(group=>group.kind!=='unknown'||group.items.length);

  return (
    <Modal title={dir.title} className="exp-dialog exp-direction-dialog" id="exp-modal" header={false} onClose={onClose}>
        <div className="exp-dialog-head">
          <strong>{dir.title}</strong>
          <IconButton icon="close" label="关闭方向详情" title="关闭" onClick={onClose} />
        </div>
        <div className="exp-dialog-main">
          <div className="exp-direction-body">
            {/* Goal */}
            <section className="exp-direction-goal">
              <h3>观察目标</h3>
              <p>{dir.brief}</p>
            </section>

            <section className="exp-direction-rationale">
              <h3>比较依据</h3>
              <p>{dir.rationale}</p>
            </section>
            <section className="exp-direction-limitations">
              <h3>限制与待确认</h3>
              {dir.limitations.length ? <ul>
                {dir.limitations.map((lim,i)=><li key={i}>{lim}</li>)}
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
                      className="exp-direction-evidence-card"
                      data-evidence-card={image.ref}
                      aria-label={`查看${image.label}大图`} title={`点击放大 ${image.label}`}
                      src={image.url} label={image.label}
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
