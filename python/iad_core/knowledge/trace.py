from typing import TYPE_CHECKING, Iterable, List, Optional

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.evidence.images import EvidenceImages
from iad_core.knowledge.models import KnowledgeEvidence
from iad_core.workbench.job_models import JobObservationProgress, JobStatus

if TYPE_CHECKING:
    from iad_core.knowledge.mining import KnowledgeInput
    from iad_core.workbench.jobs import JobContext


class KnowledgeTraceItem(KnowledgeEvidence):
    observed: bool


class KnowledgeTracePage(AnalysisModel):
    run_id: str
    status: JobStatus
    knowledge_version_id: Optional[str]
    progress: JobObservationProgress
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=50)
    total: int = Field(ge=0)
    items: List[KnowledgeTraceItem]


def observed_evidence(payload: dict) -> set[str]:
    return {eid for key, field in (('mining_steps', 'image_evidence_ids'), ('observation_steps', 'input_evidence_ids'),
                                  ('verification_steps', 'input_evidence_ids'))
            for step in payload.get(key, []) for eid in step[field]}


def observation_progress(payload: dict) -> JobObservationProgress:
    planned = payload.get('planned_evidence', [])
    seen = observed_evidence(payload)
    selected = set(payload.get('sample_ids', payload.get('request', {}).get('sample_ids', [])))
    by_source = {sid: {item['image']['evidence_id'] for item in planned if item['sample_id'] == sid} for sid in selected}
    return JobObservationProgress(planned_sources=len(selected), observed_sources=sum(bool(ids & seen) for ids in by_source.values()),
        complete_sources=sum(bool(ids) and ids <= seen for ids in by_source.values()), planned_visuals=len(planned),
        observed_visuals=len(seen & {item['image']['evidence_id'] for item in planned}),
        published_sources=payload.get('completed', 0) if payload.get('knowledge_version_id') else 0)


class KnowledgeTrace:
    def __init__(self, context: 'JobContext'):
        self.context = context

    def register(self, records: Iterable[KnowledgeEvidence]):
        planned = {item['image']['evidence_id']: item for item in self.context.payload.get('planned_evidence', [])}
        for record in records:
            value = record.model_dump(mode='json')
            if record.image.evidence_id in planned and planned[record.image.evidence_id] != value:
                raise ValueError('同一观察证据引用的来源或内容发生变化')
            planned[record.image.evidence_id] = value
        self.context.update(planned_evidence=list(planned.values()))

    def inputs(self, inputs: Iterable['KnowledgeInput']):
        self.register(KnowledgeEvidence(sample_id=item.source.sample_id, image=image.evidence)
                      for item in inputs for image in item.images)

    @staticmethod
    def page(job: dict, page: int = 1, page_size: int = 10) -> KnowledgeTracePage:
        if page < 1 or not 1 <= page_size <= 50:
            raise ValueError('观察证据分页须为正页数，每页1..50条')
        records = job.get('planned_evidence', [])
        observed = observed_evidence(job)
        start = (page - 1) * page_size
        return KnowledgeTracePage(run_id=job['run_id'], status=job['status'], knowledge_version_id=job.get('knowledge_version_id'),
            progress=observation_progress(job), total=len(records), page=page, page_size=page_size,
            items=[KnowledgeTraceItem(**record, observed=record['image']['evidence_id'] in observed) for record in records[start:start + page_size]])

    @staticmethod
    def evidence(job: dict, evidence_id: str, db_path: str) -> dict:
        record = next((KnowledgeEvidence.model_validate(item) for item in job.get('planned_evidence', [])
                       if item['image']['evidence_id'] == evidence_id), None)
        if record is None:
            raise LookupError('该作业没有所选冻结图像证据')
        return {'path': EvidenceImages(db_path).path(record.image), 'media_type': record.image.media_type}
