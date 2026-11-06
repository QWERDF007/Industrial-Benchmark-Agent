import {Select} from './Select.js';
import {ImageQualityBadge} from './ImageQualityBadge.js';
import type {ImageQualityLabel} from '../dataset-image-annotations.js';
import {IconButton} from "./IconButton.js";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {createPortal} from 'react-dom';
import {Modal} from './Modal.js';
import {AnnotationLayer, type AnnotationLayerSource, type ImageBoxAnnotation} from './AnnotationLayer.js';
import {useResource} from '../useResource.js';
import type {SampleDetail, VisualEvidence} from '../../shared/contracts.js';
import type {ImageNavigation} from './ImageCanvas.js';
import type {InspectionTransform} from '../inspection.js';

export type FullscreenViewerAnnotation=ImageBoxAnnotation;

export interface FullscreenViewerItem {
  qualityLabel?:ImageQualityLabel;
  sampleId?: string;
  evidence?: VisualEvidence;
  annotationLayer?: AnnotationLayerSource|null;
  id: string;
  title: string;
  imageUrl: string;
  width?: number;
  height?: number;
  bboxes?: FullscreenViewerAnnotation[];
}

export interface FullscreenViewerProps {
  open: boolean;
  item: FullscreenViewerItem | null;
  items?: FullscreenViewerItem[];
  currentIndex?: number;
  onClose: () => void;
  onNavigate?: (index: number) => void;
  navigation?: ImageNavigation;
  context?: React.ReactNode;
  overlay?: React.ReactNode;
  initialTransform?: InspectionTransform;
  onTransform?(value: InspectionTransform): void;
  onImageClick?(point: [number,number]): void;
}

/**
 * Reusable full-dialog image viewer.
 * Provides pan, zoom, fit to window, annotation overlay toggle, and keyboard navigation.
 * Standardized across Image Browsing and Direction Exploration pages.
 */
