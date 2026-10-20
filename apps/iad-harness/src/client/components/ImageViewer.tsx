import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Modal } from "./Modal.js";
import { FloatingMenu } from "./FloatingMenu.js";
import { MediaImage, MediaLoad } from "./MediaLoad.js";
import { AnnotationLayer, type AnnotationLayerSource } from "./AnnotationLayer.js";
import { regionSources } from "../api.js";
import { InspectionOverlay, InspectionPanel } from "./InspectionEvidence.js";
import { resolveInspection, type ImageView, type InspectionContext, type InspectionSelection, type InspectionTransform } from "../inspection.js";
import { useWorkspace } from "../workspace.js";

const emptyHover = { ids: [] as string[], dismissed: false, x: 0, y: 0 };
const minScale = 0.02, maxScale = 16;

export interface ImageSource {
  src: string; title: string; width?: number; height?: number; annotationLayer?: AnnotationLayerSource;
  inspection?: InspectionContext;
  initialSelection?: InspectionSelection | null;
  initialTransform?: InspectionTransform;
}
export interface ImageNavigation { previous: boolean; next: boolean; busy: boolean; error: string; move(offset: -1 | 1): void }
type ImageViewerProps = { image: ImageSource; onClose(): void; navigation?: ImageNavigation };

export function AnnotatedImage({ image, visible = true, onLoad }: { image: ImageSource; visible?: boolean; onLoad?: React.ReactEventHandler<HTMLImageElement> }) {
  return <div className="iad-image-frame"><MediaImage src={image.src} alt={image.title} width={image.width} height={image.height} data-media-label="图像" draggable={false} onLoad={onLoad} />
    {visible && image.annotationLayer && <AnnotationLayer source={image.annotationLayer} />}
  </div>;
}

export function ImageViewer({ image, onClose, navigation }: ImageViewerProps) {
  const { workspace } = useWorkspace();
  const reference = image.inspection?.reference;
  const source = JSON.stringify(reference ? [reference.dataset_id, reference.sample_id, reference.suggestion_id] : [image.src]);
  return <ImageCanvas key={JSON.stringify([source, image.src])} image={image} onClose={onClose} navigation={navigation} savedView={workspace.imageView(source)} onRemember={view => workspace.rememberImageView(source, view)} />;
}

