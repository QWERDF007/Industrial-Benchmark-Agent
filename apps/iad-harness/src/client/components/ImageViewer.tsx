import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Modal } from "./Modal.js";
import { MediaImage, MediaLoad } from "./MediaLoad.js";
import { AnnotationLayer, type AnnotationLayerSource } from "./AnnotationLayer.js";
import { regionSources } from "../api.js";
import { InspectionOverlay, InspectionPanel, type InspectionContext } from "./InspectionEvidence.js";

export interface ImageSource {
  src: string; title: string; width?: number; height?: number; annotationLayer?: AnnotationLayerSource;
  inspection?: InspectionContext;
  focus?: { bbox: number[]; label: string; findingId: string };
}

export function AnnotatedImage({ image, visible = true, onLoad }: { image: ImageSource; visible?: boolean; onLoad?: React.ReactEventHandler<HTMLImageElement> }) {
  return <div className="iad-image-frame"><MediaImage src={image.src} alt={image.title} width={image.width} height={image.height} data-media-label="图像" draggable={false} onLoad={onLoad} />
    {visible && image.annotationLayer && <AnnotationLayer source={image.annotationLayer} />}
    {image.focus && <svg className="iad-finding-layer" data-finding-id={image.focus.findingId}
      viewBox={`0 0 ${image.width} ${image.height}`} preserveAspectRatio="none" aria-label={image.focus.label}>
      <rect x={image.focus.bbox[0]} y={image.focus.bbox[1]} width={image.focus.bbox[2] - image.focus.bbox[0]} height={image.focus.bbox[3] - image.focus.bbox[1]} />
    </svg>}
  </div>;
}

export function ImageViewer({ image, onClose }: { image: ImageSource; onClose(): void }) {
  const viewport = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const layerMenu = useRef<HTMLDetailsElement>(null);
  const inspection = image.inspection;
  const [selection, setSelection] = useState<{ kind: "region" | "finding"; id: string } | null>(inspection && image.focus ? { kind: "finding", id: image.focus.findingId } : null);
  const [hoveredIds, setHoveredIds] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const finding = selection?.kind === "finding" ? inspection?.analysis.findings.find(item => item.finding_id === selection.id) : undefined;
  const selectedId = selection?.kind === "region" ? selection.id : inspection?.analysis.regions.find(region => finding?.evidence_ids.includes(region.image.evidence_id))?.image.evidence_id || "";
  const [size, setSize] = useState({ width: image.width || 0, height: image.height || 0 });
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [view, setView] = useState({ scale: 0, x: 0, y: 0 });
  const [layers, setLayers] = useState<Record<keyof typeof regionSources, boolean>>(() => {
    const initial = { annotation: true, model: true, coverage: true };
    try {
      const saved = JSON.parse(localStorage.getItem("iad.image-layers") || "null");
      for (const key of Object.keys(initial) as (keyof typeof initial)[]) {
        if (typeof saved?.[key] === "boolean") initial[key] = saved[key];
      }
    } catch { localStorage.removeItem("iad.image-layers"); }
    return initial;
  });
  const regions = inspection?.analysis.regions.filter(region => region.origins.some(origin => layers[origin.source])) || [];
  useEffect(() => { localStorage.setItem("iad.image-layers", JSON.stringify(layers)); }, [layers]);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);
  const fit = size.width && size.height ? Math.min(bounds.width / size.width, bounds.height / size.height) : 1;
  const scale = view.scale || fit;
  useLayoutEffect(() => {
    const element = viewport.current!;
    const observer = new ResizeObserver(([entry]) => setBounds({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element); return () => observer.disconnect();
  }, []);
  const focusBox = useCallback((box: number[]) => {
    if (!bounds.width || !bounds.height || !size.width || !size.height) return;
    const [x1,y1,x2,y2] = box;
    const scale = Math.min(16,bounds.width/((x2-x1)*1.4),bounds.height/((y2-y1)*1.4));
    setView({scale,x:(size.width/2-(x1+x2)/2)*scale,y:(size.height/2-(y1+y2)/2)*scale});
  },[bounds.width,bounds.height,size.width,size.height]);
  useEffect(() => { if (image.focus) focusBox(image.focus.bbox); },[image.focus,focusBox]);
  function selectRegion(id: string) {
    const region = inspection!.analysis.regions.find(region => region.image.evidence_id === id)!;
    setLayers(previous => ({ ...previous, [region.source]: true }));
    setSelection({kind:"region",id}); setChoices([]);
    focusBox(region.crop_bbox.map((value,axis) => value*(axis%2 ? size.height : size.width)/inspection!.analysis.overview.original_size[axis%2]));
  }
  function regionsAt(event: React.PointerEvent) {
    if (!inspection || !world.current) return [];
    const rect=world.current.getBoundingClientRect();
    const x=(event.clientX-rect.left)*inspection.analysis.overview.original_size[0]/rect.width;
    const y=(event.clientY-rect.top)*inspection.analysis.overview.original_size[1]/rect.height;
    return regions.filter(region => x>=region.crop_bbox[0] && x<=region.crop_bbox[2] && y>=region.crop_bbox[1] && y<=region.crop_bbox[3]).map(region=>region.image.evidence_id);
  }
  function cancel() {
    if (layerMenu.current?.open) {
      layerMenu.current.open = false;
      layerMenu.current.querySelector("summary")?.focus();
    } else if (choices.length) setChoices([]);
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
    {(image.annotationLayer || inspection) && <button className="iad-eye" title={layers.annotation ? "隐藏标注" : "显示标注"} aria-label={layers.annotation ? "隐藏标注" : "显示标注"} aria-pressed={layers.annotation} onClick={() => setLayers(previous => ({ ...previous, annotation: !previous.annotation }))}>
      <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{!layers.annotation && <path d="m3 3 18 18" />}</svg>
    </button>}
    {inspection && <details ref={layerMenu} className="iad-layer-menu"><summary aria-label="可视图层">图层</summary>
      <div>{(Object.keys(regionSources) as (keyof typeof regionSources)[]).map(source => {
        const label = { annotation: "标注", model: "模型候选", coverage: "细节覆盖" }[source];
        return <label key={source}><input type="checkbox" aria-label={`${label}图层`} checked={layers[source]}
          onChange={event => setLayers(previous => ({ ...previous, [source]: event.target.checked }))} />{label}</label>;
      })}</div>
    </details>}
    <button onClick={onClose}>关闭</button></div>
    <div className={`iad-viewer-body ${inspection ? "has-inspection" : ""}`}>
    <MediaLoad key={image.src} className="iad-viewer-media"><div className="iad-viewer-viewport" ref={viewport} tabIndex={0} aria-label="图像视口"
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
        <AnnotatedImage image={{ ...image, ...size, focus: inspection && (!finding || !layers.model) ? undefined : image.focus }} visible={layers.annotation} onLoad={event => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />
        {inspection && <InspectionOverlay inspection={inspection} selectedId={selectedId} hoveredIds={hoveredIds} regions={regions} />}
      </div>
    </div></MediaLoad>
    {inspection && <InspectionPanel inspection={inspection} selectedId={selectedId} onSelect={selectRegion} choices={choices} />}
    </div>
  </div></Modal>;
}
