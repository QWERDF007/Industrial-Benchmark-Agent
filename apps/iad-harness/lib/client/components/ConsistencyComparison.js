import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { mediaUrl, message, request } from '../api.js';
import { frozenConsistencyImage } from '../consistency-images.js';
import { ConsistencyCanvasPair } from './ConsistencyCanvasPair.js';
import { ConsistencyDifferences } from './ConsistencyDifferences.js';
import { useWorkspace } from '../workspace.js';
export function ConsistencyComparison({ member, query, temporary, differenceId, onDifference, frozen }) {
    const { workspace } = useWorkspace();
    const [saving, setSaving] = useState(false);
    const saveRequest = useRef(null);
    useEffect(() => () => saveRequest.current?.abort(), []);
    const [detail, setDetail] = useState(null), [error, setError] = useState('');
    const [synchronized, setSynchronized] = useState(true);
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
    const image = (data) => ({ src: mediaUrl(data.sample), title: data.sample.relative_path, width: data.sample.width, height: data.sample.height,
        annotationLayer: { kind: 'sample', sample: data.sample, annotations: data.annotations } });
    const sources = frozen ? [frozenConsistencyImage(frozen, 'left'), frozenConsistencyImage(frozen, 'right')] : [query ? image(query) : temporary ? { src: temporary.preview, title: temporary.name } : null, detail ? image(detail) : null];
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
    return _jsxs(_Fragment, { children: [_jsxs("section", { className: "iad-consistency-comparison", "aria-label": "\u53CC\u56FE\u6BD4\u8F83", children: [_jsxs("div", { className: "iad-row", children: [_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: synchronized, onChange: event => setSynchronized(event.target.checked) }), "\u540C\u6B65\u7F29\u653E\u4E0E\u5E73\u79FB"] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: showDifferences, onChange: event => setShowDifferences(event.target.checked) }), "\u5DEE\u5F02\u533A\u57DF"] }), _jsx("span", { className: "iad-muted", children: member.relation === 'EXACT' ? '已按原始解码像素核验' : '尚无严格同图证明' }), !frozen && query && _jsx("button", { disabled: saving || !detail, onClick: () => void save(), children: saving ? '正在保存…' : '保存比较证据' })] }), error && _jsx("p", { className: "iad-error", role: "alert", children: error }), _jsx(ConsistencyCanvasPair, { sources: sources, selected: selected, synchronized: synchronized, showDifferences: showDifferences })] }), _jsx(ConsistencyDifferences, { member: member, differenceId: differenceId, onDifference: onDifference })] });
}
