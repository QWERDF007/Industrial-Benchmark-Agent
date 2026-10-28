import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { jobStatuses } from '../../shared/job-display.js';
import { message, request } from '../api.js';
import { useWorkspace } from '../workspace.js';
export function ConsistencyGroupAnalysis({ reference, onLocate }) {
    const { workspace } = useWorkspace();
    const [analysis, setAnalysis] = useState(null), [error, setError] = useState('');
    const key = JSON.stringify(reference);
    useEffect(() => {
        const controller = new AbortController();
        let timer;
        setAnalysis(null);
        setError('');
        async function read() {
            try {
                const value = await request('/consistency/gallery/analysis', reference, undefined, controller.signal);
                if (controller.signal.aborted)
                    return;
                setAnalysis(value);
                setError('');
                if (value.status === 'RUNNING' || value.status === 'PENDING')
                    timer = setTimeout(read, 1200);
            }
            catch (failure) {
                if (!controller.signal.aborted)
                    setError(message(failure));
            }
        }
        void read();
        return () => { controller.abort(); clearTimeout(timer); };
    }, [key]);
    return _jsxs("section", { "aria-label": "MLLM \u7EC4\u7EA7\u5206\u6790", children: [_jsxs("h3", { children: ["MLLM \u7EC4\u7EA7\u5206\u6790 ", analysis && _jsx("span", { className: "iad-consistency-badge", children: analysis.status === 'NOT_ANALYZED' ? '未分析' : analysis.status === 'COMPLETED' ? 'MLLM 已分析' : jobStatuses[analysis.status] })] }), error && _jsxs("p", { role: "alert", className: "iad-error", children: ["\u5206\u6790\u72B6\u6001\u8BFB\u53D6\u5931\u8D25\uFF1A", error] }), !analysis && !error && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5206\u6790\u72B6\u6001\u2026" }), analysis?.status === 'NOT_ANALYZED' && _jsx("p", { className: "iad-muted", children: "\u6682\u65E0\u5DF2\u4FDD\u5B58\u7684\u6A21\u578B\u5206\u6790\u7ED3\u679C\u3002" }), analysis?.error && _jsx("p", { role: "alert", className: "iad-error", children: analysis.error }), analysis?.status === 'COMPLETED' && analysis.result && _jsxs(_Fragment, { children: [_jsx("p", { className: "iad-muted", children: analysis.model_name }), _jsx("div", { className: "iad-group-conclusions", children: analysis.result.conclusions.map((conclusion, index) => _jsxs("article", { children: [_jsx("p", { children: conclusion.text }), _jsx("div", { className: "iad-row", children: conclusion.references.map((citation, position) => _jsxs(React.Fragment, { children: [_jsxs("button", { className: "iad-consistency-text-button", onClick: () => onLocate(citation, analysis.candidate_offsets[citation.candidate_id]), children: ["\u5B9A\u4F4D\u5019\u9009 ", citation.candidate_id.split(':').slice(1).join(':')] }), citation.comparison && _jsx("button", { className: "iad-consistency-text-button", onClick: () => workspace.updateConsistency({ batchId: undefined, evidenceId: citation.comparison.evidence_id, resultId: citation.comparison.result_id, differenceId: citation.comparison.difference_id ?? undefined }, true), children: "\u67E5\u770B\u51BB\u7ED3\u8BC1\u636E" })] }, position)) })] }, index)) }), !!analysis.result.limitations.length && _jsx("div", { className: "iad-group-limitations", children: analysis.result.limitations.map((limit, index) => _jsx("p", { children: limit }, index)) })] })] });
}
