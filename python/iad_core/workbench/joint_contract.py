from typing import Annotated, Literal, Mapping

from pydantic import BeforeValidator, Field, ValidationError, create_model, model_validator
from pydantic_core import InitErrorDetails

from iad_core.advisory.analysis import CheckAssessment, JointAnalysis, RegionObservation, VisualEvidence
from iad_core.advisory.output_validation import repairable_output_error
from iad_core.workbench.findings import FindingLedger


class JointContract:
    """Bind the response to the frozen criteria and the actual visual inputs."""

    def __init__(self, check_ids: frozenset[str], evidence: Mapping[str, VisualEvidence], region_count: int, ledger: FindingLedger):
        evidence_ids = set(evidence)
        raw_ids = {eid for eid, image in evidence.items() if image.representation == 'raw'}
        def validate_image_references(value):
            if isinstance(value, list):
                unknown = {item for item in value if isinstance(item, str)}-evidence_ids
                if unknown:
                    raise repairable_output_error('joint_visual_reference', f'MLLM cited unknown visual evidence: {sorted(unknown)}')
            return value
        image_references = Annotated[list[Literal[tuple(sorted(evidence_ids))]], BeforeValidator(validate_image_references)]
        assessment = create_model('CheckAssessment', __base__=CheckAssessment,
            check_id=(Literal[tuple(sorted(check_ids))], ...), evidence_ids=(image_references, Field(min_length=1))) if check_ids else CheckAssessment

        def validate_observations(value):
            if unknown := {cid for region in value.region_requests for cid in region.check_ids}-check_ids:
                raise repairable_output_error('joint_check_reference', f'MLLM region request cited an unknown check: {sorted(unknown)}')
            actual = [item.check_id for item in value.check_assessments]
            indices = [item.region_index for item in value.region_observations]
            errors = [
                ('check_assessments', 'joint_check_coverage',
                 'MLLM check assessments must cover every frozen check exactly once',
                 set(actual) != check_ids),
                ('check_assessments', 'joint_raw_evidence',
                 'MLLM check assessment requires raw visual evidence, not only a localization mask',
                 any(not set(item.evidence_ids) & raw_ids for item in value.check_assessments)),
                ('findings', 'joint_anomaly_coverage',
                 'MLLM findings must explain every anomalous check',
                 not {item.check_id for item in value.check_assessments if item.status == 'anomaly'} <= {
                     check_id for finding in value.findings for check_id in finding.check_ids}),
                ('region_observations', 'joint_roi_coverage',
                 'MLLM ROI observations must cover each supplied region exactly once',
                 set(indices) != set(range(1, region_count + 1))),
            ]
            problems = [InitErrorDetails(type=repairable_output_error(code, message),
                loc=(field,), input=getattr(value, field)) for field, code, message, failed in errors if failed]
            try:
                ledger.validate(value, evidence, check_ids)
            except ValueError as error:
                problems.append(InitErrorDetails(type=repairable_output_error('joint_finding_evidence', str(error)),
                    loc=('findings',), input=value.findings))
            if problems:
                raise ValidationError.from_exception_data('JointAnalysis', problems)
            return value

        self.response_type = create_model('JointAnalysis', __base__=JointAnalysis,
            __validators__={'valid_observations': model_validator(mode='after')(validate_observations)},
            evidence_ids=(image_references, Field(min_length=1)),
            check_assessments=(list[assessment], Field(min_length=len(check_ids), max_length=len(check_ids))),
            region_observations=(list[RegionObservation], Field(min_length=region_count, max_length=region_count)))
