import React from 'react';
export interface ThumbnailCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    src?: string;
    label: string;
    children?: React.ReactNode;
}
export declare const ThumbnailCard: React.ForwardRefExoticComponent<ThumbnailCardProps & React.RefAttributes<HTMLButtonElement>>;
//# sourceMappingURL=ThumbnailCard.d.ts.map