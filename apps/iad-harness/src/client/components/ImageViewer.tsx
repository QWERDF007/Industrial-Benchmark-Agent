import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SampleDetail } from "../../shared/contracts.js";
import { Modal } from "./Modal.js";
import { InspectionOverlay, InspectionPanel, type InspectionContext } from "./InspectionEvidence.js";

type Annotation = SampleDetail["annotations"][number];
export interface ImageSource {
  src: string; title: string; width?: number; height?: number; annotations?: Annotation[];
  inspection?: InspectionContext;
  focus?: { bbox: number[]; label: string; findingId: string };
}

export function AnnotatedImage({ image, visible = true }: { image: ImageSource; visible?: boolean }) {
  return <div className="iad-image-frame"><img src={image.src} alt={image.title} draggable={false} />
    {visible && image.annotations && <svg className="iad-annotation-layer" viewBox={`0 0 ${image.width} ${image.height}`} preserveAspectRatio="none">
      {image.annotations.filter(a => a.geometry_status !== "INVALID").map(a => <g key={a.annotation_id}>
        {a.polygon ? <polygon points={a.polygon.map(p => p.join(",")).join(" ")} /> : a.bbox && <rect x={a.bbox[0]} y={a.bbox[1]} width={a.bbox[2] - a.bbox[0]} height={a.bbox[3] - a.bbox[1]} />}
        {a.bbox && <text x={a.bbox[0]} y={Math.max(12, a.bbox[1] - 4)}>{a.raw_label}</text>}
      </g>)}
    </svg>}
    {image.focus && <svg className="iad-finding-layer" data-finding-id={image.focus.findingId}
      viewBox={`0 0 ${image.width} ${image.height}`} preserveAspectRatio="none" aria-label={image.focus.label}>
      <rect x={image.focus.bbox[0]} y={image.focus.bbox[1]} width={image.focus.bbox[2] - image.focus.bbox[0]} height={image.focus.bbox[3] - image.focus.bbox[1]} />
    </svg>}
  </div>;
}

