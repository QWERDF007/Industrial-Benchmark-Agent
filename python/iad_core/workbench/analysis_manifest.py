import json
from collections import Counter
from collections.abc import Sequence
from datetime import datetime, timezone
from typing import Annotated, Literal

from pydantic import Field, validate_call

from iad_core.advisory.analysis import AnalysisModel
from iad_core.storage.database import Database
from iad_core.storage.models import Annotation, Sample
from iad_core.storage.repositories import AnnotationRepository, SampleRepository
from iad_core.workbench.analysis_sampling import DEFAULT_SAMPLING_RATIO, MixedSampling, SamplingCounts, SamplingGroup, SamplingRatio


AnalysisModule = Literal['exploration', 'knowledge']
CandidateRole = Literal['normal', 'defect']
AnalysisBatchSize = Annotated[int, Field(strict=True, ge=1)]


class AnalysisRegistration(AnalysisModel):
    sample: Sample
    source_fingerprint: str | None
    annotations: list[Annotation]
    dataset_format: Literal['labelme', 'folder_classification']
    sampling_group: SamplingGroup | None = None


class AnalysisTarget(AnalysisModel):
    dataset_id: str
    sample_id: str
    candidate_role: CandidateRole | None = None


class AnalysisRound(AnalysisModel):
    round_id: int = Field(ge=1)
    targets: list[AnalysisTarget] = Field(min_length=1)
    sampling_counts: SamplingCounts | None = None


class AnalysisPlan(AnalysisModel):
    module: AnalysisModule
    batch_size: AnalysisBatchSize
    sampling_ratio: SamplingRatio | None = None
    rounds: list[AnalysisRound] = Field(min_length=1)


class AnalysisManifest(AnalysisModel):
    dataset_ids: list[str]
    frozen_at: datetime
    records: list[AnalysisRegistration] = Field(min_length=1)

    @validate_call
    def plan(self, module: AnalysisModule, *, batch_size: AnalysisBatchSize,
             sampling_ratio: SamplingRatio = DEFAULT_SAMPLING_RATIO,
             normal_images: Sequence[str] = (), defect_images: Sequence[str] = ()) -> AnalysisPlan:
        if module == 'knowledge' and batch_size > 200:
            raise ValueError('知识挖掘每批图像数需要在 1–200 之间')
        registered = {record.sample.sample_id: record.sample for record in self.records}
        normal, defect = list(dict.fromkeys(normal_images)), list(dict.fromkeys(defect_images))
        selected = normal + defect
        if module == 'exploration':
            if not selected:
                raise ValueError('至少选择一张真实候选图像')
            if set(normal).intersection(defect):
                raise ValueError('同一登记不能同时扮演两个角色')
            if set(selected) - registered.keys():
                raise ValueError('手选图像不属于所选范围')
        elif selected:
            raise ValueError('知识挖掘按登记清单自动分批，无需手选样例')
        roles = {**dict.fromkeys(normal, 'normal'), **dict.fromkeys(defect, 'defect')}
        groups = {record.sample.sample_id:record.sampling_group or 'unclassified' for record in self.records}
        remaining = {sid:group for sid, group in groups.items() if sid not in roles}
        batches = ([selected] if selected else []) + MixedSampling(remaining, batch_size, sampling_ratio).batches()
        return AnalysisPlan(module=module, batch_size=batch_size, sampling_ratio=sampling_ratio, rounds=[AnalysisRound(round_id=index + 1,
            sampling_counts=SamplingCounts(**Counter(groups[sid] for sid in batch)),
            targets=[AnalysisTarget(dataset_id=registered[sid].dataset_id, sample_id=sid,
                candidate_role=roles.get(sid)) for sid in batch]) for index, batch in enumerate(batches)])


class AnalysisManifests:
    """Freeze all registrations once; both modules plan over that same ordered scope."""

    def __init__(self, db: Database):
        self.db = db

    def freeze(self, dataset_ids: list[str]) -> AnalysisManifest:
        if not dataset_ids or len(set(dataset_ids)) != len(dataset_ids):
            raise ValueError('请选择不重复的子数据集')
        with self.db.connection() as connection:
            connection.execute('BEGIN')
            configs = {row[0]: json.loads(row[1]) for row in connection.execute('''SELECT dataset_id,config_json FROM datasets
                WHERE dataset_id IN (SELECT value FROM json_each(?))''', (json.dumps(dataset_ids),))}
            if set(configs) != set(dataset_ids):
                raise LookupError('所选子数据集不存在')
            rows = connection.execute('''SELECT s.sample_id,s.source_fingerprint FROM json_each(?) selection
                JOIN samples s ON s.dataset_id=selection.value
                ORDER BY CAST(selection.key AS INTEGER),s.relative_path,s.sample_id''', (json.dumps(dataset_ids),)).fetchall()
            if not rows:
                raise ValueError('所选范围没有登记样本')
            samples = {sample.sample_id: sample for sample in SampleRepository(self.db).get_many(
                [row['sample_id'] for row in rows], connection=connection)}
            annotations = AnnotationRepository(self.db)
            return AnalysisManifest(dataset_ids=dataset_ids, frozen_at=datetime.now(timezone.utc),
                records=[AnalysisRegistration(sample=samples[row['sample_id']], source_fingerprint=row['source_fingerprint'],
                    sampling_group={'PASS':'normal', 'FAIL':'abnormal'}.get(samples[row['sample_id']].quality_status, 'unclassified'),
                    dataset_format=configs[samples[row['sample_id']].dataset_id]['dataset']['format'],
                    annotations=annotations.list_by_sample(row['sample_id'], connection=connection)) for row in rows])
