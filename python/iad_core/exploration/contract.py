from dataclasses import replace
import re
from typing import Literal

from pydantic import Field, create_model

from iad_core.evidence.images import PreparedImage
from iad_core.advisory.conclusions import ConclusionText, NonBlankConclusion
from iad_core.exploration.models import DirectionDraft, ProposedDirection


class ExplorationContract:
    """Bind this batch's visual references and the frozen previous directions."""

    def __init__(self, images: list[PreparedImage], metadata: list[dict], parent: dict | None):
        self.references = {f'@v{index}':image.evidence.evidence_id for index,image in enumerate(images)}
        self.images = [replace(image, evidence=image.evidence.model_copy(update={'evidence_id':alias}))
            for alias,image in zip(self.references,images)]
        self.metadata = [{**item,'evidence_id':alias} for alias,item in zip(self.references,metadata)]
        self.parent = {key:parent[key] for key in ('version_id','summary','limitations')} if parent else None
        previous = []
        if parent:
            self.parent['directions'] = [dict(previous_direction_id=item['direction_id'],
                **{key:item[key] for key in ('title','instruction','applies_to','limitations')}) for item in parent['directions']]
            previous = [item['direction_id'] for item in parent['directions']]
        inherited = Literal[tuple(previous)] | None if previous else type(None)
        direction = create_model('ProposedDirection', __base__=ProposedDirection,
            title=(NonBlankConclusion, ...), instruction=(NonBlankConclusion, ...),
            evidence_ids=(list[Literal[tuple(self.references)]], Field(min_length=1)),
            previous_direction_id=(inherited, None))
        self.response_type = create_model('DirectionDraft', __base__=DirectionDraft,
            summary=(ConclusionText, Field(description='总体总结，只概括跨图共性、差异和观察重点，不包含具体图像编号或文件名。')),
            limitations=(list[ConclusionText], Field(description='本轮整体证据边界，不包含具体图像编号或文件名。'
                '逐图支持、反例和限制放在directions[].rationale、directions[].limitations及evidence_ids中。')),
            directions=(list[direction], ...))

    def bind(self, draft: DirectionDraft) -> DirectionDraft:
        values = draft.model_dump()
        values['summary'] = self._text(values['summary'])
        values['limitations'] = [self._text(text) for text in values['limitations']]
        for direction in values['directions']:
            direction['evidence_ids'] = [self.references[ref] for ref in direction['evidence_ids']]
            for field in ('title','instruction','rationale'):
                direction[field] = self._text(direction[field])
            direction['limitations'] = [self._text(text) for text in direction['limitations']]
        return DirectionDraft.model_validate(values)

    def _text(self, text: str) -> str:
        return re.sub(r'@v\d+(?![A-Za-z0-9_])', lambda match:self.references.get(match[0],match[0]),text)
