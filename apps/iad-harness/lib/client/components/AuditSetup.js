import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { v4 as uuid } from 'uuid';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { message, request } from '../api.js';
import { useModuleSettings } from '../useModuleSettings.js';
import { promptDefaults } from '../../shared/prompt-defaults.generated.js';
import { useResource } from '../useResource.js';
import { Button } from './Button.js';
import { AgentPromptEditors, PromptTextEditor } from './AgentPromptEditors.js';
import { Select } from './Select.js';
import { KnowledgeEntryDialog } from './KnowledgeEntryDialog.js';
import { ConsistencyStatisticsDrawer } from './ConsistencyStatisticsDrawer.js';
import { ConsistencyView } from '../consistency-view.js';
import { queryClient } from '../query-client.js';
import { JobList } from './JobList.js';
import { useJobList } from '../useJobList.js';
import { KnowledgeEntryList } from './KnowledgeEntryList.js';
import { JobStatusDrawer } from './JobStatusDrawer.js';
import { AnalysisPromptDrawer } from './AnalysisPromptDrawer.js';
import { ConsistencyPromptDrawer } from './ConsistencyPromptDrawer.js';
export function AuditSetup({ datasets, availableDatasets, jobs, revision, onStarted, onCancel, onBusyChange }) {
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
    const [statusJob, setStatusJob] = useState(null), [promptJob, setPromptJob] = useState(null);
    const [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [systemPrompt, setSystemPrompt] = useState(promptDefaults.system.audit);
    const [userPrompt, setUserPrompt] = useState(promptDefaults.audit);
    const [masterSystem, setMasterSystem] = useState(promptDefaults.auditMasterSystem);
    const [masterUser, setMasterUser] = useState(promptDefaults.auditBatch);
    const [reportPrompt, setReportPrompt] = useState(promptDefaults.auditReport);
    const submission = useRef();
    const knowledgeJobs = catalog.data?.knowledge_jobs || [], consistencyJobs = catalog.data?.consistency_jobs || [];
    const sourceJobs = catalog.data?.jobs || [];
    const knowledgeList = useJobList(sourceJobs.filter(job => knowledgeJobs.some(source => source.job_id === job.run_id)), scope);
    const consistencyList = useJobList(sourceJobs.filter(job => consistencyJobs.some(source => source.job_id === job.run_id)), scope);
    const chosen = knowledgeJobs.find(item => item.version_id === versionId);
    const selectedEntries = chosen?.entries.filter(item => entryIds.has(item.check_id)) || [];
    const selectedConsistency = consistencyJobs.find(item => item.job_id === consistencyId);
    const reason = catalog.error || (catalog.loading ? '正在读取来源作业' : !datasets.length ? '请选择审计子数据集' :
        !selectedConsistency ? '请选择一个已完成的一致性作业' : !model.settings?.model ? model.error || '请先配置模型审计分析模型' :
            jobs.some(job => ['PENDING', 'RUNNING'].includes(job.status)) ? '当前范围仍有审计作业执行中' :
                !masterSystem.trim() || !masterUser.trim() ? '请填写主 Agent 提示词' : !systemPrompt.trim() || !userPrompt.trim() ? '请填写子 Agent 提示词' : !reportPrompt.trim() ? '请填写报告用户提示词' : '');
    function selectKnowledge(job) {
        setVersionId(job?.version_id || '');
        setEntryIds(new Set());
        setDetail(null);
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
    return _jsxs("div", { className: "audit-create-page", id: "audit-create-view", "aria-busy": busy, children: [_jsx(JobList, { id: "audit-create-knowledge-jobs", title: "\u77E5\u8BC6\u6316\u6398", list: knowledgeList, datasets: availableDatasets, loading: catalog.loading, actions: { status: setStatusJob, prompt: setPromptJob }, selection: { name: 'audit-knowledge-source', label: '选择知识作业', selectedIds: new Set(chosen ? [chosen.job_id] : []), disabled: busy, onChange: ids => {
                        const added = [...ids].find(id => id !== chosen?.job_id);
                        const job = sourceJobs.find(job => job.run_id === added);
                        selectKnowledge(added ? (knowledgeJobs.find(source => source.job_id === added && source.version_id === job?.knowledge_version_id)
                            || knowledgeJobs.find(source => source.job_id === added)) : null);
                    } } }), chosen && _jsx("section", { id: "audit-create-entries", className: "audit-panel audit-source-panel", children: _jsx(KnowledgeEntryList, { source: { kind: 'published', versionId: chosen.version_id }, revision: revision, actions: { view: entry => setDetail({ source: { kind: 'published', versionId: chosen.version_id }, checkId: entry.check_id }) }, selection: { name: 'audit-knowledge-entry', label: '选择知识条目', selectedIds: entryIds, onChange: setEntryIds, disabled: busy }, headerActions: _jsxs("label", { className: "audit-pick-all", children: [_jsx("input", { id: "audit-entries-all", type: "checkbox", disabled: busy, checked: !!selectedEntries.length && selectedEntries.length === chosen.entries.length, ref: node => { if (node)
                                    node.indeterminate = selectedEntries.length > 0 && selectedEntries.length < chosen.entries.length; }, onChange: event => setEntryIds(event.target.checked ? new Set(chosen.entries.map(entry => entry.check_id)) : new Set()) }), "\u5168\u9009"] }), children: knowledgeJobs.filter(source => source.job_id === chosen.job_id).length > 1 && _jsxs("label", { className: "iad-knowledge-version", children: ["\u7ED3\u679C\u7248\u672C", _jsx(Select, { "aria-label": "\u77E5\u8BC6\u7ED3\u679C\u7248\u672C", value: chosen.version_id, disabled: busy, onChange: event => selectKnowledge(knowledgeJobs.find(source => source.version_id === event.target.value)), children: knowledgeJobs.filter(source => source.job_id === chosen.job_id).map(source => _jsxs("option", { value: source.version_id, children: ["\u77E5\u8BC6\u7248\u672C ", source.version_id.slice(-8)] }, source.version_id)) })] }) }, chosen.version_id) }), _jsx(JobList, { id: "audit-create-consistency-jobs", title: "\u6570\u636E\u4E00\u81F4\u6027", list: consistencyList, datasets: availableDatasets, loading: catalog.loading, actions: { status: setStatusJob, prompt: setPromptJob, additional: [{ id: 'statistics', label: '统计', icon: 'stats', onClick: job => setStatisticsId(job.run_id) }] }, selection: { name: 'audit-consistency-source', label: '选择一致性作业', selectedIds: new Set(selectedConsistency ? [selectedConsistency.job_id] : []), disabled: busy,
                    onChange: ids => setConsistencyId([...ids].find(id => id !== consistencyId) || '') } }), !!catalog.data?.benchmark_builds.length && _jsxs("section", { className: "audit-panel audit-source-panel", children: [_jsx("header", { className: "audit-panel-head", children: _jsx("h2", { children: "\u5DF2\u6709 Benchmark \u6210\u679C" }) }), _jsxs(Select, { "aria-label": "\u5DF2\u6709 Benchmark \u6210\u679C", value: benchmarkId, disabled: busy, onChange: event => setBenchmarkId(event.target.value), children: [_jsx("option", { value: "", children: "\u4E0D\u5173\u8054" }), catalog.data.benchmark_builds.map(build => _jsxs("option", { value: build.build_id, children: [build.name, "\uFF0C\u8986\u76D6 ", build.covered_images, " \u5F20\uFF0C\u6765\u6E90\u5171 ", build.source_images, " \u5F20"] }, build.build_id))] })] }), _jsxs("section", { className: "audit-panel audit-source-panel", children: [_jsx("header", { className: "audit-panel-head", children: _jsx("h2", { children: "\u63D0\u793A\u8BCD" }) }), _jsx(AgentPromptEditors, { id: "audit-master-prompt", agentLabel: "\u4E3B Agent", system: masterSystem, user: masterUser, onSystemChange: setMasterSystem, onUserChange: setMasterUser, disabled: busy }), _jsx(AgentPromptEditors, { id: "audit-observer-prompt", agentLabel: "\u5B50 Agent", system: systemPrompt, user: userPrompt, onSystemChange: setSystemPrompt, onUserChange: setUserPrompt, disabled: busy }), _jsx("div", { className: "iad-agent-prompts", children: _jsx(PromptTextEditor, { id: "audit-report-prompt", label: "\u62A5\u544A\u7528\u6237\u63D0\u793A\u8BCD", value: reportPrompt, onChange: setReportPrompt, disabled: busy }) })] }), _jsxs("section", { className: "audit-panel audit-source-panel", children: [_jsx("header", { className: "audit-panel-head", children: _jsx("h2", { children: "\u786E\u8BA4\u5E76\u542F\u52A8" }) }), _jsxs("div", { className: "audit-create-confirm", children: [_jsxs("dl", { className: "audit-create-facts", id: "audit-create-summary", "aria-live": "polite", children: [_jsxs("div", { children: [_jsx("dt", { children: "\u5BA1\u8BA1\u8303\u56F4" }), _jsx("dd", { children: datasets.map(dataset => dataset.name).join('、') || '未选择' })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u77E5\u8BC6\u6316\u6398" }), _jsx("dd", { children: chosen?.job_id || '未选择' })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u77E5\u8BC6\u6761\u76EE" }), _jsxs("dd", { children: [selectedEntries.length, " \u6761"] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u6570\u636E\u4E00\u81F4\u6027" }), _jsxs("dd", { children: [selectedConsistency ? 1 : 0, " \u4E2A\u5DF2\u5B8C\u6210\u4F5C\u4E1A"] })] })] }), _jsxs("div", { className: "audit-create-actions", children: [_jsx(Button, { id: "audit-create-cancel", disabled: busy, onClick: onCancel, children: "\u53D6\u6D88" }), _jsx(Button, { id: "audit-create-submit", variant: "primary", disabled: busy || !!reason, title: reason, onClick: () => void start(), children: busy ? '启动中…' : '开始审计' })] })] }), error && _jsx("p", { className: "audit-source-error", role: "alert", children: error }), catalog.error && _jsx("p", { className: "audit-source-error", role: "alert", children: catalog.error })] }), statusJob && _jsx(JobStatusDrawer, { job: statusJob, onClose: () => setStatusJob(null) }), promptJob && (promptJob.analysis_kind === 'knowledge' ? _jsx(AnalysisPromptDrawer, { title: "\u77E5\u8BC6\u6316\u6398\u63D0\u793A\u8BCD", jobId: promptJob.run_id, onClose: () => setPromptJob(null) })
                : _jsx(ConsistencyPromptDrawer, { job: promptJob, onClose: () => setPromptJob(null) })), detail && _jsx(KnowledgeEntryDialog, { ...detail, onClose: () => setDetail(null) }), statisticsId && _jsx(ConsistencyStatisticsDrawer, { statistics: statistics.data, loading: statistics.isPending, error: statistics.error?.message, onClose: () => setStatisticsId('') })] });
}
