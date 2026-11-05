import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Select } from './Select.js';
import { useEffect, useMemo, useState } from 'react';
import { reportRequirements } from '../../shared/report-requirements.generated.js';
import { promptDefaults } from '../../shared/prompt-defaults.generated.js';
import { jobStatuses } from '../../shared/job-display.js';
import { auditEvidenceUrl, message, request } from '../api.js';
import { useResource } from '../useResource.js';
import { Button } from './Button.js';
import { ThumbnailCard } from './ThumbnailCard.js';
import { ImageViewer } from './ImageViewer.js';
const statuses = { evaluable: '可评估', limited: '限定评估', needs_evidence: '待补证', unsupported: '不支持该指标' };
const outcomes = { normal_candidate: '未发现明确异常', anomaly_candidate: '异常候选', insufficient: '证据不足', not_processed: '未处理' };
function CountChart({ title, values, labels }) {
    const total = Object.values(values).reduce((sum, value) => sum + value, 0);
    return _jsxs("figure", { className: "iad-report-chart", "aria-label": title, children: [_jsx("figcaption", { children: title }), Object.entries(values).map(([key, value]) => _jsxs("div", { className: "iad-report-bar", children: [_jsx("span", { children: labels[key] || key }), _jsx("meter", { min: 0, max: Math.max(1, total), value: value, "aria-label": `${labels[key] || key} ${value}` }), _jsx("span", { children: value })] }, key))] });
}
export function DatasetReport({ datasetIds, onSample }) {
    const scope = JSON.stringify([...datasetIds].sort());
    const [revision, setRevision] = useState(0), [chosen, setChosen] = useState(''), [instruction, setInstruction] = useState(promptDefaults.report);
    const [busy, setBusy] = useState(false), [error, setError] = useState(''), [lightbox, setLightbox] = useState(null);
    const catalog = useResource(datasetIds.length ? `/dataset-reports?${new URLSearchParams({ dataset_ids: scope })}` : null, revision);
    const runId = chosen || catalog.data?.reports[0]?.run_id || '';
    const [poll, setPoll] = useState(0);
    const state = useResource(runId ? `/dataset-reports/${encodeURIComponent(runId)}/status` : null, poll);
    const running = state.data?.status === 'RUNNING' || state.data?.status === 'PENDING';
    useEffect(() => {
        if (!running)
            return;
        const timer = window.setInterval(() => { if (!document.hidden)
            setPoll(value => value + 1); }, 2000);
        return () => clearInterval(timer);
    }, [running]);
    const result = useResource(state.data?.status === 'COMPLETED' ? `/dataset-reports/${encodeURIComponent(runId)}` : null);
    const report = result.data;
    const pictures = useMemo(() => new Map((report?.evidence || []).map(item => [item.image.evidence_id, item])), [report]);
    const source = (item) => ({ src: auditEvidenceUrl(item.suggestion_id, item.image), title: '报告图像证据',
        width: item.image.original_size[0], height: item.image.original_size[1], sampleId: item.source.sample.sample_id, evidence: item.image,
        annotationLayer: { kind: 'sample', sample: item.source.sample, annotations: item.source.annotations,
            maskUrls: Object.fromEntries(Object.entries(item.source.mask_evidence_ids).map(([id, eid]) => [id, auditEvidenceUrl(item.suggestion_id, { evidence_id: eid })])) } });
    async function generate() {
        setBusy(true);
        setError('');
        try {
            const job = await request('/dataset-reports', { submission_id: crypto.randomUUID(), dataset_ids: datasetIds, instruction });
            setChosen(job.run_id);
            setPoll(value => value + 1);
            setRevision(value => value + 1);
        }
        catch (failure) {
            setError(message(failure));
        }
        finally {
            setBusy(false);
        }
    }
    async function download() {
        setBusy(true);
        setError('');
        try {
            const response = await fetch(`/api/iad/dataset-reports/${encodeURIComponent(runId)}/export`);
            if (!response.ok)
                throw new Error((await response.json()).error?.message || '报告导出失败');
            const url = URL.createObjectURL(await response.blob()), anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `dataset-report-${runId}.html`;
            anchor.click();
            setTimeout(() => URL.revokeObjectURL(url), 0);
        }
        catch (failure) {
            setError(message(failure));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs("section", { className: "audit-panel iad-dataset-report", id: "audit-report", children: [_jsxs("header", { className: "audit-panel-head", children: [_jsx("h2", { children: "\u6570\u636E\u96C6\u4E0E\u6A21\u578B\u80FD\u529B\u62A5\u544A" }), _jsxs("div", { className: "iad-actions", children: [_jsx(Button, { variant: "primary", id: "generate-scope-report", disabled: !datasetIds.length || busy || running || !instruction.trim(), onClick: generate, children: busy ? '正在提交…' : '生成报告' }), _jsx(Button, { disabled: !report || busy, onClick: download, children: "\u5BFC\u51FA HTML" })] })] }), _jsxs("div", { className: "iad-report-body", children: [_jsxs("details", { className: "iad-report-prompt", children: [_jsx("summary", { children: "\u5B8C\u6574\u63D0\u793A\u8BCD" }), _jsx("textarea", { "aria-label": "\u62A5\u544A\u5B8C\u6574\u63D0\u793A\u8BCD", value: instruction, onChange: event => setInstruction(event.target.value), disabled: busy || running })] }), !!catalog.data?.reports.length && _jsxs("label", { className: "iad-field", children: ["\u62A5\u544A\u8BB0\u5F55", _jsx(Select, { "aria-label": "\u62A5\u544A\u8BB0\u5F55", value: runId, onChange: event => setChosen(event.target.value), children: catalog.data.reports.map(item => _jsxs("option", { value: item.run_id, children: [new Date(item.created_at).toLocaleString(), "\uFF0C", jobStatuses[item.status]] }, item.run_id)) })] }), (error || catalog.error || state.error || result.error) && _jsx("p", { role: "alert", children: error || catalog.error || state.error || result.error }), state.data && running && _jsx("p", { role: "status", children: "\u6B63\u5728\u5206\u6790\u51BB\u7ED3\u8303\u56F4\u2026" }), state.data?.error && _jsx("p", { role: "alert", children: state.data.error }), !runId && !catalog.loading && _jsx("p", { children: "\u5F53\u524D\u8303\u56F4\u8FD8\u6CA1\u6709\u62A5\u544A\uFF0C\u53EF\u4EE5\u751F\u6210\u65B0\u62A5\u544A\u3002" }), report && _jsxs(_Fragment, { children: [_jsxs("div", { className: "iad-report-charts", children: [_jsx(CountChart, { title: "\u5BA1\u8BA1\u8986\u76D6", values: { audited: report.audited_samples, unprocessed: report.registered_samples - report.audited_samples }, labels: { audited: '已审计', unprocessed: '未审计' } }), _jsx(CountChart, { title: "\u5BA1\u8BA1\u7ED3\u679C\u5206\u5E03", values: report.outcomes, labels: outcomes }), _jsx(CountChart, { title: "\u539F\u59CB\u6807\u7B7E\u5206\u5E03", values: report.raw_labels, labels: { PASS: 'OK', FAIL: 'NG', UNCERTAIN: '待定' } })] }), Object.entries(reportRequirements).map(([key, requirement]) => {
                                const section = report.conclusion.sections[key];
                                const data = requirement.data.flatMap(name => report.data[name] || []);
                                return _jsxs("section", { "data-report-section": key, className: "iad-report-section", children: [_jsx("h3", { children: requirement.title }), _jsx("p", { children: statuses[section.status] }), _jsx("p", { children: section.analysis }), _jsx("dl", { className: "iad-report-data", children: data.map((item, index) => _jsxs("div", { children: [_jsx("dt", { children: item.label }), _jsx("dd", { children: item.value }), _jsx("dd", { children: item.basis })] }, index)) }), _jsx("p", { children: section.conclusion }), !!section.missing_evidence.length && _jsxs("p", { children: ["\u5F85\u8865\u5145\uFF1A", section.missing_evidence.join('；')] }), !!section.evidence_ids.length && _jsx("div", { className: "iad-actions", children: [...new Set(section.evidence_ids)].map((id, index) => {
                                                const evidence = pictures.get(id);
                                                return evidence && _jsxs(Button, { onClick: () => setLightbox(source(evidence)), children: ["\u56FE\u50CF ", index + 1] }, id);
                                            }) })] }, key);
                            }), _jsxs("section", { className: "iad-report-section", children: [_jsx("h3", { children: "\u6570\u636E\u96C6\u80FD\u529B\u7ED3\u8BBA" }), _jsx("p", { children: report.conclusion.dataset_analysis }), _jsx("p", { children: report.conclusion.dataset_conclusion })] }), _jsxs("section", { className: "iad-report-section", children: [_jsx("h3", { children: "\u6A21\u578B\u80FD\u529B\u7ED3\u8BBA" }), _jsx("p", { children: report.conclusion.model_analysis }), _jsx("p", { children: report.conclusion.model_conclusion })] }), _jsxs("section", { className: "iad-report-section", children: [_jsx("h3", { children: "\u56FE\u50CF\u8BC1\u636E" }), _jsx("div", { className: "iad-thumbnail-grid", children: report.evidence.map((item, index) => _jsxs("div", { children: [_jsx(ThumbnailCard, { src: auditEvidenceUrl(item.suggestion_id, item.image), label: `图像 ${index + 1}`, onClick: () => setLightbox(source(item)) }), _jsx(Button, { onClick: () => onSample(item.audit_sample), children: "\u67E5\u770B\u5BA1\u8BA1" })] }, item.image.evidence_id)) })] })] })] }), lightbox && _jsx(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })] });
}
