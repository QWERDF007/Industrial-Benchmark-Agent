import re
from dataclasses import replace
from typing import Literal

from pydantic import Field, create_model

from iad_core.evidence.images import PreparedImage
from iad_core.advisory.conclusions import ConclusionText, NonBlankConclusion
from iad_core.knowledge.models import KnowledgeLearning, LearnedCheck, ObservedDiscovery, ObservedPart, KnowledgeSuspect


class MiningContract:
    """Use batch-local visual keys on the wire and original evidence in published knowledge."""

    def __init__(self, images: list[PreparedImage], response_type: type[KnowledgeLearning], area_type: type):
        images_by_id = {image.evidence.evidence_id: image for image in images}
        self.references = {f'@v{index}': eid for index, eid in enumerate(images_by_id)}
        self.aliases = {eid: alias for alias, eid in self.references.items()}
        self.images = [replace(image, evidence=image.evidence.model_copy(update={'evidence_id': self.aliases[eid]}))
                       for eid, image in images_by_id.items()]
        self.original_type = response_type
        raw = tuple(self.aliases[eid] for eid, image in images_by_id.items() if image.evidence.representation == 'raw')
        check = create_model('LearnedCheck', __base__=LearnedCheck,
            support_evidence_ids=(list[Literal[raw]], Field(description='本轮实际提供的raw图像证据')),
            counter_evidence_ids=(list[Literal[raw]], ...),
            title=(NonBlankConclusion,...), subject=(NonBlankConclusion,...), location=(ConclusionText,...),
            criterion=(NonBlankConclusion,...), allowed_variations=(list[ConclusionText],...), limitations=(list[ConclusionText],...))
        suspect = create_model('KnowledgeSuspect', __base__=KnowledgeSuspect, evidence_id=(Literal[raw], ...), description=(ConclusionText,...), normal_explanation=(ConclusionText,...))
        part = create_model('ObservedPart', __base__=ObservedPart, evidence_ids=(list[Literal[raw]], Field(min_length=1)))
        area = create_model('ObservedArea', __base__=area_type, evidence_ids=(list[Literal[raw]], ...), direction=(NonBlankConclusion,...),
            reason=(NonBlankConclusion,Field(description='本方向的观察结论、状态依据和限制；不写图像编号、文件名或路径，具体图像只放evidence_ids')))
        discovery = create_model('ObservedDiscovery', __base__=ObservedDiscovery, parts=(list[part], ...),
            areas=(list[area], ...))

        self.response_type = create_model('KnowledgeDraft', __base__=response_type,
            summary=(ConclusionText,...), limitations=(list[ConclusionText],...), checks=(list[check], ...),
            suspects=(list[suspect], ...), discovery=(discovery | None, None))

    def project(self, value):
        if isinstance(value, dict):
            return {key: self.project(item) for key, item in value.items()}
        if isinstance(value, list):
            return [self.project(item) for item in value]
        return self.aliases.get(value, value) if isinstance(value, str) else value

    def bind(self, response: KnowledgeLearning) -> KnowledgeLearning:
        def restore(value):
            if isinstance(value, dict):
                return {key: restore(item) for key, item in value.items()}
            if isinstance(value, list):
                return [restore(item) for item in value]
            if isinstance(value, str):
                return re.sub(r'@v\d+(?![A-Za-z0-9_])', lambda match: self.references.get(match[0], match[0]), value)
            return value
        return self.original_type.model_validate(restore(response.model_dump()))
