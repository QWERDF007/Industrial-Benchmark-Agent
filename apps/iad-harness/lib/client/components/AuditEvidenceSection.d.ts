import React from 'react';
import type { AuditReportImage } from '../../shared/domain.generated.js';
export declare function AuditEvidenceSection({ content, imageUrl, level }: {
    level?: 3 | 4 | 5;
    content: {
        number: string;
        title: string;
        description: string;
        facts?: readonly {
            label: string;
            text: string;
        }[];
        galleries: readonly {
            title: string;
            images: readonly AuditReportImage[];
        }[];
        analysis: readonly {
            title: string;
            text: string;
        }[];
    };
    imageUrl(item: AuditReportImage): string;
}): React.JSX.Element;
//# sourceMappingURL=AuditEvidenceSection.d.ts.map