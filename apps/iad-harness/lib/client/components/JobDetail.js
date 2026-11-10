import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { formatJobTime, jobPhases, jobStatuses, jobWorkflow } from '../../shared/job-display.js';
export function JobDetail({ job, stale = false }) {
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        if (job.status !== 'RUNNING')
            return;
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [job.run_id, job.status]);
    const workflow = jobWorkflow(job, now), index = workflow.index;
    const failed = ['FAILED', 'PARTIAL', 'INTERRUPTED'].includes(job.status), pending = job.status === 'PENDING';
    const phase = jobPhases[job.phase || ''] || job.phase || '未记录具体执行阶段';
    const seconds = job.started_at ? Math.max(0, Math.floor(((job.finished_at ? Date.parse(job.finished_at) : now) - Date.parse(job.started_at)) / 1000)) : null;
    const elapsed = seconds === null ? '—' : `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    const meta = [['作业 ID', job.run_id], ['提交时间', job.submitted_at ? formatJobTime(job.submitted_at) : '未记录'],
        ...(job.model_name ? [['模型', job.model_name]] : []), ['开始时间', job.started_at ? formatJobTime(job.started_at) : '未开始'], ['耗时', elapsed],
        ['样本进度', `${job.completed} / ${job.total_samples}${job.failed ? `，失败 ${job.failed}` : ''}`],
        ...(job.queue_position != null ? [['排队位置', String(job.queue_position)]] : []),
        ...(job.total_gallery_groups != null ? [['图组进度', `${job.completed_gallery_groups ?? 0} / ${job.total_gallery_groups}`]] : [])];
    return _jsxs("div", { className: "iad-job-drawer-body", children: [_jsxs("div", { className: "iad-job-statusline", children: [_jsx("span", { className: "iad-job-pill", "data-status": job.status, children: job.cancel_requested && ['PENDING', 'RUNNING'].includes(job.status) ? '正在停止' : jobStatuses[job.status] }), _jsx("strong", { children: pending ? '等待资源调度' : phase })] }), _jsx("dl", { className: "iad-job-meta", children: meta.map(([label, value]) => _jsxs(React.Fragment, { children: [_jsx("dt", { children: label }), _jsx("dd", { children: value })] }, label)) }), _jsxs("section", { className: "iad-job-status-section", "aria-label": "\u6267\u884C\u9636\u6BB5", children: [_jsx("h3", { children: "\u6267\u884C\u9636\u6BB5" }), index < 0 && _jsx("p", { className: "iad-job-note", children: "\u5F53\u524D\u8BB0\u5F55\u6CA1\u6709\u72EC\u7ACB\u7684\u9636\u6BB5\u503C\u3002" }), _jsx("div", { className: "iad-job-stage-list", children: workflow.stages.map((stage, position) => {
                            const current = !pending && position === index;
                            const state = current ? (failed ? 'error' : job.status === 'RUNNING' ? 'current' : job.status === 'COMPLETED' ? 'done' : 'waiting') : 'waiting';
                            return _jsxs("div", { className: "iad-job-stage", "data-state": state, "aria-current": current ? 'step' : undefined, children: [_jsx("span", { className: "iad-job-dot", children: state === 'done' ? '✓' : position + 1 }), _jsx("div", { children: _jsx("strong", { children: stage.title }) }), _jsx("span", { className: "iad-job-stage-time", "aria-label": `${stage.title}耗时`, children: stage.elapsedSeconds === null ? '' : stage.elapsedSeconds < 60
                                            ? `${stage.elapsedSeconds.toFixed(1)}s`
                                            : `${String(Math.floor(stage.elapsedSeconds / 60)).padStart(2, '0')}:${String(Math.floor(stage.elapsedSeconds % 60)).padStart(2, '0')}` })] }, stage.title);
                        }) })] }), (failed || job.errors.length > 0) && _jsxs("section", { className: "iad-job-status-section", "aria-label": "\u5931\u8D25\u4FE1\u606F", children: [_jsx("h3", { children: "\u5931\u8D25\u4FE1\u606F" }), job.execution_error && _jsxs("div", { className: "iad-job-error", children: [_jsx("strong", { children: job.execution_error.type }), _jsx("p", { children: job.execution_error.message })] }), job.errors.length ? job.errors.map((error, index) => _jsxs("div", { className: "iad-job-error", children: [_jsx("strong", { children: error.code ? `错误码：${error.code}` : '失败原因' }), _jsx("p", { children: error.message }), _jsx("p", { children: error.relative_path || error.sample_uuid || error.sample_id }), error.source_run_id && _jsxs("p", { children: [jobPhases[error.source_phase || ''] || error.source_phase || '未记录阶段', _jsx("code", { children: error.source_run_id })] })] }, `${error.sample_id}:${index}`)) : !job.execution_error && _jsx("div", { className: "iad-job-error", children: _jsx("p", { children: "\u672A\u8BB0\u5F55\u9519\u8BEF\u8BE6\u60C5" }) })] }), stale && _jsx("p", { className: "iad-job-note", role: "status", children: "\u5F53\u524D\u663E\u793A\u6700\u8FD1\u4E00\u6B21\u8BFB\u53D6\u7684\u4F5C\u4E1A\u72B6\u6001\u3002" })] });
}