export function FullscreenViewer({
  open,
  item,
  items = [],
  currentIndex = -1,
  onClose,
  onNavigate,
  navigation,
  context,
  overlay,
  initialTransform,
  onTransform,
  onImageClick,
}: FullscreenViewerProps) {
  const source=useResource<SampleDetail>(open && item?.sampleId && item.annotationLayer===undefined && !item.qualityLabel
    ? `/sample/${encodeURIComponent(item.sampleId)}` : null);
  const annotationLayer=item?.annotationLayer===null?undefined:item?.annotationLayer || (source.data ? {kind:'sample' as const,
    sample:source.data.sample,annotations:source.data.annotations} : item?.bboxes?.length
      ? {kind:'boxes' as const,annotations:item.bboxes,width:item.width || 1,height:item.height || 1} : undefined);
  const [zoomMode, setZoomMode] = useState<"fit" | "custom">("fit");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [showAnnotation, setShowAnnotation] = useState(true);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [stageBounds, setStageBounds] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bigImageRef = useRef<HTMLImageElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const movedRef=useRef(false);

  const imgW = naturalSize.width || item?.width || 800;
  const imgH = naturalSize.height || item?.height || 600;

  // Fit scale calculation: dynamically scale to fit the stage area
  const fitScale = useMemo(() => {
    if (stageBounds.width <= 0 || stageBounds.height <= 0 || imgW <= 0 || imgH <= 0) return 1;
    const availableW = Math.max(100, stageBounds.width - 128);
    const availableH = Math.max(100, stageBounds.height - 40);
    const scaleX = availableW / imgW;
    const scaleY = availableH / imgH;
    return Math.max(0.05, Math.min(scaleX, scaleY));
  }, [stageBounds.width, stageBounds.height, imgW, imgH]);

  const effectiveScale = zoomMode === "fit" ? fitScale : zoomLevel * fitScale;
  useEffect(()=>{onTransform?.({zoom:zoomMode === 'fit' ? 0 : zoomLevel,x:panX,y:panY});},[zoomMode,zoomLevel,panX,panY,onTransform]);
  useLayoutEffect(()=>{setNaturalSize({width:0,height:0});},[item?.imageUrl]);

  const setZoom = useCallback((next: number) => {
    setZoomMode("custom");
    setZoomLevel(Math.max(0.1, Math.min(10, next)) / fitScale);
  }, [fitScale]);

  const handleFit = useCallback(() => {
    setZoomMode("fit");
    setPanX(0);
    setPanY(0);
  }, []);

  // Measure stage bounds for accurate fit calculation
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !open) return;
    const observer = new ResizeObserver(([entry]) => {
      setStageBounds({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(stage);
    setStageBounds({ width: stage.clientWidth, height: stage.clientHeight });
    return () => observer.disconnect();
  }, [open]);

  // Pan / Drag handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("select")) return;
    dragRef.current = { x: e.clientX, y: e.clientY, panX, panY };
    movedRef.current=false;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [panX, panY]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    if(Math.abs(e.clientX-dragRef.current.x)+Math.abs(e.clientY-dragRef.current.y)>4)movedRef.current=true;
    setPanX(dragRef.current.panX + e.clientX - dragRef.current.x);
    setPanY(dragRef.current.panY + e.clientY - dragRef.current.y);
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  // Wheel zoom
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !open) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      setZoomMode("custom");
      setZoomLevel(prev => {
        const base = zoomMode === "fit" ? fitScale : prev * fitScale;
        return Math.max(0.1, Math.min(10, base * (e.deltaY < 0 ? 1.15 : 1 / 1.15))) / fitScale;
      });
    }
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [open, zoomMode, fitScale]);

  // Navigate prev / next
  const moveViewer = useCallback((step: number) => {
    if(navigation){if(!navigation.busy && (step<0?navigation.previous:navigation.next))navigation.move(step<0?-1:1);return;}
    if (currentIndex < 0 || !items.length || !onNavigate) return;
    const next = Math.max(0, Math.min(items.length - 1, currentIndex + step));
    onNavigate(next);
    setPanX(0);
    setPanY(0);
    setZoomMode("fit");
  }, [currentIndex, items.length, onNavigate, navigation]);

  // Auto-fit on open or item change
  useEffect(() => {
    if (open && item) {
      setPanX(initialTransform?.x || 0);
      setPanY(initialTransform?.y || 0);
      setZoomMode(initialTransform?.zoom ? 'custom' : 'fit');
      if(initialTransform?.zoom)setZoomLevel(initialTransform.zoom);
      setShowAnnotation(true);
    }
  }, [open, item?.id]);

  if (!open || !item) return null;

  const hasAnnotations=!!(annotationLayer && (annotationLayer.kind!=='audit'
    ? annotationLayer.annotations.length : annotationLayer.analysis.auxiliary_evidence.length));
  const filename = item.title.split("/").pop() || item.title;

  const content = (
    <div id="full-overlay" className="full-overlay" role="presentation">
      <section className="full-dialog">
        {/* Dedicated Top Toolbar Header */}
        <header className="full-toolbar" role="toolbar" aria-label="图像查看工具">
          <div className="full-file" id="full-file-name" title={item.title} style={{ color: "#f4f7fd" }}>
            {filename}
          </div>
          <div className="full-actions">
            {/* 1. 缩小 */}
            <IconButton icon="zoomOut" type="button" id="zoom-out" title="缩小" label="缩小" onClick={() => setZoom(effectiveScale / 1.25)} />

            {/* 2. 缩放比例下拉列表 */}
            <span className="zoom-wrap" style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.22)" }}>
              <Select
                id="zoom"
                title="缩放比例"
                aria-label="缩放比例"
                style={{ color: "#f4f7fd", background: "transparent" }}
                value={
                  zoomMode === "fit"
                    ? "fit"
                    : [0.5, 1, 1.5, 2].some(v => Math.abs(effectiveScale - v) < 0.001)
                    ? String(effectiveScale)
                    : "custom"
                }
                onChange={e => {
                  const v = e.target.value;
                  if (v === "fit") {
                    handleFit();
                  } else if (v !== "custom") {
                    setZoom(Number(v));
                  }
                }}
              >
                <option value="fit">适应窗口</option>
                <option value="0.5">50%</option>
                <option value="1">100%</option>
                <option value="1.5">150%</option>
                <option value="2">200%</option>
                <option value="custom">
                  {zoomMode === "fit"
                    ? "自定义"
                    : [0.5, 1, 1.5, 2].some(v => Math.abs(effectiveScale - v) < 0.001)
                    ? "自定义"
                    : `${Math.round(effectiveScale * 100)}%`}
                </option>
              </Select>
              <span className="zoom-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
              </span>
            </span>

            {/* 3. 放大 */}
            <IconButton icon="zoomIn" type="button" id="zoom-in" title="放大" label="放大" onClick={() => setZoom(effectiveScale * 1.25)} />

            {/* 4. 适应窗口 */}
            <IconButton icon="fit" type="button" id="fit" title="适应窗口" label="适应窗口" onClick={handleFit} />

            {/* 5. 查看/隐藏标注 */}
            <IconButton icon={showAnnotation ? "annotations" : "annotationsOff"} type="button" id="annotation-toggle" title={showAnnotation ? "隐藏标注" : "查看标注"} label={showAnnotation ? "隐藏标注" : "查看标注"} aria-pressed={showAnnotation} disabled={!hasAnnotations} onClick={() => setShowAnnotation(v => !v)} />

            {/* 6. 关闭 */}
            <IconButton icon="close" type="button" className="full-close" id="full-close" title="关闭" label="关闭" onClick={onClose} />
          </div>
        </header>

        {/* Dedicated Image Stage */}
        <div className="full-content"><div
          className={`full-stage ${isDragging ? "dragging" : ""}`}
          id="stage"
          tabIndex={0}
          ref={stageRef}
          aria-label="大图查看区域"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Image World */}
          <div
            id="image-world"
            ref={worldRef}
            className="full-image-world"
            onClick={event=>{
              if(!onImageClick || movedRef.current)return;
              const bounds=event.currentTarget.getBoundingClientRect();
              const [x1,y1,x2,y2]=item.evidence?.crop_bbox || (annotationLayer?.kind==='sample'
                ? [0,0,annotationLayer.sample.width,annotationLayer.sample.height] : [0,0,item.width||imgW,item.height||imgH]);
              onImageClick([x1+(event.clientX-bounds.left)/bounds.width*(x2-x1),y1+(event.clientY-bounds.top)/bounds.height*(y2-y1)]);
            }}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: `${imgW}px`,
              height: `${imgH}px`,
              transformOrigin: "center",
              transform: `translate(-50%, -50%) translate(${panX}px, ${panY}px) scale(${effectiveScale})`,
            }}
          >
            <img
              id="big-image"
              ref={bigImageRef}
              src={item.imageUrl}
              alt={filename}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: "contain",
                pointerEvents: "none",
                userSelect: "none",
              }}
              onLoad={e => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                }
              }}
            />

            {/* Annotations Layer */}
            {showAnnotation && annotationLayer && <AnnotationLayer source={annotationLayer} viewport={item.evidence?.crop_bbox} />}
            {overlay}

          </div>

          {/* Navigation Arrows */}
          {(navigation || items.length > 1 && onNavigate) && (
            <>
              <button
                type="button"
                className="full-side-nav prev"
                id="prev-img"
                aria-label="上一张图像"
                title="上一张图像"
                disabled={navigation ? !navigation.previous || navigation.busy : currentIndex <= 0}
                onClick={e => {
                  e.stopPropagation();
                  moveViewer(-1);
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="full-side-nav next"
                id="next-img"
                aria-label="下一张图像"
                title="下一张图像"
                disabled={navigation ? !navigation.next || navigation.busy : currentIndex >= items.length - 1}
                onClick={e => {
                  e.stopPropagation();
                  moveViewer(1);
                }}
              >
                ›
              </button>
            </>
          )}
          <ImageQualityBadge label={item.qualityLabel} />
        </div>{context && <aside className="full-context">{context}</aside>}</div>
      </section>
    </div>
  );

  const dialog=<Modal title="原图检视器" frame="fullscreen" header={false} onClose={onClose}
    onKeyDown={event=>{
      if(event.key==='Escape'){event.preventDefault();onClose();return;}
      if((event.target as HTMLElement).closest('input,textarea,select'))return;
      if(event.key==='PageUp'||event.key==='ArrowLeft'){event.preventDefault();moveViewer(-1);}
      else if(event.key==='PageDown'||event.key==='ArrowRight'){event.preventDefault();moveViewer(1);}
    }}>{content}</Modal>;
  return typeof document==='undefined'?dialog:createPortal(dialog,document.body);
}
