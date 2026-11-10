import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
export function directionEvidence(snapshot, direction) {
    const all = snapshot.evidence.map(evidence => {
        return { id: evidence.evidence_id, evidence, title: evidence.filename, filename: evidence.filename.split('/').at(-1) };
    });
    const originals = new Map(all.filter(item => item.evidence.image.representation === 'raw'
        && item.evidence.image.role === 'overview'
        && item.evidence.image.crop_bbox.every((value, index) => value === [0, 0, ...item.evidence.image.original_size][index]))
        .map(item => [JSON.stringify([item.evidence.sample_id, item.evidence.image.source_sha256]), item]));
    const displayed = new Map(all.map(item => [item.id, originals.get(JSON.stringify([item.evidence.sample_id, item.evidence.image.source_sha256]))]));
    const ids = direction.key_evidence?.map(item => item.evidence_id)
        ?? (snapshot.finalization ? [] : [...direction.evidence_ids, ...direction.counter_evidence_ids]);
    const selected = new Set(ids.map(id => displayed.get(id)?.id || id));
    const counters = { normal: 0, defect: 0, unknown: 0 };
    const images = new Map([...originals.values()].map(item => [item.id, item]));
    const entries = [...selected].map(id => {
        const item = images.get(id);
        if (!item)
            return { id, evidence: null, label: '证据缺失', ref: '', kind: 'unknown', title: id, filename: id };
        const kind = item.evidence.sampling_group === 'normal' ? 'normal' : item.evidence.sampling_group === 'abnormal' ? 'defect'
            : item.evidence.candidate_role || 'unknown';
        const ref = { normal: 'N', defect: 'A', unknown: 'U' }[kind] + ++counters[kind];
        return { ...item, kind, ref, label: `${{ normal: '良品', defect: '异常', unknown: '未分类' }[kind]} ${ref}` };
    });
    const references = new Map();
    for (const item of entries) {
        if (item.evidence)
            references.set(item.id, { id: item.ref, label: item.label });
    }
    return { entries, references, counters };
}
export function ReferencedText({ text, references, onReference, onPreview, className = 'iad-evidence-ref', highlightedId }) {
    if (!references.size)
        return _jsx(_Fragment, { children: text });
    const ids = [...references.keys()].map(id => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(?<![A-Za-z0-9_])(${ids.join('|')})(?![A-Za-z0-9_])`, 'g');
    const rendered = [];
    const cited = new Set();
    let separator = '';
    for (const [index, part] of text.split(pattern).entries()) {
        if (!part)
            continue;
        const reference = references.get(part);
        if (!reference) {
            if (cited.size && /^[\s、，,和与及至到~～—–-]+$/.test(part))
                separator = part;
            else {
                rendered.push(separator, part);
                separator = '';
                cited.clear();
            }
            continue;
        }
        if (cited.has(reference.id)) {
            separator = '';
            continue;
        }
        rendered.push(separator, _jsx("button", { type: "button", className: `${className}${highlightedId === reference.id ? ' is-related' : ''}`, "data-evidence-ref": reference.id, "aria-label": `定位证据 ${reference.label}`, onClick: () => onReference(reference.id), onMouseEnter: () => onPreview(reference.id, true), onMouseLeave: () => onPreview(reference.id, false), onFocus: () => onPreview(reference.id, true), onBlur: () => onPreview(reference.id, false), children: reference.label }, index));
        separator = '';
        cited.add(reference.id);
    }
    rendered.push(separator);
    return _jsx(_Fragment, { children: rendered });
}
