import React from 'react';
import type { AuditSampleItem } from '../../shared/domain.generated.js';
import type { JobSnapshot } from '../../shared/contracts.js';
export declare function AuditReport({ job, revision, onSample }: {
    job: JobSnapshot | null;
    revision: number;
    onSample(sample: AuditSampleItem): void;
}): React.JSX.Element;
//# sourceMappingURL=AuditReport.d.ts.map