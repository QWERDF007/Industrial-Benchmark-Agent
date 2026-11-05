from typing import Any, Sequence

from pydantic import model_validator

from iad_core.advisory.analysis import AuditConclusion
from iad_core.advisory.output_validation import repairable_output_error
from iad_core.evidence.images import PreparedImage
from iad_core.workbench.model_references import ModelReferences


class AuditConclusionContract:
    """Bind wire citations to exactly the raw evidence allowed for this audit batch."""

    def __init__(self, response_type: type[AuditConclusion], facts: dict[str, Any], images: Sequence[PreparedImage],
                 raw_ids: Sequence[str], result_ids: Sequence[str], check_ids: Sequence[str]):
        references = facts['consistency']['record']['references']
        self.vocabulary = ModelReferences(dict(
            s=facts['image_owners'].values(), v=[*facts['image_owners'], *raw_ids], k=check_ids,
            r=[ref['result_id'] for ref in references], e=[ref['evidence_id'] for ref in references],
            d=[item['difference_id'] for result in facts['consistency']['results'] for item in result['annotation']['differences']],
            a=[annotation.annotation_id for image in images for annotation in image.annotations]), images)
        allowed = {'evidence_ids':set(raw_ids), 'knowledge_check_ids':set(check_ids), 'consistency_result_ids':set(result_ids)}

        def wire_schema(cls, **options):
            return self.vocabulary.encode(response_type.model_json_schema(**options))

        def decode(value):
            if isinstance(value, list):
                return [decode(item) for item in value]
            if not isinstance(value, dict):
                return value
            result = {}
            for key, item in value.items():
                if key in allowed and isinstance(item, list):
                    values = []
                    for alias in item:
                        if not isinstance(alias, str) or self.vocabulary.references.get(alias) not in allowed[key]:
                            raise repairable_output_error('frozen_audit_reference',
                                f'{key}包含未允许的引用{alias!r}；只能引用当前Schema给出的短编号，不使用其他字段或其他批次的引用')
                        values.append(self.vocabulary.references[alias])
                    result[key] = values
                else:
                    result[key] = decode(item)
            return result

        @model_validator(mode='before')
        def canonical_output(value):
            return decode(value)

        self.response_type = type(response_type.__name__, (response_type,), {
            'model_json_schema':classmethod(wire_schema), 'canonical_output':canonical_output})
