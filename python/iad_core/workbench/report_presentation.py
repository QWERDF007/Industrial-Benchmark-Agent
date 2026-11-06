import math
from typing import TYPE_CHECKING

from iad_core.advisory.analysis import AnalysisModel

if TYPE_CHECKING:
    from iad_core.workbench.benchmark_report import BenchmarkFacts


REPORT_CHART_STYLES = '''
.iad-report-charts{display:grid;gap:24px;min-width:0}
.iad-report-chart{margin:0;min-width:0;padding:18px 16px 12px;background:#fff;border-radius:6px;break-inside:avoid}
.iad-report-chart figcaption{font-size:16px;font-weight:600;margin-bottom:26px}
.iad-report-chart-body{display:grid;grid-template-columns:36px minmax(0,1fr);gap:13px;min-width:0}
.iad-report-chart-axis{height:188px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;font-size:12px;color:#65758c;font-variant-numeric:tabular-nums}
.iad-report-chart-axis span{height:0;line-height:1;transform:translateY(-6px)}
.iad-report-chart-figure{position:relative;min-width:0}
.iad-report-chart-grid{position:absolute;inset:0 0 auto;height:188px;pointer-events:none;background:repeating-linear-gradient(to top,#e2e8f0 0 1px,transparent 1px 25%)}
.iad-report-chart-columns{position:relative;display:grid;grid-template-columns:repeat(var(--chart-columns),minmax(0,1fr));gap:12px;min-width:0}
.iad-report-chart-column{min-width:0;text-align:center}
.iad-report-chart-slot{height:188px;display:flex;align-items:flex-end;justify-content:center}
.iad-report-chart-bar{position:relative;width:min(62%,56px);background:#5379d2;border-radius:4px 4px 0 0}
.iad-report-chart-bar[data-muted="true"]{background:#b3c1d6}
.iad-report-chart-value{position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:#172338}
.iad-report-chart-label{display:block;padding-top:11px;font-size:13px;line-height:1.5;overflow-wrap:anywhere}
@media(max-width:600px){.iad-report-chart{padding:14px 8px}.iad-report-chart-body{grid-template-columns:28px minmax(0,1fr);gap:7px}.iad-report-chart-columns{gap:4px}}
'''


class ReportChartColumn(AnalysisModel):
    label: str
    value: int
    muted: bool = False


class ReportChart(AnalysisModel):
    title: str
    axis_max: int
    columns: list[ReportChartColumn]


class ReportSourceRule(AnalysisModel):
    check_id: str
    title: str
    criterion: str


class ReportSourceSummary(AnalysisModel):
    run_id: str
    knowledge_job_id: str
    knowledge_version_id: str
    consistency_job_ids: list[str]
    rules: list[ReportSourceRule]


class ReportPresentation(AnalysisModel):
    charts: list[ReportChart]
    sources: list[ReportSourceSummary]

    @classmethod
    def capture(cls, facts: 'BenchmarkFacts') -> 'ReportPresentation':
        datasets = facts.dataset_coverage
        distributions = [
            ('数据集覆盖', [ReportChartColumn(label='有有效审计记录',value=facts.audited_samples),
                ReportChartColumn(label='尚无有效审计记录',value=facts.registered_samples-facts.audited_samples,muted=True)]),
            ('审计结果分布', [ReportChartColumn(label=label,value=facts.outcomes.get(key,0)) for key,label in [
                ('normal_candidate','审计正常'),('anomaly_candidate','发现疑点'),('insufficient','证据不足')]]),
            ('原始标注分布', [ReportChartColumn(label=label,value=facts.raw_labels.get(key,0)) for key,label in [
                ('PASS','原始良品'),('FAIL','原始异常'),('UNCERTAIN','原始待定')]]),
            ('子数据集审计覆盖', [ReportChartColumn(label=item.name,value=item.audited) for item in datasets])]
        versions = {version.version_id:version for version in facts.knowledge_versions}
        return cls(charts=[ReportChart(title=title,columns=columns,
            axis_max=max(4,4*math.ceil(max((column.value for column in columns),default=0)/4))) for title,columns in distributions],
            sources=[ReportSourceSummary(run_id=run_id,knowledge_job_id=source.knowledge_job_id,
                knowledge_version_id=source.knowledge_version_id,consistency_job_ids=source.consistency_job_ids,
                rules=[ReportSourceRule(check_id=check.check_id,title=check.title,criterion=check.criterion)
                    for check in versions[source.knowledge_version_id].checks if check.check_id in source.knowledge_entry_ids])
                for run_id,source in facts.source_selections.items()])
