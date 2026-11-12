import React from 'react';
import type { AuditReportImage } from '../../shared/domain.generated.js';
import { type AuditReportHeadingSpec } from './AuditReportHeading.js';
export declare function AuditEvidenceGallery({ items, imageUrl, title, heading }: {
    items: readonly AuditReportImage[];
    imageUrl(item: AuditReportImage): string;
    title?: string;
    heading?: AuditReportHeadingSpec;
}): React.JSX.Element | null;
//# sourceMappingURL=AuditEvidenceGallery.d.ts.map