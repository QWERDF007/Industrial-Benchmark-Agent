import React from 'react';
import type { AuditEvidencePair, AuditReportImage } from '../../shared/domain.generated.js';
import { type AuditReportHeadingSpec } from './AuditReportHeading.js';
export declare function AuditEvidencePairs({ pairs, imageUrl, title, heading }: {
    pairs: readonly AuditEvidencePair[];
    imageUrl(item: AuditReportImage): string;
    title?: string;
    heading?: AuditReportHeadingSpec;
}): React.JSX.Element | null;
//# sourceMappingURL=AuditEvidencePairs.d.ts.map