import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useResource } from '../useResource.js';
const identityRelations = {
    pixel_identical: '像素完全一致（程序验证）', transformed_same_content: '同一图像内容',
    content_different: '内容不同', unverified: '证据不足',
};
export function ConsistencyModelAnalysis({ reference, members, result, error }) {
    const detail = useResource('job_id' in reference
        ? `/consistency/checks/${encodeURIComponent(reference.job_id)}/anchors/${encodeURIComponent(reference.anchor_id)}` : null);
    const reason = detail.data?.reason;
    return _jsxs("section", { className: "dc-model-panel", "aria-label": "\u6A21\u578B\u5206\u6790", children: [_jsx("h3", { children: "\u6A21\u578B\u5206\u6790" }), 'job_id' in reference && _jsx("div", { "aria-label": "\u56FE\u50CF\u8EAB\u4EFD\u4E0E\u5185\u5BB9\u9A8C\u8BC1", children: detail.loading ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u56FE\u50CF\u8EAB\u4EFD\u9A8C\u8BC1\u2026" }) : detail.error ?
                    _jsx("p", { role: "alert", className: "iad-error", children: detail.error }) : detail.data?.gates.length ?
                    detail.data.gates.map(gate => _jsxs("div", { "data-dc": "identity-analysis", children: [_jsxs("p", { className: "dc-analysis-sources", children: [gate.candidate_id.slice(gate.candidate_id.indexOf(':') + 1).split('/').pop(), "\uFF1A", gate.relation ? identityRelations[gate.relation] : '验证失败'] }), _jsx("p", { children: gate.reason }), gate.limitations.map((limitation, index) => _jsx("p", { children: limitation }, index))] }, gate.gate_id)) : _jsx("p", { children: reason === 'NO_CANDIDATES' ? '未检索到候选，未进行图像身份与内容验证。' : '尚无已保存的图像身份与内容验证记录。' }) }), _jsx("div", { "aria-label": "\u6807\u6CE8\u5BA1\u6838", children: result ? _jsxs(_Fragment, { children: [result.conclusions.map((conclusion, index) => _jsxs("div", { children: [_jsx("p", { className: "dc-analysis-sources", children: conclusion.references.map(reference => members.find(member => member.image.sample.sample_id === reference.candidate_id)?.image.sample.relative_path.split('/').pop()
                                        || reference.candidate_id.split('/').pop()).join('、') }), _jsx("p", { children: conclusion.text })] }, index)), result.limitations.map((limitation, index) => _jsx("p", { children: limitation }, index))] }) : error ? _jsx("p", { role: "alert", className: "iad-error", children: error }) : _jsx("p", { children: reason === 'NO_ELIGIBLE_CANDIDATES' ? '无有效候选，未进行标注审核。' :
                        reason === 'NO_CANDIDATES' ? '未检索到候选，未进行标注审核。' : '暂无已保存的标注审核分析。' }) })] });
}
