import React, {forwardRef} from 'react';
import {MediaImage} from './MediaLoad.js';

export interface ThumbnailCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  src?: string;
  label: string;
  children?: React.ReactNode;
}

export const ThumbnailCard = forwardRef<HTMLButtonElement, ThumbnailCardProps>(function ThumbnailCard(
  {src, label, children, className = '', title = label, ...props}, ref,
) {
  return <button {...props} ref={ref} type="button" className={`iad-thumbnail-card ${className}`} title={title}>
    <span className="iad-thumbnail-media">{src ? <MediaImage src={src} alt={label} loading="lazy" decoding="async" /> : <span>图像不可用</span>}</span>
    <span className="iad-thumbnail-caption">{label}</span>{children}
  </button>;
});
