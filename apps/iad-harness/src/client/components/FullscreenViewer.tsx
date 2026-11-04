import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface FullscreenViewerAnnotation {
  annotation_id?: string;
  raw_label: string;
  bbox?: number[] | null;
}

export interface FullscreenViewerItem {
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
}: FullscreenViewerProps) {
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

  const effectiveScale = zoomMode === "fit" ? fitScale : zoomLevel;

  const setZoom = useCallback((next: number) => {
    setZoomMode("custom");
    setZoomLevel(Math.max(0.1, Math.min(10, next)));
  }, []);

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
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [panX, panY]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
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
        const base = zoomMode === "fit" ? fitScale : prev;
        return Math.max(0.1, Math.min(10, base * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
      });
    }
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [open, zoomMode, fitScale]);

  // Navigate prev / next
  const moveViewer = useCallback((step: number) => {
    if (currentIndex < 0 || !items.length || !onNavigate) return;
    const next = Math.max(0, Math.min(items.length - 1, currentIndex + step));
    onNavigate(next);
    setPanX(0);
    setPanY(0);
    setZoomMode("fit");
  }, [currentIndex, items.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "PageUp") {
        e.preventDefault();
        moveViewer(-1);
      } else if (e.key === "PageDown") {
        e.preventDefault();
        moveViewer(1);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, moveViewer]);

  // Auto-fit on open or item change
  useEffect(() => {
    if (open && item) {
      setPanX(0);
      setPanY(0);
      setZoomMode("fit");
      setShowAnnotation(true);
    }
  }, [open, item?.id]);

  if (!open || !item) return null;

  const bboxes = item.bboxes || [];
  const filename = item.title.split("/").pop() || item.title;

  const content = (
    <div id="full-overlay" className="full-overlay" role="presentation">
      <section className="full-dialog" role="dialog" aria-modal="true" aria-label="原图检视器">
        {/* Dedicated Top Toolbar Header */}
        <header className="full-toolbar" role="toolbar" aria-label="图像查看工具">
          <div className="full-file" id="full-file-name" title={item.title} style={{ color: "#f4f7fd" }}>
            {filename}
          </div>
          <div className="full-actions">
            {/* 1. 缩小 */}
            <button
              type="button"
              id="zoom-out"
              title="缩小"
              aria-label="缩小"
              onClick={() => setZoom(effectiveScale / 1.25)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35M8 11h6" />
              </svg>
            </button>

            {/* 2. 缩放比例下拉列表 */}
            <span className="zoom-wrap" style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.22)" }}>
              <select
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
              </select>
              <span className="zoom-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
              </span>
            </span>

            {/* 3. 放大 */}
            <button
              type="button"
              id="zoom-in"
              title="放大"
              aria-label="放大"
              onClick={() => setZoom(effectiveScale * 1.25)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
              </svg>
            </button>

            {/* 4. 适应窗口 */}
            <button
              type="button"
              id="fit"
              title="适应窗口"
              aria-label="适应窗口"
              onClick={handleFit}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="2.8" />
                <path d="M8 4H5a1 1 0 0 0-1 1v3M16 4h3a1 1 0 0 1 1 1v3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" />
              </svg>
            </button>

            {/* 5. 查看/隐藏标注 */}
            <button
              type="button"
              id="annotation-toggle"
              title={showAnnotation ? "隐藏标注" : "查看标注"}
              aria-label={showAnnotation ? "隐藏标注" : "查看标注"}
              aria-pressed={showAnnotation}
              disabled={bboxes.length === 0}
              onClick={() => setShowAnnotation(v => !v)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
                {!showAnnotation && <path d="m3 3 18 18" />}
              </svg>
            </button>

            {/* 6. 关闭 */}
            <button
              type="button"
              className="full-close"
              id="full-close"
              title="关闭"
              aria-label="关闭"
              onClick={onClose}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Dedicated Image Stage */}
        <div
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
            {showAnnotation && (
              <span id="full-annotation-layer" className="full-annotation-layer">
                {bboxes.map((box, bIdx) => {
                  if (!box.bbox) return null;
                  const [x1, y1, x2, y2] = box.bbox;
                  return (
                    <span
                      key={box.annotation_id || bIdx}
                      className="bbox"
                      data-label={box.raw_label.replace(/^类别\s*/, "")}
                      style={{
                        position: "absolute",
                        left: `${((x1 / imgW) * 100).toFixed(3)}%`,
                        top: `${((y1 / imgH) * 100).toFixed(3)}%`,
                        width: `${(((x2 - x1) / imgW) * 100).toFixed(3)}%`,
                        height: `${(((y2 - y1) / imgH) * 100).toFixed(3)}%`,
                      }}
                    />
                  );
                })}
              </span>
            )}
          </div>

          {/* Navigation Arrows */}
          {items.length > 1 && onNavigate && (
            <>
              <button
                type="button"
                className="full-side-nav prev"
                id="prev-img"
                aria-label="上一张图像"
                title="上一张图像"
                disabled={currentIndex <= 0}
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
                disabled={currentIndex >= items.length - 1}
                onClick={e => {
                  e.stopPropagation();
                  moveViewer(1);
                }}
              >
                ›
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}
