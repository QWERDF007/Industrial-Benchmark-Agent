from typing import Literal

from pydantic import Field
from pydantic.json_schema import SkipJsonSchema

from iad_core.advisory.analysis import AnalysisModel, NonBlankText


ArgumentRole = Literal['support', 'counter', 'context', 'allowed_variation']
ArgumentState = Literal['active', 'resolved', 'out_of_scope']


class AnalysisArgumentEdit(AnalysisModel):
    entry_id: NonBlankText
    evidence_id: NonBlankText = Field(description='本场已观察的完整原图ID，不接受裁图或别名。')
    role: ArgumentRole = Field(description='support支持主张，counter是在主张适用且目标可观察时成立的反例，context提供上下文，allowed_variation说明已观察的相容变化；不适用或不确定不构成反例。')
    reason: NonBlankText = Field(description='该图的实际观察如何支持、反驳或限定这条主张；解释或移出范围时说明原因。')
    state: ArgumentState = 'active'
    observation_id: NonBlankText | None = Field(default=None,
        description='关联已保存观察；本次新观察可省略，由宿主按明确引用的原图绑定实际观察。')
    locator_id: SkipJsonSchema[NonBlankText | None] = None


class AnalysisArgumentRecord(AnalysisModel):
    job_id: str
    entry_id: str
    claim_revision: int
    revision: int
    observation_id: str
    evidence_id: str
    locator_id: str | None
    role: ArgumentRole
    state: ArgumentState
    reason: str | None
    origin_entry_id: str


class AnalysisEntryQuery(AnalysisModel):
    entry_id: NonBlankText
    revision: int | None = Field(default=None, ge=0, strict=True)
    offset: int = Field(default=0, ge=0, strict=True)
    limit: int = Field(default=20, ge=1, le=100, strict=True)


class AnalysisArgumentQuery(AnalysisEntryQuery):
    role: ArgumentRole | None = None
    state: ArgumentState | None = None
    history: bool = False


class AnalysisArgumentPage(AnalysisModel):
    job_id: str
    revision: int
    total: int
    offset: int
    next_offset: int | None
    items: list[AnalysisArgumentRecord]


class AnalysisKeyEvidence(AnalysisModel):
    evidence_id: NonBlankText
    role: ArgumentRole
    reason: NonBlankText = Field(description='它独有地说明主张的哪项事实；与已有精选重复则不选。')
    locator_id: SkipJsonSchema[NonBlankText | None] = Field(default=None, exclude=True)


class AnalysisClaimChange(AnalysisModel):
    change_reason: NonBlankText | None = Field(default=None, description='改变已有主张或适用条件的原因；只改标题或精选图不需要。')


class AnalysisEntrySelection(AnalysisClaimChange):
    key_evidence: list[AnalysisKeyEvidence] | None = Field(default=None, max_length=4,
        description='当前条目有序精选原图，合计最多4张。role须与该图的一项有效论据完全相同，可为support、counter、context或allowed_variation。省略保留既有选择；不影响完整论据和强度。')
