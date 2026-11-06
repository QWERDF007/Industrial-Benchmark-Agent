import React, { useState } from "react";
import {AnnotationLayer,type ImageBoxAnnotation,type AnnotationLayerSource} from "./AnnotationLayer.js";

export interface AnnotatedImageStageProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  bboxes?: ImageBoxAnnotation[];
  annotationLayer?:AnnotationLayerSource;
  showAnnotations?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onLoadDimensions?: (dimensions: { naturalWidth: number; naturalHeight: number }) => void;
}

/**
 * Unified Annotated Image Stage.
 * Single Source of Truth for rendering an image with bounding box annotations and category badges.
 * Automatically respects the natural aspect ratio of the image, preventing distortion and coordinate shift.
 */
export function AnnotatedImageStage({
  src,
  alt = "",
  width,
  height,
  bboxes = [],
  annotationLayer,
  showAnnotations = true,
  className = "",
  style,
  children,
  onLoadDimensions,
}: AnnotatedImageStageProps) {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: width || 0,
    height: height || 0,
  });

  const imgW = naturalSize.width || width || 800;
  const imgH = naturalSize.height || height || 600;

  return (
    <div
      className={`annotated-image-stage ${className}`}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
        <img data-media-label="图像"
          src={src}
          alt={alt}
          draggable={false}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
          }}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
              onLoadDimensions?.({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
            }
          }}
        />

        {showAnnotations && (annotationLayer || bboxes.length>0) && <AnnotationLayer fit="contain" source={annotationLayer || {kind:'boxes',annotations:bboxes,width:imgW,height:imgH}} />}
        {children}
    </div>
  );
}
