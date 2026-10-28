import json
import time
from pathlib import Path

from iad_core.consistency.errors import ConsistencyError
from iad_core.feature.base import FeatureExtractor
from iad_core.feature.cache import ContentFeatureCache, FeaturePreparation
from iad_core.feature.encoder import ImageEncoderRuntime
from iad_core.feature.profiles import ImageEncoderConfig, ImageEncoders
from iad_core.storage.database import Database
from iad_core.storage.features import FeatureRepository
from iad_core.storage.repositories import SampleRepository


class FeatureBuildResult(FeaturePreparation):
    task_id: str
    model_id: str
    coverage: float
    dim: int
    dtype: str
    elapsed_seconds: float
    throughput: float
    report_json_path: str
    report_md_path: str


def get_feature_stats(task_id: str, profile_id: str | None = None,
                      db_path: str = 'data/benchmark.db') -> dict:
    db=Database(db_path)
    profile=ImageEncoders(db).profile(profile_id)
    repository=FeatureRepository(db)
    samples=[s for s in SampleRepository(db).list_by_task(task_id) if not s.is_excluded]
    sources=repository.sources([s.sample_id for s in samples])
    groups={source['content_group_id'] for source in sources if source['content_group_id']}
    records=repository.records(list(groups),profile.profile_id)
    complete={record['content_group_id'] for record in records if record['status']=='COMPLETE'}
    cached=sum(source['content_group_id'] in complete for source in sources)
    return dict(task_id=task_id,profile_id=profile.profile_id,model_id=profile.model_id,
        total_samples=len(sources),total_content=len(groups),cached_features=cached,cached_content_count=len(complete),
        coverage=cached/len(sources) if sources else 0,dim=profile.dim,dtype=profile.storage_dtype,
        storage_bytes=sum(len(record['embedding_blob']) for record in records if record['status']=='COMPLETE'))


def build_features(task_id: str, db_path: str = 'data/benchmark.db', *,
                   config: ImageEncoderConfig | None = None, batch_size: int | None = None,
                   device: str | None = None, output_dir: str | None = None,
                   force_recompute: bool = False, extractor: FeatureExtractor | None = None,
                   encoder_runtime: ImageEncoderRuntime | None = None) -> FeatureBuildResult:
    started=time.monotonic()
    db=Database(db_path)
    config=config or ImageEncoders(db).read().selection
    if config is None:
        raise ConsistencyError('PROFILE_NOT_CONFIGURED','Configure an image encoder before preparing features')
    overrides={key:value for key,value in {'batch_size':batch_size,'device':device}.items() if value is not None}
    config=ImageEncoderConfig.model_validate({**config.model_dump(),**overrides})
    samples=[sample for sample in SampleRepository(db).list_by_task(task_id) if not sample.is_excluded]
    prepared=ContentFeatureCache(db,encoder_runtime).prepare([sample.sample_id for sample in samples],config,
        extractor=extractor,force=force_recompute)
    elapsed=time.monotonic()-started
    run_dir=Path(output_dir) if output_dir else Path('runs/feature_audit')/task_id
    run_dir.mkdir(parents=True,exist_ok=True)
    result=FeatureBuildResult(**prepared.model_dump(exclude_computed_fields=True),task_id=task_id,model_id=config.profile.model_id,
        coverage=prepared.completed_samples/prepared.total_samples if prepared.total_samples else 0,
        dim=config.profile.dim,dtype=config.profile.storage_dtype,elapsed_seconds=elapsed,
        throughput=prepared.encoded_content_count/elapsed if elapsed else 0,
        report_json_path=str(run_dir/'feature_report.json'),report_md_path=str(run_dir/'feature_report.md'))
    Path(result.report_json_path).write_text(result.model_dump_json(indent=2)+'\n',encoding='utf-8')
    Path(result.report_md_path).write_text(
        f'# 图像特征：{task_id}\n\n配置：`{prepared.profile_id}`\n\n'
        f'样本 {prepared.total_samples}，内容组 {prepared.total_content}。'
        f'新增编码 {prepared.encoded_content_count}，缓存命中 {prepared.cache_hit_count}，失败 {prepared.failed_count}，'
        f'未索引 {prepared.unindexed_count}。样本覆盖率 {result.coverage:.2%}。\n',encoding='utf-8')
    with (run_dir/'feature_runs.jsonl').open('a',encoding='utf-8') as stream:
        stream.write(result.model_dump_json()+'\n')
    return result
