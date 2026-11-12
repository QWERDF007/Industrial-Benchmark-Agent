import React from 'react';
import { type AnalysisReadSource } from '../analysis-results.js';
import { type FullscreenViewerItem } from './FullscreenViewer.js';
export declare function AnalysisEvidenceViewer({ result, source, onClose }: {
    result: AnalysisReadSource;
    source: FullscreenViewerItem & {
        sampleId: string;
    };
    onClose(): void;
}): React.JSX.Element;
//# sourceMappingURL=AnalysisEvidenceViewer.d.ts.map