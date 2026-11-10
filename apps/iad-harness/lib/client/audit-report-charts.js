import { auditIssueLabels, auditConsistencyLabels, auditAssessmentLabels } from '../shared/audit.generated.js';
const colors = ['#3278c7', '#e89a38', '#9aa8b9', '#359a79'];
export function auditReportCharts(report) {
    const charts = [];
    const bars = (key, title, labels, series, stack = false) => {
        if (!labels.length)
            return;
        charts.push({ key, title, summary: labels.map((label, index) => label + '：' + series.map(s => s.name + ' ' + s.data[index]).join('，')).join('；'),
            option: { animation: false, color: colors, aria: { enabled: true }, tooltip: { trigger: 'axis', confine: true, className: 'iad-audit-chart-tooltip' }, legend: { top: 0, type: 'scroll' },
                grid: { top: 50, bottom: 70, left: 48, right: 24, containLabel: true },
                xAxis: { type: 'category', data: labels, axisLabel: { interval: 0, width: 110, overflow: 'break' } }, yAxis: { type: 'value', minInterval: 1 },
                series: series.map(item => ({ ...item, type: 'bar', ...(stack ? { stack: key } : {}), barMaxWidth: 44,
                    label: { show: true, position: stack ? 'inside' : 'top', formatter: '{c}' } })) } });
    };
    const ring = (key, title, values) => {
        const total = values.reduce((sum, item) => sum + item.value, 0);
        charts.push({ key, title, summary: values.map(item => `${item.name} ${item.value} 张，占${total ? (100 * item.value / total).toFixed(2) : '0'}%`).join('；') + `；分母 ${total} 张`,
            option: { animation: false, color: colors, aria: { enabled: true }, tooltip: { trigger: 'item', confine: true, className: 'iad-audit-chart-tooltip', formatter: '{b}：{c} 张（{d}%）' },
                legend: { bottom: 0, type: 'scroll' }, series: [{ type: 'pie', radius: ['42%', '65%'], center: ['50%', '44%'],
                        data: values, label: { show: true, formatter: '{b}\n{c} 张（{d}%）' }, avoidLabelOverlap: true }] } });
    };
    ring('coverage', `审计覆盖（共 ${report.total_samples} 张）`, [{ name: '已完成', value: report.audited_samples }, { name: '未完成', value: report.total_samples - report.audited_samples }]);
    const stats = report.statistics;
    ring('outcomes', `图级结论（共 ${report.total_samples} 张）`, [{ name: '审计正常', value: stats?.normal_images ?? report.distribution.normal ?? 0 },
        { name: '发现疑点', value: report.suspect_samples }, { name: '未完成', value: report.total_samples - report.audited_samples }]);
    if (!stats)
        return charts;
    const kinds = Object.keys(stats.issue_types).sort((a, b) => stats.issue_types[b].occurrences - stats.issue_types[a].occurrences);
    bars('issues', '问题统计与分布', kinds.map(key => auditIssueLabels[key] || '其他疑点'), [
        { name: '涉及图数（张）', data: kinds.map(key => stats.issue_types[key].image_count) },
        { name: '独立疑点次数（次）', data: kinds.map(key => stats.issue_types[key].occurrences) }
    ]);
    const outcomes = [['normal', '审计正常'], ['suspect', '发现疑点'], ['incomplete', '未完成']];
    const datasets = Object.keys(stats.datasets);
    bars('datasets', '子数据集分布', datasets.map((key, index) => report.dataset_names[key] || `子数据集 ${index + 1}`), outcomes.map(([key, name]) => ({ name, data: datasets.map(id => stats.datasets[id][key] || 0) })), true);
    const sources = Object.keys(stats.consistency_cross);
    bars('consistency', '一致性与审计交叉分布', sources.map(key => auditConsistencyLabels[key] || '其他上游结果'), outcomes.map(([key, name]) => ({ name, data: sources.map(id => stats.consistency_cross[id][key] || 0) })), true);
    const assessments = Object.keys(stats.consistency_assessments);
    bars('assessments', '上游差异处理', assessments.map(key => auditAssessmentLabels[key] || '其他处理'), [
        { name: '差异项数（项）', data: assessments.map(key => stats.consistency_assessments[key]) }
    ]);
    const checks = Object.keys(stats.knowledge_assessments);
    bars('knowledge', '知识的实际作用', checks.map((key, index) => report.knowledge_titles[key] || `知识 ${index + 1}`), [['consistent', '相符'], ['deviates', '偏离'], ['unobservable', '不可观察'], ['not_applicable', '不适用']].map(([key, name]) => ({ name, data: checks.map(id => stats.knowledge_assessments[id][key] || 0) })), true);
    if (stats.observation_occurrences)
        bars('observations', '待判别观察（不计入疑点）', ['待判别观察'], [
            { name: '涉及图数（张）', data: [stats.observation_images] }, { name: '观察次数（次）', data: [stats.observation_occurrences] }
        ]);
    return charts;
}
