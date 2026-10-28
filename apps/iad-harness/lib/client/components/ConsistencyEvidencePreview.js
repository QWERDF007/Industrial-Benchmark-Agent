import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { imageRelations } from '../../shared/consistency-presentation.js';
import { message, request, reviewLabels } from '../api.js';
import { useWorkspace } from '../workspace.js';
import { FrozenConsistencyComparison } from './FrozenConsistencyComparison.js';
export function ConsistencyEvidencePreview({ evidenceId }) {
    const { workspace } = useWorkspace();
    const [bundle, setBundle] = useState(null), [error, setError] = useState('');
    useEffect(() => {
        const controller = new AbortController();
        setBundle(null);
        setError('');
        request(`/consistency/evidence/${encodeURIComponent(evidenceId)}`, undefined, undefined, controller.signal)
            .then(value => { if (!controller.signal.aborted)
            setBundle(value); }).catch(failure => { if (!controller.signal.aborted)
            setError(message(failure)); });
        return () => controller.abort();
    }, [evidenceId]);
    const open = () => workspace.updateConsistency({ batchId: undefined, evidenceId, resultId: bundle?.result.result_id }, true);
    return _jsxs("section", { className: "iad-consistency-detail", "aria-label": "\u9009\u4E2D\u56FE\u7EC4\u8BC1\u636E", "aria-busy": !bundle && !error, children: [_jsxs("header", { className: "iad-consistency-panel-header", children: [_jsx("strong", { children: "\u56FE\u7EC4\u8BC1\u636E" }), bundle && _jsxs("span", { children: [imageRelations[bundle.result.verification.relation], " \u00B7 ", bundle.result.annotation.differences.length, " \u9879\u5DEE\u5F02"] })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), !bundle && !error && _jsx("p", { role: "status", className: "iad-empty", children: "\u6B63\u5728\u8BFB\u53D6\u56FE\u7EC4\u8BC1\u636E\u2026" }), bundle && _jsxs("div", { className: "iad-consistency-detail-body", children: [_jsx("div", { className: "iad-consistency-pair-meta", children: ['left', 'right'].map(side => { const sample = bundle.sources[side].sample; return _jsxs("div", { children: [_jsx("strong", { title: sample.relative_path, children: sample.relative_path }), _jsxs("span", { children: ["\u539F\u6807\u7B7E\uFF1A", reviewLabels[sample.quality_status] || sample.quality_status] })] }, side); }) }), _jsx(FrozenConsistencyComparison, { bundle: bundle, compact: true }, evidenceId), _jsxs("footer", { className: "iad-consistency-detail-actions", children: [_jsx("button", { onClick: open, children: "\u67E5\u770B\u539F\u56FE\u5BF9\u6BD4" }), _jsx("button", { className: "iad-primary", onClick: open, children: "\u4EBA\u5DE5\u590D\u6838" }), _jsx("button", { onClick: () => window.location.assign(`/api/iad/consistency/evidence/${encodeURIComponent(evidenceId)}/export`), children: "\u5BFC\u51FA\u8BC1\u636E" })] })] })] });
}
