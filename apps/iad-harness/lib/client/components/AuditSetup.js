import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Select } from './Select.js';
import { Button } from './Button.js';
import { useEffect, useRef, useState } from 'react';
import { message, request, sampleQuery } from '../api.js';
import { useWorkbenchModel } from '../models.js';
import { useWorkspace } from '../workspace.js';
import { promptDefaults } from '../../shared/prompt-defaults.generated.js';
export function AuditSetup({ datasets, filters, jobs, revision, onStarted, onCancel, onBusyChange }) {
    const { workspace } = useWorkspace(), model = useWorkbenchModel();
    const view = workspace.view('industrial-audit');
    const identity = JSON.stringify([datasets.map(dataset => dataset.dataset_id).sort(), filters, revision]);
    const [result, setResult] = useState();
    const rows = result?.identity === identity ? result.rows : null;
    const [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [instruction, setInstruction] = useState(promptDefaults.audit);
    const requests = useRef(new Map()), started = useRef(new Map());
    useEffect(() => {
        const controller = new AbortController();
        Promise.all(datasets.map(async (dataset) => {
            const [catalog, samples] = await Promise.all([
                request(`/knowledge/versions?${new URLSearchParams({ dataset_id: dataset.dataset_id })}`, undefined, undefined, controller.signal),
                request(`/samples/${encodeURIComponent(dataset.task_id)}?${sampleQuery(dataset.dataset_id, filters, 1, 1)}`, undefined, undefined, controller.signal),
            ]);
            return { dataset, catalog, total: samples.total };
        })).then(rows => { if (!controller.signal.aborted)
            setResult({ identity, rows, error: '' }); })
            .catch(error => { if (!controller.signal.aborted)
            setResult({ identity, rows: [], error: message(error) }); });
        return () => controller.abort();
    }, [identity]);
    const unavailable = rows?.find(({ catalog, total }) => !total || !catalog.versions.some(version => version.version_id === catalog.current_version_id));
    const reason = !model.ready ? model.error || model.view?.error || '请先配置工作台模型'
        : !instruction.trim() ? '请填写审计提示词'
            : result?.identity === identity && result.error ? result.error
                : !rows ? '正在读取范围和已发布知识'
                    : !rows.length ? '请选择子数据集'
                        : unavailable ? `${unavailable.dataset.name}：${unavailable.total ? '请先生成统一知识' : '当前范围没有图像'}`
                            : !started.current.size && jobs.some(job => ['PENDING', 'RUNNING'].includes(job.status)) ? '当前范围仍有审计作业执行中' : '';
    const cancel = () => { if (!busy) {
        if (started.current.size)
            onStarted(Array.from(started.current.values()));
        else
            onCancel();
    } };
    const provider = model.view?.providers.find(provider => provider.provider_id === model.view?.selection?.provider_id);
    const selectedModel = provider?.models.find(item => item.model_id === model.view?.selection?.model_id);
    async function start() {
        if (reason || !rows?.length || busy)
            return;
        const corpus_scope = { kind: 'datasets',
            dataset_ids: [rows[0].dataset.dataset_id, ...rows.slice(1).map(row => row.dataset.dataset_id)] };
        setBusy(true);
        onBusyChange(true);
        setError('');
        try {
            for (const { dataset, catalog } of rows) {
                if (started.current.has(dataset.dataset_id))
                    continue;
                if (!requests.current.has(dataset.dataset_id)) {
                    const knowledge = catalog.current_version_id;
                    requests.current.set(dataset.dataset_id, { submission_id: crypto.randomUUID(), dataset_id: dataset.dataset_id,
                        knowledge_version_id: knowledge, filters, consistency_mode: view.auditConsistencyMode, instruction,
                        corpus_scope });
                }
                const job = await request('/audit/start', requests.current.get(dataset.dataset_id));
                started.current.set(dataset.dataset_id, job);
            }
            onStarted(Array.from(started.current.values()));
        }
        catch (error) {
            setError(`${started.current.size ? `已启动 ${started.current.size} 个子数据集。` : ''}${message(error)}`);
        }
        finally {
            setBusy(false);
            onBusyChange(false);
        }
    }
    return _jsxs(_Fragment, { children: [_jsxs("div", { className: "audit-create-grid", children: [_jsxs("label", { className: "audit-field", children: [_jsx("span", { children: "\u6A21\u578B" }), _jsx(Select, { id: "audit-create-model", "aria-label": "\u5BA1\u8BA1\u6A21\u578B", disabled: true, children: _jsx("option", { children: selectedModel?.name || model.view?.selection?.model_id || '未配置' }) })] }), _jsxs("label", { className: "audit-field", children: [_jsx("span", { children: "\u4E00\u81F4\u6027\u68C0\u67E5" }), _jsxs(Select, { id: "audit-create-mode", "aria-label": "\u5BA1\u8BA1\u4E00\u81F4\u6027\u6A21\u5F0F", value: view.auditConsistencyMode, disabled: busy || requests.current.size > 0, onChange: event => workspace.updateView('industrial-audit', { auditConsistencyMode: event.target.value }), children: [_jsx("option", { value: "exact", children: "\u7CBE\u786E\u68C0\u67E5" }), _jsx("option", { value: "combined", children: "\u7CBE\u786E\u4E0E\u89C6\u89C9\u68C0\u67E5" })] })] }), _jsxs("label", { className: "audit-field", children: [_jsx("span", { children: "\u5B8C\u6574\u63D0\u793A\u8BCD" }), _jsx("textarea", { id: "audit-create-prompt", "aria-label": "\u5BA1\u8BA1\u5B8C\u6574\u63D0\u793A\u8BCD", disabled: busy || requests.current.size > 0, value: instruction, onChange: event => setInstruction(event.target.value) })] })] }), _jsxs("div", { className: "audit-confirm", children: [_jsxs("div", { children: [_jsx("h3", { children: "\u786E\u8BA4\u5E76\u542F\u52A8" }), _jsxs("p", { id: "audit-create-summary", children: [datasets.length, " \u4E2A\u5B50\u6570\u636E\u96C6\uFF0C", rows ? rows.reduce((total, row) => total + row.total, 0) : '…', " \u5F20\u56FE\u50CF\uFF0C", selectedModel?.name || model.view?.selection?.model_id || '未配置模型', "\uFF0C\u5F53\u524D\u5DF2\u53D1\u5E03\u77E5\u8BC6"] })] }), _jsxs("div", { className: "audit-create-actions", children: [_jsx(Button, { type: "button", id: "audit-create-cancel", disabled: busy, onClick: cancel, children: "\u53D6\u6D88" }), _jsx(Button, { type: "button", variant: "primary", id: "audit-create-submit", disabled: busy || !!reason, onClick: () => void start(), children: busy ? '启动中…' : started.current.size ? '继续启动剩余审计' : '开始审计' })] })] }), reason && _jsx("p", { role: "status", children: reason }), error && _jsx("p", { role: "alert", children: error }), !!rows?.length && _jsxs("details", { className: "audit-create-versions", children: [_jsx("summary", { children: "\u67E5\u770B\u51BB\u7ED3\u77E5\u8BC6\u4F9D\u636E" }), _jsx("ul", { children: rows.map(({ dataset, catalog }) => _jsxs("li", { children: [dataset.name, "\uFF1A", catalog.current_version_id || '暂无知识'] }, dataset.dataset_id)) })] })] });
}
