import json
from dataclasses import dataclass
from typing import Literal

from pydantic import create_model

from iad_core.advisory.analysis import AnalysisModel
from iad_core.advisory.conclusions import NonBlankConclusion
from iad_core.evidence.images import PreparedImage
from iad_core.workbench.dataset_report_models import DatasetReportConclusion, ReportSection
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.report_requirements import REPORT_REQUIREMENTS
from iad_core.workbench.vision import ModelCapacityError, VlmClient


@dataclass(frozen=True)
class ReportNode:
    node_id: str
    evidence_ids: tuple[str, ...]
    conclusion: DatasetReportConclusion


class ReportSynthesis:
    """Capacity-bounded visual observation and model-authored report reduction."""

    def __init__(self, client: VlmClient):
        self.client = client

    def conclude(self, context: JobContext, facts: dict, images: dict[str, PreparedImage]) -> DatasetReportConclusion:
        request = context.payload['request']
        steps = []
        pending = [(list(images), [])]
        samples = tuple(case['sample_id'] for case in facts['cases'])
        while pending:
            nodes = []
            child_count = sum(len(children) for _, children in pending)
            while pending:
                visual_ids, children = pending.pop(0)
                context.checkpoint()
                allowed = tuple(dict.fromkeys(eid for child in children for eid in child.evidence_ids)) if children else tuple(visual_ids)
                visual_ids = list(allowed[:2]) if children else visual_ids
                section = create_model('ReportSection', __base__=ReportSection,
                    analysis=(NonBlankConclusion, ...), conclusion=(NonBlankConclusion, ...),
                    evidence_ids=(list[Literal[allowed]], ...), sample_ids=(list[Literal[samples]], ...))
                sections = create_model('ReportSections', __base__=AnalysisModel,
                    **{key: (section, ...) for key in REPORT_REQUIREMENTS})
                response = create_model('DatasetReportConclusion', __base__=AnalysisModel, sections=(sections, ...),
                    **{key: (NonBlankConclusion, ...) for key in
                        ['dataset_analysis', 'dataset_conclusion', 'model_analysis', 'model_conclusion']})
                runtime_facts = dict(facts, phase='report_summary' if children else 'report_observation',
                    visual_evidence_ids=visual_ids, child_reports=[dict(node_id=child.node_id,
                        observed_evidence_ids=child.evidence_ids, conclusion=child.conclusion.model_dump(mode='json'))
                        for child in children])
                prompt = request['instruction'] + '\n冻结报告事实：' + json.dumps(runtime_facts, ensure_ascii=False)
                try:
                    plan = self.client.plan(response, prompt, [images[eid] for eid in visual_ids], request['model_name'], 16384)
                except ModelCapacityError:
                    work = children or visual_ids
                    if len(work) < 2 or (children and len(work) == 2):
                        raise
                    middle = len(work) // 2
                    pending[:0] = [([], work[:middle]), ([], work[middle:])] if children else [
                        (work[:middle], []), (work[middle:], [])]
                    continue
                context.checkpoint()
                result = DatasetReportConclusion.model_validate(self.client.generate(plan).model_dump())
                node = ReportNode(f'report_step_{len(steps)+1}', allowed, result)
                steps.append(dict(node_id=node.node_id, input_evidence_ids=visual_ids,
                    observed_evidence_ids=allowed, child_step_ids=[child.node_id for child in children],
                    conclusion=result.model_dump(mode='json')))
                context.update(report_steps=steps)
                nodes.append(node)
            if len(nodes) == 1:
                return nodes[0].conclusion
            if child_count and len(nodes) >= child_count:
                raise ModelCapacityError('当前模型容量无法汇总两个报告分析片段')
            pending = [([], nodes)]
        raise ValueError('报告缺少实际图像证据')
