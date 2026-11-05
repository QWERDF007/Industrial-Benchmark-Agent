from typing import Any, Sequence

from pydantic import ConfigDict, Field, create_model

from iad_core.advisory.analysis import AuditBasis, AuditConclusion, AuditSliceCandidate
from iad_core.advisory.conclusions import NonBlankConclusion
from iad_core.evidence.images import PreparedImage
from iad_core.workbench.model_references import ModelReferences


class AuditConclusionContract:
    """Bind wire citations to exactly the raw evidence allowed for this audit batch."""

    def __init__(self, facts: dict[str, Any], images: Sequence[PreparedImage],
                 raw_ids: Sequence[str], result_ids: Sequence[str], check_ids: Sequence[str]):
        references = facts['consistency']['record']['references']
        self.vocabulary = ModelReferences(dict(
            s=facts['image_owners'].values(), v=[*facts['image_owners'], *raw_ids], k=check_ids,
            r=[ref['result_id'] for ref in references], e=[ref['evidence_id'] for ref in references],
            d=[item['difference_id'] for result in facts['consistency']['results'] for item in result['annotation']['differences']],
            a=[annotation.annotation_id for image in images for annotation in image.annotations]), images)

        image_ref = self.vocabulary.reference_type('evidence_ids', raw_ids)
        basis = create_model('AuditBasis', __base__=AuditBasis, text=(NonBlankConclusion, ...),
            evidence_ids=(list[image_ref], Field(min_length=1)),
            knowledge_check_ids=(list[self.vocabulary.reference_type('knowledge_check_ids', check_ids)] if check_ids else list[str],
                Field(..., **({} if check_ids else {'max_length':0}))),
            consistency_result_ids=(list[self.vocabulary.reference_type('consistency_result_ids', result_ids)] if result_ids else list[str],
                Field(..., **({} if result_ids else {'max_length':0}))))
        slice_candidate = create_model('AuditSliceCandidate', __base__=AuditSliceCandidate,
            name=(NonBlankConclusion, ...), observation=(NonBlankConclusion, ...),
            evidence_ids=(list[image_ref], Field(min_length=1)))

        def observation_before_judgment(schema: dict[str, Any]) -> None:
            order = ('observation', 'applicable_rule', 'normal_alternative', 'basis', 'conflicts', 'missing_evidence',
                'analysis_text', 'description', 'position_analysis', 'illumination_analysis', 'evidence_ids',
                'proposed_slice', 'label_relation', 'suggested_label', 'reason_category', 'confidence', 'defect_location')
            properties = schema['properties']
            schema['properties'] = {name:properties[name] for name in dict.fromkeys((*order, *properties)) if name in properties}
            schema['required'] = [name for name in schema['properties'] if name in schema['required']]

        self.response_type = create_model('AuditConclusion', __base__=AuditConclusion,
            __config__=ConfigDict(json_schema_extra=observation_before_judgment),
            analysis_text=(NonBlankConclusion, ...), description=(NonBlankConclusion, ...),
            observation=(NonBlankConclusion, ...), applicable_rule=(NonBlankConclusion, ...), normal_alternative=(NonBlankConclusion, ...),
            proposed_slice=(list[slice_candidate], ...),
            evidence_ids=(list[image_ref], Field(min_length=1)), basis=(list[basis], Field(min_length=1)))
