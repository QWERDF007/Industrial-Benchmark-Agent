import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuditReportSections } from '../audit-report.js';
import { AuditReportSection } from './AuditReportSection.js';
import { knowledgeStatuses } from '../../shared/knowledge-presentation.js';
import { AuditEvidenceSection } from './AuditEvidenceSection.js';
export function AuditReportKnowledge({ report, imageUrl }) {
    const auditReportSections = useAuditReportSections();
    const entries = report.knowledge_entries || [];
    return _jsxs(AuditReportSection, { section: "knowledge", children: [report.knowledge_analysis && _jsx("p", { children: report.knowledge_analysis }), !entries.length && _jsx("p", { children: Object.values(report.knowledge_titles).join('、') || '本次未选用知识条目。' }), entries.map(({ entry, analysis }, index) => {
                const check = entry.check, counts = report.statistics?.knowledge_assessments?.[check.check_id] || {};
                const totals = [['consistent', '一致'], ['deviates', '偏离'], ['unobservable', '不可观察'], ['not_applicable', '不适用']]
                    .map(([key, label]) => `${label} ${counts[key] || 0} 张`).join('；');
                return _jsx("article", { className: "iad-audit-discovery", "data-audit-knowledge": check.check_id, children: _jsx(AuditEvidenceSection, { content: { number: auditReportSections.knowledge.prefix + (index + 1), title: check.title, description: analysis?.description || check.criterion,
                            facts: [{ label: '知识状态', text: knowledgeStatuses[check.status] }, { label: '图像核对结果统计', text: totals }],
                            galleries: [{ title: '知识参考图像', images: report.evidence_groups['knowledge-source:' + check.check_id] || [] },
                                { title: '本次审计图像', images: report.evidence_groups['knowledge:' + check.check_id] || [] }], analysis: [
                                ...(analysis ? [{ title: '知识适用情况', text: analysis.applicability }, { title: '图像特征对比', text: analysis.analysis },
                                    { title: '对审计结论的影响', text: analysis.audit_impact }] : [])
                            ] }, imageUrl: imageUrl }) }, check.check_id);
            })] });
}
