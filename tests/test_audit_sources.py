"""Audit source selection through public catalog/start and saved audit outputs."""
import pytest
import time
from uuid import uuid4

from iad_core.consistency.models import ConsistencyStart
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


@pytest.fixture
def selected_sources(dataset, mllm_api):
    db, _, config = dataset
    client, bodies, responses = mllm_api
    runtime = WorkbenchRuntime(db, VlmClient(client))
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.knowledge.instructions import FrozenMiningPrompt, MiningPromptConfiguration
    from tests.knowledge_scenarios import selected_group
    responses['KnowledgeDraft']['checks'].append({**responses['KnowledgeDraft']['checks'][0],
        'title':'边缘连续性','criterion':'可见边缘连续'})
    mining = KnowledgeService(db, VlmClient(client), jobs=runtime.jobs)
    mined = mining.start(request=selected_group(db, config.dataset.id, kind='normal'),
        mining_prompt=FrozenMiningPrompt.capture(MiningPromptConfiguration(objective='两条外观判据',directions=[])))
    runtime.jobs.wait(mined['run_id'], 5)
    ids = [config.dataset.id + ':' + name + '.png' for name in ('normal', 'normal2', 'dent', 'scratch')]
    program = runtime.consistency.start(ConsistencyStart(subjects={'kind':'datasets','dataset_ids':[config.dataset.id]},
        corpus_scope={'kind':'datasets','dataset_ids':[config.dataset.id]}, mode='exact', request_id=str(uuid4())))
    assert program.kind == 'started'
    deadline = time.monotonic()+10
    while runtime.consistency.status(program.batch_id).status in ('PENDING','RUNNING'):
        assert time.monotonic()<deadline
        time.sleep(.02)
    def execute(context):
        context.update(program_batch_id=program.batch_id)
        context.record(ids)
    job = runtime.jobs.start('ANALYSIS_WORKFLOW', config.task.task_id, dict(dataset_id=config.dataset.id,
        dataset_ids=[config.dataset.id], analysis_kind='consistency', sample_ids=ids,
        units=[dict(dataset_id=config.dataset.id,request={},job_type='CONSISTENCY_MODEL_BATCH')]), execute, '一致性检查')
    runtime.jobs.wait(job['run_id'], 5)
    from iad_core.workbench.audit_sources import AuditSources
    catalog = AuditSources(db).catalog([config.dataset.id])
    knowledge = catalog.knowledge_jobs[0]
    request = dict(dataset_id=config.dataset.id, knowledge_job_id=knowledge.job_id,
        knowledge_version_id=knowledge.version_id, knowledge_entry_ids=[knowledge.entries[0].check_id],
        consistency_job_ids=[job['run_id']], sample_ids=[config.dataset.id+':dent.png'])
    try:
        yield runtime, request, catalog, bodies
    finally:
        runtime.close()


def test_audit_catalog_and_start_use_selected_published_sources(selected_sources):
    runtime, request, catalog, bodies = selected_sources
    assert len(catalog.consistency_jobs) == 1
    assert len(catalog.knowledge_jobs[0].entries) == 2
    assert catalog.knowledge_jobs[0].entries[0].support_count == 2
    assert catalog.consistency_jobs[0].job_id == request['consistency_job_ids'][0]
    job = runtime.audit.start(**request)
    runtime.audit.wait(job['run_id'], 10)
    state = runtime.jobs.status(job['run_id'])
    assert state['status'] == 'COMPLETED', state['errors']
    frozen = state['request']['sources']
    assert frozen['knowledge_job_id'] == request['knowledge_job_id']
    assert frozen['knowledge_entry_ids'] == request['knowledge_entry_ids']
    assert frozen['consistency_job_ids'] == request['consistency_job_ids']
    assert frozen['consistency_references'], '选择的已完成检查必须提供冻结结果'
    from iad_core.workbench.audit_results import AuditResults
    detail = AuditResults(runtime.db).sample(job['run_id'],request['sample_ids'][0])
    assert {ref.evidence_id for ref in detail.consistency.references} <= {ref['evidence_id'] for ref in frozen['consistency_references']}
    assert {item.check_id for item in detail.suggestion.analysis.check_assessments} == set(request['knowledge_entry_ids'])
    assert {item.check_id for item in detail.knowledge.checks} == set(request['knowledge_entry_ids'])