export function ImageViewer({ image, onClose }: { image: ImageSource; onClose(): void }) {
  const viewport = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const inspection = image.inspection;
  const [selection, setSelection] = useState<{ kind: "region" | "finding"; id: string } | null>(inspection && image.focus ? { kind: "finding", id: image.focus.findingId } : null);
  const [hoveredIds, setHoveredIds] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const finding = selection?.kind === "finding" ? inspection?.analysis.findings.find(item => item.finding_id === selection.id) : undefined;
  const selectedId = selection?.kind === "region" ? selection.id : inspection?.analysis.regions.find(region => finding?.evidence_ids.includes(region.image.evidence_id))?.image.evidence_id || "";
  const [size, setSize] = useState({ width: image.width || 0, height: image.height || 0 });
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [view, setView] = useState({ scale: 0, x: 0, y: 0 });
  const [visible, setVisible] = useState(true);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);
  const fit = size.width && size.height ? Math.min(bounds.width / size.width, bounds.height / size.height) : 1;
  const scale = view.scale || fit;
  useLayoutEffect(() => {
    const element = viewport.current!;
    const observer = new ResizeObserver(([entry]) => setBounds({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const source = new Image(); source.onload = () => setSize({ width: source.naturalWidth, height: source.naturalHeight }); source.src = image.src;
    return () => { source.onload = null; };
  }, [image.src]);
  const focusBox = useCallback((box: number[]) => {
    if (!bounds.width || !bounds.height || !size.width || !size.height) return;
    const [x1,y1,x2,y2] = box;
    const scale = Math.min(16,bounds.width/((x2-x1)*1.4),bounds.height/((y2-y1)*1.4));
    setView({scale,x:(size.width/2-(x1+x2)/2)*scale,y:(size.height/2-(y1+y2)/2)*scale});
  },[bounds.width,bounds.height,size.width,size.height]);
  useEffect(() => { if (image.focus) focusBox(image.focus.bbox); },[image.focus,focusBox]);
  function selectRegion(id: string) {
    const region = inspection!.analysis.regions.find(region => region.image.evidence_id === id)!;
    setSelection({kind:"region",id}); setChoices([]);
    focusBox(region.crop_bbox.map((value,axis) => value*(axis%2 ? size.height : size.width)/inspection!.analysis.overview.original_size[axis%2]));
  }
  function regionsAt(event: React.PointerEvent) {
    if (!inspection || !world.current) return [];
    const rect=world.current.getBoundingClientRect();
    const x=(event.clientX-rect.left)*inspection.analysis.overview.original_size[0]/rect.width;
    const y=(event.clientY-rect.top)*inspection.analysis.overview.original_size[1]/rect.height;
    return inspection.analysis.regions.filter(region => (visible || region.source!=="annotation") && x>=region.crop_bbox[0] && x<=region.crop_bbox[2] && y>=region.crop_bbox[1] && y<=region.crop_bbox[3]).map(region=>region.image.evidence_id);
  }
  function cancel() {
    if (choices.length) setChoices([]);
    else if (selection) setSelection(null);
    else onClose();
  }
  useEffect(() => {
    const element = viewport.current!;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2, y = event.clientY - rect.top - rect.height / 2;
      setView(previous => {
        const oldScale = previous.scale || fit;
        const next = Math.max(0.02, Math.min(16, oldScale * Math.exp(-event.deltaY * 0.0015)));
        return { scale: next, x: x - (x - previous.x) * next / oldScale, y: y - (y - previous.y) * next / oldScale };
      });
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [fit]);
  const fixed = [0, 1, 1.5, 2].includes(view.scale);
  return <Modal title="原图检视器" className="iad-viewer-dialog" onClose={cancel}><div className="iad-lightbox"><div className="iad-lightbox-toolbar"><strong>{image.title}</strong>
    <select aria-label="缩放" value={fixed ? view.scale : "custom"} onChange={e => setView({ scale: Number(e.target.value), x: 0, y: 0 })}>
      <option value={0}>适应窗口</option><option value={1}>100%</option><option value={1.5}>150%</option><option value={2}>200%</option>
      {!fixed && <option value="custom">{Math.round(scale * 100)}%</option>}
    </select>
    {image.annotations && <button className="iad-eye" title={visible ? "隐藏标注" : "显示标注"} aria-label={visible ? "隐藏标注" : "显示标注"} aria-pressed={visible} onClick={() => setVisible(v => !v)}>
      <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{!visible && <path d="m3 3 18 18" />}</svg>
    </button>}
    <button onClick={onClose}>关闭</button></div>
    <div className={`iad-viewer-body ${inspection ? "has-inspection" : ""}`}>
    <div className="iad-viewer-viewport" ref={viewport} tabIndex={0} aria-label="图像视口"
      onKeyDown={event => {
        const direction=({ArrowLeft:[20,0],ArrowRight:[-20,0],ArrowUp:[0,20],ArrowDown:[0,-20]} as Record<string,number[]>)[event.key];
        if(direction){event.preventDefault();setView(previous=>({...previous,x:previous.x+direction[0],y:previous.y+direction[1]}));}
      }}
      onPointerDown={event => { if (event.button !== 0) return; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, panX: view.x, panY: view.y, moved:false }; }}
      onPointerMove={event => {
        const start=drag.current;
        if(start){const dx=event.clientX-start.x,dy=event.clientY-start.y;start.moved ||= Math.hypot(dx,dy)>4;if(start.moved)setView(previous=>({...previous,x:start.panX+dx,y:start.panY+dy}));}
        else if(inspection)setHoveredIds(regionsAt(event));
      }}
      onPointerLeave={()=>setHoveredIds([])}
      onPointerUp={event => { const start=drag.current;drag.current=null;if(start && !start.moved && inspection){const ids=regionsAt(event);if(ids.length===1)selectRegion(ids[0]);else{setSelection(null);setChoices(ids);}} }} onPointerCancel={() => { drag.current = null; }}>
      <div className="iad-viewer-world" ref={world} data-scale={scale} style={{ width: size.width, height: size.height, "--iad-view-scale": scale,
        transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${scale})` } as React.CSSProperties}>
        <AnnotatedImage image={{ ...image, ...size, focus: inspection && !finding ? undefined : image.focus }} visible={visible} />
        {inspection && <InspectionOverlay inspection={inspection} selectedId={selectedId} hoveredIds={hoveredIds} annotationsVisible={visible} />}
      </div>
    </div>
    {inspection && <InspectionPanel inspection={inspection} selectedId={selectedId} onSelect={selectRegion} choices={choices} />}
    </div>
  </div></Modal>;
}
