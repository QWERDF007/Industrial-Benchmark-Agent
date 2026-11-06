import React, {forwardRef} from 'react';
import {AnnotatedImageStage} from './AnnotatedImageStage.js';
import type {ImageSource} from './ImageCanvas.js';
import {MediaImage} from './MediaLoad.js';

export interface ThumbnailCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  src?: string;
  image?:ImageSource;
  variant?:"thumbnail"|"evidence"|"comparison"|"compact";
  label: string;
  children?: React.ReactNode;
  mediaOverlay?:React.ReactNode;
}

export const ThumbnailCard = forwardRef<HTMLButtonElement, ThumbnailCardProps>(function ThumbnailCard(
  {src, image,variant='thumbnail',label, children,mediaOverlay,className = '', title = label, ...props}, ref,
) {
  return <button {...props} data-variant={variant} ref={ref} type="button" className={`iad-thumbnail-card ${className}`} title={title}>
    <span className="iad-thumbnail-media">{image ? <AnnotatedImageStage src={image.src} alt={image.title} width={image.width} height={image.height} annotationLayer={image.annotationLayer}/> : src ? <MediaImage src={src} alt={label} loading="lazy" decoding="async" /> : <span>图像不可用</span>}{mediaOverlay}</span>
    <span className="iad-thumbnail-caption">{label}</span>{children}
  </button>;
});
