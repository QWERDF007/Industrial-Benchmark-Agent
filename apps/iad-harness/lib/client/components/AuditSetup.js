import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { v4 as uuid } from 'uuid';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { message, request } from '../api.js';
import { useModuleSettings } from '../useModuleSettings.js';
import { promptDefaults } from '../../shared/prompt-defaults.generated.js';
import { useResource } from '../useResource.js';
import { Button } from './Button.js';
import { AgentPromptEditors, PromptTextEditor } from './AgentPromptEditors.js';
import { Pagination } from './Pagination.js';
import { Select } from './Select.js';
import { KnowledgeEntryDialog } from './KnowledgeEntryDialog.js';
import { ConsistencyStatisticsDialog } from './ConsistencyStatisticsDialog.js';
import { IconButton } from './IconButton.js';
import { ConsistencyView } from '../consistency-view.js';
import { queryClient } from '../query-client.js';
function sourceDuration(job) {
    if (!job.started_at || !job.finished_at)
        return '—';
    const seconds = Math.max(0, Math.round((Date.parse(job.finished_at) - Date.parse(job.started_at)) / 1000));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
export function AuditSetup({ datasets, jobs, revision, onStarted, onCancel, onBusyChange }) {
    const model = useModuleSettings('audit');
    const scope = JSON.stringify(datasets.map(dataset => dataset.dataset_id).sort());
    const catalog = useResource(`/audit/sources?${new URLSearchParams({ dataset_ids: scope })}`, revision);
    const [versionId, setVersionId] = useState(''), [entryIds, setEntryIds] = useState(new Set());
    const [consistencyId, setConsistencyId] = useState('');
    const [detail, setDetail] = useState(null);
    const [statisticsId, setStatisticsId] = useState('');
    const statistics = useQuery({ queryKey: ['iad', 'consistency-statistics', statisticsId], enabled: !!statisticsId,
        queryFn: ({ signal }) => ConsistencyView.statistics(statisticsId, signal) }, queryClient);
    const [benchmarkId, setBenchmarkId] = useState('');
    const [knowledgePage, setKnowledgePage] = useState(1), [entryPage, setEntryPage] = useState(1), [consistencyPage, setConsistencyPage] = useState(1);
    const [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [systemPrompt, setSystemPrompt] = useState(promptDefaults.system.audit);
    const [userPrompt, setUserPrompt] = useState(promptDefaults.audit);
    const [masterSystem, setMasterSystem] = useState(promptDefaults.auditMasterSystem);
    const [masterUser, setMasterUser] = useState(promptDefaults.auditBatch);
    const [reportPrompt, setReportPrompt] = useState(promptDefaults.auditReport);
    const submission = useRef();
    const knowledgeJobs = catalog.data?.knowledge_jobs || [], consistencyJobs = catalog.data?.consistency_jobs || [];
    const chosen = knowledgeJobs.find(item => item.version_id === versionId);
    const selectedEntries = chosen?.entries.filter(item => entryIds.has(item.check_id)) || [];
    const selectedConsistency = consistencyJobs.find(item => item.job_id === consistencyId);
    const reason = catalog.error || (catalog.loading ? '正在读取来源作业' : !datasets.length ? '请选择审计子数据集' :
        !selectedConsistency ? '请选择一个已完成的一致性作业' : !model.settings?.model ? model.error || '请先配置模型审计分析模型' :
            jobs.some(job => ['PENDING', 'RUNNING'].includes(job.status)) ? '当前范围仍有审计作业执行中' :
                !masterSystem.trim() || !masterUser.trim() ? '请填写主 Agent 提示词' : !systemPrompt.trim() || !userPrompt.trim() ? '请填写子 Agent 提示词' : !reportPrompt.trim() ? '请填写报告用户提示词' : '');
    function selectKnowledge(job) {
        if (job.version_id === versionId)
            return;
        setVersionId(job.version_id);
        setEntryIds(new Set());
        setEntryPage(1);
        setError('');
    }
    async function start() {
        if (reason || !selectedConsistency || busy)
            return;
        const body = { subset_ids: [datasets[0].dataset_id, ...datasets.slice(1).map(dataset => dataset.dataset_id)],
            knowledge: chosen && selectedEntries.length ? { job_id: chosen.job_id, version_id: chosen.version_id, entry_ids: selectedEntries.map(item => item.check_id) } : null,
            consistency_job_id: selectedConsistency.job_id, master_prompt: { system_prompt: masterSystem, user_prompt: masterUser },
            observer_prompt: { system_prompt: systemPrompt, user_prompt: userPrompt }, report_instruction: reportPrompt, benchmark_build_id: benchmarkId || null };
        const identity = JSON.stringify(body);
        if (submission.current?.identity !== identity)
            submission.current = { identity, id: uuid() };
        setBusy(true);
        onBusyChange(true);
        setError('');
        try {
            onStarted([await request('/audit/start', { ...body, submission_id: submission.current.id })]);
        }
        catch (failure) {
            setError(message(failure));
        }
        finally {
            setBusy(false);
            onBusyChange(false);
        }
    }
    return _jsxs("div", { className: "audit-create-page", id: "audit-create-view", "aria-busy": busy, children: [_jsxs("section", { className: "audit-panel audit-source-panel", children: [_jsx("header", { className: "audit-panel-head", children: _jsx("h2", { children: "\u77E5\u8BC6\u6316\u6398" }) }), _jsx("div", { id: "audit-create-knowledge-jobs", children: knowledgeJobs.length ? _jsxs(_Fragment, { children: [_jsx("div", { className: "audit-source-table", children: _jsxs("table", { className: "audit-table", children: [_jsxs("colgroup", { children: [_jsx("col", { style: { width: 64 } }), _jsx("col", { style: { width: '35%' } }), _jsx("col", { style: { width: '12%' } }), _jsx("col", { style: { width: '11%' } }), _jsx("col", { style: { width: '21%' } }), _jsx("col", {})] }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u9009\u62E9" }), _jsx("th", { children: "\u4F5C\u4E1A ID" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u5224\u636E\u6570" }), _jsx("th", { children: "\u63D0\u4EA4\u65F6\u95F4" }), _jsx("th", { children: "\u8017\u65F6" })] }) }), _jsx("tbody", { children: knowledgeJobs.slice((knowledgePage - 1) * 6, knowledgePage * 6).map(job => _jsxs("tr", { "data-version-id": job.version_id, "aria-selected": job.version_id === versionId, onClick: () => !busy && selectKnowledge(job), children: [_jsx("td", { children: _jsx("input", { type: "radio", name: "audit-knowledge-source", "aria-label": `选择知识作业 ${job.job_id}`, checked: job.version_id === versionId, disabled: busy, onChange: () => selectKnowledge(job) }) }), _jsx("td", { title: job.job_id, children: job.job_id }), _jsx("td", { children: _jsx("span", { className: "audit-status done", children: job.publication_status === 'partial' ? '部分成果' : '已完成' }) }), _jsx("td", { children: job.entries.length }), _jsx("td", { children: new Date(job.submitted_at).toLocaleString('zh-CN', { hour12: false }) }), _jsx("td", { children: sourceDuration(job) })] }, job.version_id)) })] }) }), _jsx(Pagination, { total: knowledgeJobs.length, page: knowledgePage, size: 6, label: "\u77E5\u8BC6\u6316\u6398\u6765\u6E90", hideSinglePage: true, onPage: setKnowledgePage })] }) : _jsx("p", { className: "iad-result-empty", role: "status", children: catalog.loading ? '正在读取来源作业…' : '当前没有已发布的挖掘知识' }) }), chosen && _jsxs("div", { id: "audit-create-entries", className: "audit-entry-area", children: [_jsxs("header", { className: "audit-entry-header", children: [_jsx("h3", { children: "\u77E5\u8BC6\u6761\u76EE" }), _jsxs("label", { className: "audit-pick-all", children: [_jsx("input", { id: "audit-entries-all", type: "checkbox", disabled: busy, checked: !!selectedEntries.length && selectedEntries.length === chosen.entries.length, onChange: event => setEntryIds(event.target.checked ? new Set(chosen.entries.map(item => item.check_id)) : new Set()) }), "\u5168\u9009"] })] }), _jsx("div", { className: "audit-source-table", children: _jsxs("table", { className: "audit-table", children: [_jsxs("colgroup", { children: [_jsx("col", { style: { width: 64 } }), _jsx("col", { style: { width: '27%' } }), _jsx("col", {}), _jsx("col", { style: { width: '14%' } })] }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u9009\u62E9" }), _jsx("th", { children: "\u77E5\u8BC6\u6761\u76EE" }), _jsx("th", { children: "\u63CF\u8FF0" }), _jsx("th", { children: "\u652F\u6301/\u53CD\u5BF9" })] }) }), _jsx("tbody", { children: chosen.entries.slice((entryPage - 1) * 8, entryPage * 8).map(entry => _jsxs("tr", { className: "audit-entry-row", "aria-selected": entryIds.has(entry.check_id), onClick: () => !busy && setDetail({ source: { kind: 'published', versionId: chosen.version_id }, checkId: entry.check_id }), children: [_jsx("td", { children: _jsx("input", { type: "checkbox", "aria-label": `选择知识条目 ${entry.title}`, checked: entryIds.has(entry.check_id), disabled: busy, onClick: event => event.stopPropagation(), onChange: event => setEntryIds(previous => { const next = new Set(previous); event.target.checked ? next.add(entry.check_id) : next.delete(entry.check_id); return next; }) }) }), _jsx("td", { children: _jsx("button", { type: "button", className: "audit-entry-title", disabled: busy, "aria-label": `查看知识条目 ${entry.title}`, children: entry.title }) }), _jsx("td", { className: "audit-description", children: entry.criterion }), _jsxs("td", { children: [entry.support_count, "/", entry.counter_count] })] }, entry.check_id)) })] }) }), _jsx(Pagination, { total: chosen.entries.length, page: entryPage, size: 8, label: "\u77E5\u8BC6\u6761\u76EE", hideSinglePage: true, onPage: setEntryPage })] })] }), _jsxs("section", { className: "audit-panel audit-source-panel", children: [_jsx("header", { className: "audit-panel-head", children: _jsx("h2", { children: "\u6570\u636E\u4E00\u81F4\u6027" }) }), _jsx("div", { id: "audit-create-consistency-jobs", children: consistencyJobs.length ? _jsxs(_Fragment, { children: [_jsx("div", { className: "audit-source-table", children: _jsxs("table", { className: "audit-table", children: [_jsxs("colgroup", { children: [_jsx("col", { style: { width: 64 } }), _jsx("col", { style: { width: '18%' } }), _jsx("col", { style: { width: '10%' } }), _jsx("col", { style: { width: '21%' } }), _jsx("col", { style: { width: '10%' } }), _jsx("col", { style: { width: '19%' } }), _jsx("col", {}), _jsx("col", { style: { width: 64 } })] }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u9009\u62E9" }), _jsx("th", { children: "\u4F5C\u4E1A" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u68C0\u67E5\u8303\u56F4" }), _jsx("th", { children: "\u51B2\u7A81\u603B\u6570" }), _jsx("th", { children: "\u63D0\u4EA4\u65F6\u95F4" }), _jsx("th", { children: "\u8017\u65F6" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: consistencyJobs.slice((consistencyPage - 1) * 7, consistencyPage * 7).map(job => _jsxs("tr", { "aria-selected": consistencyId === job.job_id, children: [_jsx("td", { children: _jsx("input", { type: "radio", name: "audit-consistency-source", "aria-label": `选择一致性检查 ${new Date(job.submitted_at).toLocaleString('zh-CN', { hour12: false })}`, checked: consistencyId === job.job_id, disabled: busy, onChange: () => setConsistencyId(job.job_id) }) }), _jsx("td", { children: "\u4E00\u81F4\u6027\u68C0\u67E5" }), _jsx("td", { children: _jsx("span", { className: "audit-status done", children: "\u5DF2\u5B8C\u6210" }) }), _jsx("td", { title: job.dataset_ids.map(id => datasets.find(dataset => dataset.dataset_id === id)?.name || id).join('、'), children: job.dataset_ids.map(id => datasets.find(dataset => dataset.dataset_id === id)?.name || id).join('、') }), _jsx("td", { children: job.conflict_count }), _jsx("td", { children: new Date(job.submitted_at).toLocaleString('zh-CN', { hour12: false }) }), _jsx("td", { children: sourceDuration(job) }), _jsx("td", { children: _jsx(IconButton, { icon: "stats", label: "\u67E5\u770B\u4E00\u81F4\u6027\u7EDF\u8BA1", title: "\u7EDF\u8BA1", onClick: () => setStatisticsId(job.job_id) }) })] }, job.job_id)) })] }) }), _jsx(Pagination, { total: consistencyJobs.length, page: consistencyPage, size: 7, label: "\u4E00\u81F4\u6027\u6765\u6E90", hideSinglePage: true, onPage: setConsistencyPage })] }) : _jsx("p", { className: "iad-result-empty", role: "status", children: catalog.loading ? '正在读取来源作业…' : '当前没有已完成的数据一致性检查作业' }) })] }), !!catalog.data?.benchmark_builds.length && _jsxs("section", { className: "audit-panel audit-source-panel", children: [_jsx("header", { className: "audit-panel-head", children: _jsx("h2", { children: "\u5DF2\u6709 Benchmark \u6210\u679C" }) }), _jsxs(Select, { "aria-label": "\u5DF2\u6709 Benchmark \u6210\u679C", value: benchmarkId, disabled: busy, onChange: event => setBenchmarkId(event.target.value), children: [_jsx("option", { value: "", children: "\u4E0D\u5173\u8054" }), catalog.data.benchmark_builds.map(build => _jsxs("option", { value: build.build_id, children: [build.name, "\uFF0C\u8986\u76D6 ", build.covered_images, " \u5F20\uFF0C\u6765\u6E90\u5171 ", build.source_images, " \u5F20"] }, build.build_id))] })] }), _jsxs("section", { className: "audit-panel audit-source-panel", children: [_jsx("header", { className: "audit-panel-head", children: _jsx("h2", { children: "\u63D0\u793A\u8BCD" }) }), _jsx(AgentPromptEditors, { id: "audit-master-prompt", agentLabel: "\u4E3B Agent", system: masterSystem, user: masterUser, onSystemChange: setMasterSystem, onUserChange: setMasterUser, disabled: busy }), _jsx(AgentPromptEditors, { id: "audit-observer-prompt", agentLabel: "\u5B50 Agent", system: systemPrompt, user: userPrompt, onSystemChange: setSystemPrompt, onUserChange: setUserPrompt, disabled: busy }), _jsx("div", { className: "iad-agent-prompts", children: _jsx(PromptTextEditor, { id: "audit-report-prompt", label: "\u62A5\u544A\u7528\u6237\u63D0\u793A\u8BCD", value: reportPrompt, onChange: setReportPrompt, disabled: busy }) })] }), _jsxs("section", { className: "audit-panel audit-source-panel", children: [_jsx("header", { className: "audit-panel-head", children: _jsx("h2", { children: "\u786E\u8BA4\u5E76\u542F\u52A8" }) }), _jsxs("div", { className: "audit-create-confirm", children: [_jsxs("dl", { className: "audit-create-facts", id: "audit-create-summary", "aria-live": "polite", children: [_jsxs("div", { children: [_jsx("dt", { children: "\u5BA1\u8BA1\u8303\u56F4" }), _jsx("dd", { children: datasets.map(dataset => dataset.name).join('、') || '未选择' })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u77E5\u8BC6\u6316\u6398" }), _jsx("dd", { children: chosen?.job_id || '未选择' })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u77E5\u8BC6\u6761\u76EE" }), _jsxs("dd", { children: [selectedEntries.length, " \u6761"] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u6570\u636E\u4E00\u81F4\u6027" }), _jsxs("dd", { children: [selectedConsistency ? 1 : 0, " \u4E2A\u5DF2\u5B8C\u6210\u4F5C\u4E1A"] })] })] }), _jsxs("div", { className: "audit-create-actions", children: [_jsx(Button, { id: "audit-create-cancel", disabled: busy, onClick: onCancel, children: "\u53D6\u6D88" }), _jsx(Button, { id: "audit-create-submit", variant: "primary", disabled: busy || !!reason, title: reason, onClick: () => void start(), children: busy ? '启动中…' : '开始审计' })] })] }), error && _jsx("p", { className: "audit-source-error", role: "alert", children: error }), catalog.error && _jsx("p", { className: "audit-source-error", role: "alert", children: catalog.error })] }), detail && _jsx(KnowledgeEntryDialog, { ...detail, onClose: () => setDetail(null) }), statisticsId && _jsx(ConsistencyStatisticsDialog, { statistics: statistics.data, loading: statistics.isPending, error: statistics.error?.message, onClose: () => setStatisticsId('') })] });
}
