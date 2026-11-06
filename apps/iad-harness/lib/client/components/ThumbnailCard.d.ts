import React from 'react';
import type { ImageSource } from './ImageCanvas.js';
export interface ThumbnailCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    src?: string;
    image?: ImageSource;
    variant?: "thumbnail" | "evidence" | "comparison" | "compact";
    label: string;
    children?: React.ReactNode;
    mediaOverlay?: React.ReactNode;
}
export declare const ThumbnailCard: React.ForwardRefExoticComponent<ThumbnailCardProps & React.RefAttributes<HTMLButtonElement>>;
//# sourceMappingURL=ThumbnailCard.d.ts.map