function ImageCanvas({ image, onClose, navigation, savedView, onRemember }: ImageViewerProps & { savedView?: ImageView; onRemember(view: ImageView): void }) {
  const viewport = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const layerMenu = useRef<HTMLDetailsElement>(null);
  const inspection = image.inspection;
  const [selection, setSelection] = useState<InspectionSelection | null>(() => inspection ? image.initialSelection === undefined ? savedView?.selection || null : image.initialSelection : null);
  const initialTransform = image.initialTransform || (image.initialSelection === undefined || JSON.stringify(image.initialSelection) === JSON.stringify(savedView?.selection) ? savedView?.transform : undefined);
  const [hover, setHover] = useState(emptyHover);
  const hintId = useId();
  const [choices, setChoices] = useState<string[]>([]);
  const { finding, evidence, region } = resolveInspection(inspection?.analysis, selection);
  const selectedId = region?.image.evidence_id || "";
  const [size, setSize] = useState({ width: image.width || 0, height: image.height || 0 });
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [view, setView] = useState({ scale: 0, x: 0, y: 0 });
  const focusedSelection = useRef<string>();
  const restoredTransform = useRef(false);
  const [layers, setLayers] = useState<Record<keyof typeof regionSources, boolean>>(() => {
    const initial = { annotation: true, model: true, coverage: true };
    try {
      const saved = JSON.parse(localStorage.getItem("iad.image-layers") || "null");
      for (const key of Object.keys(initial) as (keyof typeof initial)[]) {
        if (typeof saved?.[key] === "boolean") initial[key] = saved[key];
      }
    } catch { localStorage.removeItem("iad.image-layers"); }
    if (image.initialSelection) {
      if (region) initial[region.source] = true;
      if (finding?.location.scope === "local") initial.model = true;
    }
    return initial;
  });
  const regions = inspection?.analysis.regions.filter(region => region.origins.some(origin => layers[origin.source])) || [];
  const hoveredRegions = regions.filter(region => hover.ids.includes(region.image.evidence_id));
  const hint = !hover.dismissed && hoveredRegions[0];
  useEffect(() => { localStorage.setItem("iad.image-layers", JSON.stringify(layers)); }, [layers]);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);
  const fit = size.width && size.height ? Math.min(bounds.width / size.width, bounds.height / size.height) : 1;
  const scale = view.scale || fit;
  const remembered = useRef<{ onRemember(view: ImageView): void; view: ImageView }>({ onRemember, view: { selection, transform: { zoom: 0, x: 0, y: 0 } } });
  remembered.current = { onRemember, view: { selection, transform: { zoom: view.scale ? scale / fit : 0, x: view.x, y: view.y } } };
  useEffect(() => () => remembered.current.onRemember(remembered.current.view), []);
  useLayoutEffect(() => {
    const element = viewport.current!;
    const observer = new ResizeObserver(([entry]) => setBounds({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!bounds.width || !bounds.height || !size.width || !size.height) return;
    const key = JSON.stringify(selection);
    if (focusedSelection.current === key) return;
    focusedSelection.current = key;
    if (!restoredTransform.current && initialTransform) {
      restoredTransform.current = true;
      setView({ scale: initialTransform.zoom ? initialTransform.zoom * fit : 0, x: initialTransform.x, y: initialTransform.y });
      return;
    }
    if (!inspection || !selection) return;
    const box = selection.kind === "evidence" ? evidence?.role === "overview" ? null : evidence?.crop_bbox : finding?.location.bbox;
    if (!box) { setView({ scale: 0, x: 0, y: 0 }); return; }
    const [x1,y1,x2,y2] = box.map((value,axis) => value*(axis%2 ? size.height : size.width)/inspection.analysis.overview.original_size[axis%2]);
    const scale = Math.min(maxScale,bounds.width/((x2-x1)*1.4),bounds.height/((y2-y1)*1.4));
    setView({scale,x:(size.width/2-(x1+x2)/2)*scale,y:(size.height/2-(y1+y2)/2)*scale});
  }, [selection, inspection, finding, evidence, bounds.width, bounds.height, size.width, size.height]);
  function select(target: InspectionSelection | null) {
    const { region: targetRegion, finding: targetFinding } = resolveInspection(inspection?.analysis, target);
    if (targetRegion) setLayers(previous => ({ ...previous, [targetRegion.source]: true }));
    if (targetFinding?.location.scope === "local") setLayers(previous => ({ ...previous, model: true }));
    setSelection(target); setChoices([]); setHover(emptyHover);
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
    } else if (hint) setHover(previous => ({ ...previous, dismissed: true }));
    else if (choices.length) setChoices([]);
    else if (selection) setSelection(null);
    else onClose();
  }
  function zoomBy(factor: number, anchorX = 0, anchorY = 0) {
    setHover(emptyHover);
    setView(previous => {
      const oldScale = previous.scale || fit;
      const next = Math.max(minScale, Math.min(maxScale, oldScale * factor));
      return { scale: next, x: anchorX - (anchorX - previous.x) * next / oldScale, y: anchorY - (anchorY - previous.y) * next / oldScale };
    });
  }
  useEffect(() => {
    const element = viewport.current!;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2, y = event.clientY - rect.top - rect.height / 2;
      zoomBy(Math.exp(-event.deltaY * 0.0015), x, y);
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [fit]);
  const fixed = [0, 1, 1.5, 2].includes(view.scale);
  return <Modal title="原图检视器" className="iad-viewer-dialog" onClose={cancel}><div className="iad-lightbox"><div className="iad-lightbox-toolbar"><strong>{image.title}</strong>
    <button className="iad-eye" aria-label="缩小" title="缩小" disabled={scale <= minScale} onClick={() => zoomBy(0.5)}><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14" /></svg></button>
    <select aria-label="缩放" value={fixed ? view.scale : "custom"} onChange={e => {
      const next = Number(e.target.value);
      if (next) zoomBy(next / scale);
      else { setView({ scale: 0, x: 0, y: 0 }); setHover(emptyHover); }
    }}>
      <option value={0}>适应窗口</option><option value={1}>100%</option><option value={1.5}>150%</option><option value={2}>200%</option>
      {!fixed && <option value="custom">{Math.round(scale * 100)}%</option>}
    </select>
    <button className="iad-eye" aria-label="放大" title="放大" disabled={scale >= maxScale} onClick={() => zoomBy(2)}><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14M12 5v14" /></svg></button>
    {(image.annotationLayer || inspection) && <button className="iad-eye" title={layers.annotation ? "隐藏标注" : "显示标注"} aria-label={layers.annotation ? "隐藏标注" : "显示标注"} aria-pressed={layers.annotation} onClick={() => setLayers(previous => ({ ...previous, annotation: !previous.annotation }))}>
      <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{!layers.annotation && <path d="m3 3 18 18" />}</svg>
    </button>}
    {inspection && <FloatingMenu detailsRef={layerMenu} className="iad-layer-menu" label="可视图层" summary="图层">
      {(Object.keys(regionSources) as (keyof typeof regionSources)[]).map(source => {
        const label = { annotation: "标注", model: "模型候选", coverage: "细节覆盖" }[source];
        return <label key={source}><input type="checkbox" aria-label={`${label}图层`} checked={layers[source]}
          onChange={event => setLayers(previous => ({ ...previous, [source]: event.target.checked }))} />{label}</label>;
      })}
    </FloatingMenu>}
    {navigation && <><button disabled={navigation.busy || !navigation.previous} onClick={() => navigation.move(-1)}>前一张</button><button disabled={navigation.busy || !navigation.next} onClick={() => navigation.move(1)}>后一张</button>{navigation.busy && <span role="status">正在切换图像…</span>}</>}
    <button onClick={onClose}>关闭</button></div>
    {navigation?.error && <p role="alert" className="iad-error">{navigation.error}</p>}
    <div className={`iad-viewer-body ${inspection ? "has-inspection" : ""}`}>
    <MediaLoad key={image.src} className="iad-viewer-media"><div className="iad-viewer-viewport" ref={viewport} tabIndex={0} aria-label="图像视口" aria-describedby={hint ? hintId : undefined}
      onKeyDown={event => {
        const direction=({ArrowLeft:[20,0],ArrowRight:[-20,0],ArrowUp:[0,20],ArrowDown:[0,-20]} as Record<string,number[]>)[event.key];
        if(direction){event.preventDefault();setView(previous=>({...previous,x:previous.x+direction[0],y:previous.y+direction[1]}));}
      }}
      onPointerDown={event => { if (event.button !== 0) return; setHover(emptyHover); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, panX: view.x, panY: view.y, moved:false }; }}
      onPointerMove={event => {
        const start=drag.current;
        if(start){const dx=event.clientX-start.x,dy=event.clientY-start.y;start.moved ||= Math.hypot(dx,dy)>4;if(start.moved)setView(previous=>({...previous,x:start.panX+dx,y:start.panY+dy}));}
        else if(inspection && event.pointerType !== "touch") {
          const ids = regionsAt(event);
          const rect = event.currentTarget.getBoundingClientRect();
          const x = Math.max(12,Math.min(event.clientX-rect.left,rect.width-292)), y = event.clientY-rect.top;
          setHover(previous => ids.length === previous.ids.length && ids.every((id,index) => id === previous.ids[index]) ? previous : { ids, dismissed: false, x, y });
        }
      }}
      onPointerLeave={()=>setHover(emptyHover)}
      onPointerUp={event => { const start=drag.current;drag.current=null;if(start && !start.moved && inspection){const ids=regionsAt(event);if(ids.length===1)select({kind:"evidence",id:ids[0]});else{setSelection(null);setChoices(ids);}} }} onPointerCancel={() => { drag.current = null; }}>
      <div className="iad-viewer-world" ref={world} data-scale={scale} style={{ width: size.width, height: size.height, "--iad-view-scale": scale,
        transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${scale})` } as React.CSSProperties}>
        <AnnotatedImage image={{ ...image, ...size }} visible={layers.annotation} onLoad={event => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />
        {inspection && <InspectionOverlay inspection={inspection} selectedId={selectedId} hoveredIds={hover.ids} regions={regions} finding={layers.model ? finding : undefined} />}
      </div>
      {hint && <div id={hintId} role="tooltip" className="iad-roi-hint" style={{ left: hover.x, top: hover.y + (hover.y < bounds.height / 2 ? 1 : 0), transform: hover.y >= bounds.height / 2 ? "translateY(-100%)" : undefined }} onPointerMove={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}>
        {regionSources[hint.source]} · {hint.label.slice(0,80)}{hint.label.length > 80 ? "…" : ""}{hoveredRegions.length > 1 ? ` · ${hoveredRegions.length} 个重叠区域` : ""}
      </div>}
    </div></MediaLoad>
    {inspection && <InspectionPanel inspection={inspection} selection={selection} choices={choices} onSelect={select} transform={() => ({ zoom: view.scale ? scale / fit : 0, x: view.x, y: view.y })} />}
    </div>
  </div></Modal>;
}
