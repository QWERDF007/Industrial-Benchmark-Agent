import React from 'react';
import type { AuditReportImage } from '../../shared/domain.generated.js';
import type { ImageSource } from './ImageViewer.js';
export declare function auditEvidenceImage(item: AuditReportImage, src: string): ImageSource;
export declare function AuditEvidenceGallery({ items, imageUrl, onOpen }: {
    items: readonly AuditReportImage[];
    imageUrl(item: AuditReportImage): string;
    onOpen(image: ImageSource): void;
}): React.JSX.Element;
//# sourceMappingURL=AuditEvidenceGallery.d.ts.map