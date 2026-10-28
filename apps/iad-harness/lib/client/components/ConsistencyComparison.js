import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { mediaUrl, message, request } from '../api.js';
import { ImageCanvas } from './ImageCanvas.js';
import { imageRelations, differenceLabels } from '../../shared/consistency-presentation.js';
import { useWorkspace } from '../workspace.js';
export function ConsistencyComparison({ member, query, temporary, differenceId, onDifference, frozen }) {
    const { workspace } = useWorkspace();
    const [saving, setSaving] = useState(false);
    const saveRequest = useRef(null);
    useEffect(() => () => saveRequest.current?.abort(), []);
    const [detail, setDetail] = useState(null), [error, setError] = useState('');
    const [transform, setTransform] = useState({ zoom: 0, x: 0, y: 0 }), [synchronized, setSynchronized] = useState(true);
    const [rightTransform, setRightTransform] = useState({ zoom: 0, x: 0, y: 0 });
    const [showDifferences, setShowDifferences] = useState(true);
    useEffect(() => {
        if (frozen)
            return;
        const controller = new AbortController();
        request(`/sample/${encodeURIComponent(member.sample_id)}`, undefined, undefined, controller.signal)
            .then(data => { if (!controller.signal.aborted)
            setDetail(data); }).catch(failure => { if (!controller.signal.aborted)
            setError(message(failure)); });
        return () => controller.abort();
    }, [member.sample_id, frozen]);
    const selected = member.annotation?.differences.find(row => row.difference_id === differenceId);
    const region = showDifferences && selected?.region ? { id: selected.difference_id, bbox: selected.region } : undefined;
    const image = (data) => ({ src: mediaUrl(data.sample), title: data.sample.relative_path, width: data.sample.width, height: data.sample.height,
        annotationLayer: { kind: 'sample', sample: data.sample, annotations: data.annotations } });
    const sources = frozen ? ['left', 'right'].map(side => {
        const source = frozen.sources[side], media = frozen.media.find(item => item.side === side && item.representation === 'preview' && !item.difference_id);
        const url = (mediaId) => `/api/iad/consistency/evidence/${encodeURIComponent(frozen.result.evidence_id)}/media/${encodeURIComponent(mediaId)}`;
        const valid = frozen.media.find(item => item.media_id === side + '-annotation_overlay')?.available;
        return { src: url(media.media_id), title: source.sample.relative_path, width: source.sample.width, height: source.sample.height,
            annotationLayer: valid ? { kind: 'sample', sample: source.sample, annotations: source.annotations.annotations,
                maskUrls: Object.fromEntries(frozen.media.filter(item => item.side === side && item.annotation_id).map(item => [item.annotation_id, url(item.media_id)])) } : undefined };
    }) : [query ? image(query) : temporary ? { src: temporary.preview, title: temporary.name } : null, detail ? image(detail) : null];
    async function save() {
        if (!query)
            return;
        setSaving(true);
        setError('');
        const controller = new AbortController();
        saveRequest.current = controller;
        try {
            const result = await request('/consistency/compare', { sample_a: query.sample.sample_id, sample_b: member.sample_id }, undefined, controller.signal);
            if (controller.signal.aborted)
                return;
            workspace.updateConsistency({ batchId: undefined, evidenceId: result.evidence_id, resultId: result.result_id }, true);
        }
        catch (failure) {
            if (!controller.signal.aborted)
                setError(message(failure));
        }
        finally {
            if (!controller.signal.aborted)
                setSaving(false);
        }
    }
    return _jsxs(_Fragment, { children: [_jsxs("section", { className: "iad-consistency-comparison", "aria-label": "\u53CC\u56FE\u6BD4\u8F83", children: [_jsxs("div", { className: "iad-row", children: [_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: synchronized, onChange: event => { if (!event.target.checked)
                                            setRightTransform(transform); setSynchronized(event.target.checked); } }), "\u540C\u6B65\u7F29\u653E\u4E0E\u5E73\u79FB"] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: showDifferences, onChange: event => setShowDifferences(event.target.checked) }), "\u5DEE\u5F02\u533A\u57DF"] }), _jsx("span", { className: "iad-muted", children: member.relation === 'EXACT' ? '已按原始解码像素核验' : '尚无严格同图证明' }), !frozen && query && _jsx("button", { disabled: saving || !detail, onClick: () => void save(), children: saving ? '正在保存…' : '保存比较证据' })] }), error && _jsx("p", { className: "iad-error", role: "alert", children: error }), _jsx("div", { className: "iad-consistency-canvases", children: sources.map((source, index) => _jsxs("div", { className: "iad-consistency-side", children: [_jsx("p", { children: index ? '候选图像' : '查询图像' }), source ? _jsx(ImageCanvas, { image: source, embedded: true, control: index === 0 || synchronized ? { transform, onChange: setTransform } : { transform: rightTransform, onChange: setRightTransform }, focusRegion: region, overlay: region && source.width && source.height ? _jsx("svg", { className: "iad-finding-layer iad-consistency-region", viewBox: `0 0 ${source.width} ${source.height}`, children: _jsx("rect", { x: region.bbox[0], y: region.bbox[1], width: region.bbox[2] - region.bbox[0], height: region.bbox[3] - region.bbox[1], strokeDasharray: selected?.reference_from_other === (index ? 'right' : 'left') ? '6 4' : undefined }) }) : undefined }) : _jsx("p", { role: "status", className: "iad-empty", children: error ? '来源不可用' : '正在读取图像…' })] }, index)) })] }), _jsxs("aside", { className: "iad-consistency-differences", "aria-label": "\u6807\u6CE8\u5DEE\u5F02", children: [_jsx("h2", { children: "\u6807\u6CE8\u5DEE\u5F02" }), _jsx("p", { className: "iad-muted", children: member.annotation ? `规范${{ SAME: '相同', DIFFERENT: '不同', UNKNOWN: '未知' }[member.annotation.policy_relation]} · ${member.annotation.status === 'COMPLETE' ? '比较完成' : '比较不完整'}` : '尚未比较标注' }), member.pixel.status === 'COMPLETE' && _jsxs("dl", { children: [_jsx("dt", { children: "\u6BD4\u8F83\u50CF\u7D20" }), _jsx("dd", { children: member.pixel.compared_pixels.toLocaleString() }), _jsx("dt", { children: "\u53D8\u5316\u50CF\u7D20" }), _jsx("dd", { children: member.pixel.changed_pixels === null ? '未计算' : member.pixel.changed_pixels.toLocaleString() })] }), member.local && (member.local.status === 'COMPLETE' ? _jsxs("dl", { children: [_jsx("dt", { children: "\u6709\u6548\u533A\u57DF\u50CF\u7D20" }), _jsx("dd", { "data-stat": "local-compared", children: member.local.compared_pixels.toLocaleString() }), _jsx("dt", { children: "\u5C40\u90E8\u53D8\u5316\u50CF\u7D20" }), _jsx("dd", { children: member.local.changed_pixels?.toLocaleString() }), _jsx("dt", { children: "\u5C40\u90E8\u6700\u5927\u5DEE\u503C" }), _jsx("dd", { children: member.local.max_abs_diff })] })
                        : _jsxs("p", { className: "iad-muted", children: ["\u5C40\u90E8\u5DEE\u5F02\u4E0D\u53EF\u6BD4\u8F83\uFF1A", member.local.reason] })), member.near && _jsxs(_Fragment, { children: [_jsx("p", { children: imageRelations[member.relation] }), _jsx("p", { className: "iad-muted", children: "\u7F29\u7565\u56FE\u8FD1\u4F3C\u590D\u6838\u4EC5\u7528\u4E8E\u5019\u9009\u5206\u7EA7\u3002" }), member.near.pixel_cosine !== null && _jsxs("dl", { children: [_jsx("dt", { children: "\u7070\u5EA6\u4F59\u5F26" }), _jsx("dd", { children: member.near.pixel_cosine.toFixed(4) }), _jsx("dt", { children: "NCC" }), _jsx("dd", { children: member.near.ncc?.toFixed(4) })] }), member.registration?.status === 'UNSUPPORTED' && _jsx("p", { className: "iad-muted", children: "\u5C40\u90E8\u914D\u51C6\u672A\u542F\u7528\uFF0C\u4E0D\u8FDB\u884C\u8DE8\u5750\u6807\u6807\u6CE8\u5BF9\u8D26\u3002" })] }), member.reason && _jsx("p", { className: "iad-error", children: member.reason }), member.annotation?.differences.map(difference => _jsxs("button", { "data-difference": difference.type, className: selected === difference ? 'is-selected' : '', "aria-pressed": selected === difference, onClick: () => onDifference(difference.difference_id), children: [_jsxs("strong", { children: [differenceLabels[difference.type], " \u00B7 ", difference.confirmed_conflict ? '已确认冲突' : '待定'] }), _jsxs("span", { children: ["\u67E5\u8BE2\uFF1A", difference.type === 'QUALITY_LABEL' ? String(difference.facts.left_quality) : difference.left.map(annotation => annotation.raw_label).join('、') || '无对应标注'] }), _jsxs("span", { children: ["\u5019\u9009\uFF1A", difference.type === 'QUALITY_LABEL' ? String(difference.facts.right_quality) : difference.right.map(annotation => annotation.raw_label).join('、') || '无对应标注'] }), difference.reference_from_other && _jsxs("small", { children: ["\u865A\u7EBF\u4F4D\u7F6E\u6765\u81EA", difference.reference_from_other === 'left' ? '候选' : '查询', "\u56FE\u50CF\u6807\u6CE8\uFF0C\u4EC5\u4F5C\u53C2\u8003"] }), difference.pending.map((reason, index) => _jsx("small", { children: reason }, index))] }, difference.difference_id)), member.annotation?.differences.length === 0 && _jsx("p", { children: member.annotation.status === 'COMPLETE' ? '当前可比较标注未发现差异' : '当前未取得可判定差异' }), !!member.annotation?.masking.length && _jsxs("details", { children: [_jsx("summary", { children: "\u5FFD\u7565\u533A\u57DF" }), member.annotation.masking.map(row => _jsxs("p", { children: ["\u53EF\u89C1 ", row.visible_pixels, "/", row.total_pixels, " \u50CF\u7D20"] }, row.annotation_id))] })] })] });
}
