from typing import Any, Sequence

from pydantic import create_model

from iad_core.advisory.analysis import AnalysisModel
from iad_core.advisory.conclusions import NonBlankConclusion
from iad_core.evidence.images import PreparedImage
from iad_core.workbench.dataset_report_models import ReportSection
from iad_core.workbench.model_references import ModelReferences
from iad_core.workbench.report_requirements import REPORT_REQUIREMENTS


class ReportContract:
    """Bind report citations to audited samples and this batch's observed evidence."""

    def __init__(self, facts: dict[str, Any], images: Sequence[PreparedImage], evidence_ids: Sequence[str]):
        statistics, cases = facts['statistics'], facts['cases']
        checks = [check for version in statistics['knowledge_versions'] for check in version['checks']]
        records = statistics['consistency_records']
        references = [reference for record in records for reference in record['references']]
        conclusions = [case['conclusion'] for case in cases]
        bases = [basis for conclusion in conclusions for basis in conclusion['basis']]
        slices = [item for conclusion in conclusions for item in conclusion['proposed_slice']]
        samples = tuple(dict.fromkeys(case['sample_id'] for case in cases))
        self.vocabulary = ModelReferences(dict(
            s=[*samples, *facts['image_owners'].values(), *[record['sample_id'] for record in records],
                *[reference['sample_id'] for reference in references],
                *[record['sample_id'] for policy in statistics['gold_by_policy'] for record in policy['records']],
                *[sample_id for ids in statistics['capability_candidates'].values() for sample_id in ids]],
            v=[*facts['image_owners'], *evidence_ids,
                *[eid for conclusion in conclusions for eid in conclusion['evidence_ids']],
                *[eid for item in [*bases, *slices] for eid in item['evidence_ids']],
                *[eid for check in checks for eid in [*check['support_evidence_ids'], *check['counter_evidence_ids']]]],
            k=[check['check_id'] for check in checks],
            r=[reference['result_id'] for reference in references],
            e=[reference['evidence_id'] for reference in references],
            w=[version['version_id'] for version in statistics['knowledge_versions']],
            d=statistics['scope_dataset_ids'],
            j=[*statistics['included_run_ids'], *[record['run_id'] for record in records]],
            a=[annotation.annotation_id for image in images for annotation in image.annotations]), images)
        section = create_model('ReportSection', __base__=ReportSection,
            analysis=(NonBlankConclusion, ...), conclusion=(NonBlankConclusion, ...),
            evidence_ids=(list[self.vocabulary.reference_type('evidence_ids', evidence_ids)], ...),
            sample_ids=(list[self.vocabulary.reference_type('sample_ids', samples)], ...))
        sections = create_model('ReportSections', __base__=AnalysisModel,
            **{key: (section, ...) for key in REPORT_REQUIREMENTS})
        self.response_type = create_model('DatasetReportConclusion', __base__=AnalysisModel, sections=(sections, ...),
            **{key: (NonBlankConclusion, ...) for key in
                ['dataset_analysis', 'dataset_conclusion', 'model_analysis', 'model_conclusion']})
