import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { auditIssueLabels } from '../../shared/audit.generated.js';
import { jobIsActive } from '../../shared/job-display.js';
import { useResource } from '../useResource.js';
import { AuditOutcomeChart } from './AuditReportChart.js';
import { StatisticsDrawer } from './StatisticsDrawer.js';
import { Chart } from './charts/Chart.js';
import { chartNumber } from './charts/options.js';
export function AuditStatisticsDrawer({ job, revision, onClose }) {
    const { data, loading, error } = useResource(`/audit/jobs/${encodeURIComponent(job.run_id)}/statistics`, `${revision}:${job.status}`, jobIsActive(job));
    return _jsx(StatisticsDrawer, { title: "\u6A21\u578B\u5BA1\u8BA1\u7EDF\u8BA1", loading: loading, error: error, onClose: onClose, children: data && _jsxs(_Fragment, { children: [_jsx(AuditOutcomeChart, { title: "\u5BA1\u8BA1\u7ED3\u679C", normal: data.normal_images, suspect: data.suspect_images, incomplete: data.incomplete_images, description: `已处理 ${chartNumber(data.completed_images)} / ${chartNumber(data.total_images)} 张` }), _jsx(Chart, { id: "audit-issue-types", title: "\u95EE\u9898\u7C7B\u578B\u5206\u5E03", spec: { type: 'bar',
                        series: [{ label: '涉及图像', unit: '张' }, { label: '问题次数', unit: '次' }],
                        rows: Object.entries(data.issue_types).map(([kind, count]) => ({ id: kind,
                            label: auditIssueLabels[kind] || kind, values: [count.image_count, count.occurrences] })) } })] }) });
}