def test_selected_source_identity_survives_a_new_head(selected_sources):
    runtime, request, catalog, _ = selected_sources
    from iad_core.knowledge.repository import KnowledgeRepository
    from iad_core.workbench.audit_results import AuditResults
    repository = KnowledgeRepository(runtime.db)
    selected = repository.get(request['knowledge_version_id'])
    other = next(item for item in catalog.knowledge_jobs if item.version_id != selected.version_id)
    with runtime.db.connection() as conn:
        conn.execute('UPDATE knowledge_heads SET version_id=? WHERE dataset_id=?',(other.version_id,request['dataset_id']))
    job = runtime.audit.start(**request)
    runtime.audit.wait(job['run_id'],10)
    detail = AuditResults(runtime.db).sample(job['run_id'],request['sample_ids'][0])
    assert detail.suggestion.analysis.knowledge_version_id == selected.version_id
    assert {item.check_id for item in detail.suggestion.analysis.check_assessments} == set(request['knowledge_entry_ids'])
    assert repository.current(request['dataset_id']).version_id == other.version_id


def test_source_catalog_excludes_deleted_and_incomplete_jobs(selected_sources):
    runtime, request, _, _ = selected_sources
    from iad_core.workbench.audit_sources import AuditSources
    runtime.jobs.delete(request['consistency_job_ids'][0],('ANALYSIS_WORKFLOW',),family=True)
    assert not AuditSources(runtime.db).catalog([request['dataset_id']]).consistency_jobs
    with pytest.raises(ValueError,match='一致性'):
        runtime.audit.start(**request)


def test_multi_subset_audit_keeps_each_image_owner_and_reports_missing_check_coverage(selected_sources, tmp_path):
    from PIL import Image
    from iad_core.dataset.registry import DatasetImport, DatasetRegistry
    from iad_core.workbench.audit_results import AuditResults
    from iad_core.workbench.audit_result_models import AuditSampleQuery
    runtime, request, _, _ = selected_sources
    registry = DatasetRegistry(runtime.db)
    group = registry.create_group('同一生产线')
    config = registry.get(request['dataset_id'])
    registry.save(config, group_id=group['group_id'])
    images, labels = tmp_path/'other-images',tmp_path/'other-labels'
    images.mkdir();labels.mkdir()
    Image.new('RGB',(320,240),'#6699aa').save(images/'other.png')
    other = registry.import_labelme(DatasetImport(format='labelme',name='另一个子集',group_id=group['group_id'],
        image_dir=str(images),annotation_dir=str(labels)))
    registry.save(other, group_id=group['group_id'])
    other_id = other.dataset.id+':other.png'
    ids = [request['dataset_id'],other.dataset.id]
    with runtime.jobs.lock:
        job = runtime.audit.start(**(request | dict(subset_ids=ids,sample_ids=[*request['sample_ids'],other_id],
            corpus_scope={'kind':'datasets','dataset_ids':ids})))
        with pytest.raises(ValueError,match='作业'):
            registry.delete(other.dataset.id)
    runtime.audit.wait(job['run_id'],10)
    final = runtime.audit.status(job['run_id'])
    assert final['status'] == 'COMPLETED', final['errors']
    assert set(final['dataset_ids']) == set(ids)
    result = AuditResults(runtime.db).samples(AuditSampleQuery(run_id=job['run_id']))
    assert {item.sample_id:item.dataset_id for item in result.items} == {
        request['sample_ids'][0]:request['dataset_id'],other_id:other.dataset.id}
    detail = AuditResults(runtime.db).sample(job['run_id'],other_id)
    assert detail.consistency.status == 'PARTIAL'
    assert detail.consistency.reason == '所选一致性作业未覆盖当前图像'


def test_audit_start_rejects_unknown_subset_without_starting(selected_sources):
    runtime, request, _, _ = selected_sources
    with pytest.raises(ValueError,match='同一数据集'):
        runtime.audit.start(**(request | dict(subset_ids=[request['dataset_id'],'unknown-subset'])))


@pytest.mark.parametrize('change', [dict(knowledge_entry_ids=['unknown']),dict(consistency_job_ids=[]),dict(knowledge_job_id='unknown')])
def test_audit_start_rejects_invalid_source_selection(selected_sources, change):
    runtime, request, _, _ = selected_sources
    with pytest.raises((ValueError, LookupError)):
        runtime.audit.start(**(request | change))
