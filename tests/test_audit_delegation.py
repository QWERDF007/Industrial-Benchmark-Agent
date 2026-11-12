from uuid import uuid4

from iad_core.workbench.module_settings import ModuleSettings
import json
import pytest

from tests.audit_support import save_image, master_observed, publish_batch, batch_submission, report_submission
from iad_core.audit.evidence import AuditEvidence
from iad_core.audit.reports import AuditReports
from iad_core.workbench.calls import ModelCalls, NativeModelCallStart, NativeModelCallEnd


def test_audit_freezes_roles_and_partitions_the_complete_scope(native_audit):
    from iad_core.audit.batches import AuditBatches
    jobs, dataset_id, upstream, role = native_audit
    settings = ModuleSettings(jobs.db)
    settings.save(dict(module='audit', expected_revision=1, settings=dict(batch_size=2, concurrency=3)))
    master = dict(system_prompt='联合比较原图与标注关系。', user_prompt='维护支持、反例与下一批线索。')
    observer = dict(system_prompt='独立审计当前图。', user_prompt='先观察，再验证线索。')
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=[dataset_id], consistency_job_id=upstream,
        master_prompt=master, observer_prompt=observer), agent=role)['run_id']
    snapshot = jobs.snapshot(run_id)
    assert snapshot.schema_version == 4
    assert snapshot.master_prompt.model_dump() == master
    assert snapshot.observer_prompt.model_dump() == observer
    batches = AuditBatches(jobs)
    first = batches.begin(run_id)
    samples = jobs.samples(run_id)
    assert first.number == 1 and first.clues_revision == 0 and first.clues == []
    assert first.sample_ids == [sample.sample_id for sample in samples[:2]]
    assert [batch.sample_ids for batch in batches.list(run_id)] == [
        [sample.sample_id for sample in samples[index:index+2]] for index in range(0,6,2)]
    assert jobs.context(run_id, samples[0].sample_id).batch.number == 1
    settings.save(dict(module='audit', expected_revision=2, settings=dict(batch_size=5, concurrency=1)))
    assert jobs.snapshot(run_id).settings.batch_size == 2
    assert jobs.snapshot(run_id).settings.concurrency == 3
    assert batches.begin(run_id) == first



def test_published_clues_are_fixed_for_the_next_batch_and_do_not_create_issues(native_audit):
    from iad_core.audit.batches import AuditBatches
    jobs,dataset_id,upstream,role = native_audit
    ModuleSettings(jobs.db).save(dict(module='audit',expected_revision=1,settings=dict(batch_size=2)))
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    batches=AuditBatches(jobs)
    first=batches.begin(run_id)
    samples=jobs.samples(run_id)
    page=AuditEvidence(jobs).read(run_id,samples[0].sample_id,dict(sample_id=samples[0].sample_id))
    save_image(jobs,run_id,samples[0],observations=[dict(description='边缘亮线。',annotation_ids=[],evidence_ids=[page.evidence_id])])
    save_image(jobs,run_id,samples[1])
    discovery=dict(group_id='line',kind='visual_pattern',dimension='visual_coverage',status='pending',title='边缘亮线',
        description='已观察到亮线，标注关系尚待比较。',visual_signature='沿边缘的细亮线',annotation_relation='原标注未覆盖该现象',
        scope='冻结已审范围',support_refs=[dict(sample_id=samples[0].sample_id,result_revision=1,kind='observation',index=0)],
        counter_refs=[],next_batch_focus='核对是否存在相同现象及相反标注关系。',representatives=[
            dict(sample_id=samples[0].sample_id,role='representative',reason='沿画面边缘可见亮线。')])
    submission=batch_submission(jobs,run_id,[discovery],commit_key='batch-one')
    with pytest.raises(ValueError,match='实际读取'):
        batches.publish(run_id,submission)
    master_observed(jobs,run_id,batches.context(run_id),[page.evidence_id])
    published=batches.publish(run_id,submission)
    assert published.revision == 1
    assert batches.publish(run_id,submission) == published
    second=batches.begin(run_id)
    assert second.number == 2 and second.clues_revision == 1
    context=jobs.context(run_id,samples[2].sample_id)
    assert context.batch.clues[0].title == '边缘亮线'
    assert context.batch.clues[0].next_batch_focus == discovery['next_batch_focus']
    assert AuditReports(jobs.db).statistics(run_id).issue_occurrences == 0


def test_frozen_profile_uses_original_geometry_and_leaves_unknown_identities_unknown(native_audit):
    jobs,dataset_id,upstream,role = native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    snapshot=jobs.snapshot(run_id)
    profile=snapshot.dataset_profile
    assert profile.total_images == 6
    assert profile.metadata['physical_sample_id'].distinct_count is None
    assert profile.metadata['batch_id'].covered_images == 0
    assert profile.benchmark is None
    assert profile.geometry.box_count == 0
    assert profile.geometry.relative_area is None
    assert profile.contrast_measurement is None


def test_geometry_profile_is_computed_from_original_boxes(dataset):
    from iad_core.audit.dataset_profile import AuditDatasetProfiles
    from iad_core.workbench.analysis_manifest import AnalysisManifests
    db,_,config=dataset
    profile=AuditDatasetProfiles(db).freeze(AnalysisManifests(db).freeze([config.dataset.id]))
    assert profile.geometry.box_count == 2
    assert profile.geometry.instance_distribution == {'0':2,'1':2}
    assert profile.geometry.relative_area.median == pytest.approx(400/76800)
    assert profile.geometry.aspect_ratio.median == 1


def test_physical_identity_count_uses_the_existing_batch_scope(dataset):
    from iad_core.audit.dataset_profile import AuditDatasetProfiles
    from iad_core.workbench.analysis_manifest import AnalysisManifests
    from iad_core.storage.repositories import SampleRepository
    db,registry,config=dataset
    samples=SampleRepository(db)
    manifest=AnalysisManifests(db).freeze([config.dataset.id])
    for index,record in enumerate(manifest.records):
        sample=record.sample.model_copy(update={'physical_sample_id':'part-one','batch_id':'batch-'+str(index//2)})
        samples.upsert(sample)
    profile=AuditDatasetProfiles(db).freeze(AnalysisManifests(db).freeze([config.dataset.id]))
    assert profile.metadata['physical_sample_id'].covered_images==4
    assert profile.metadata['physical_sample_id'].distinct_count==2
    config.split.physical_sample_scope='global'
    registry.save(config,require_existing=True)
    global_profile=AuditDatasetProfiles(db).freeze(AnalysisManifests(db).freeze([config.dataset.id]))
    assert global_profile.metadata['physical_sample_id'].distinct_count==1


def test_selected_benchmark_uses_saved_gold_split_and_leakage_artifacts(dataset,tmp_path):
    import yaml
    import hashlib
    from iad_core.audit.dataset_profile import AuditDatasetProfiles
    from iad_core.workbench.analysis_manifest import AnalysisManifests
    from iad_core.workbench.audit_sources import AuditSources
    from iad_core.benchmark.builder import run_benchmark_pipeline
    db,registry,config=dataset
    from iad_core.storage.repositories import SampleRepository
    samples=SampleRepository(db)
    for sample in samples.list_by_task(config.task.task_id):
        sample.quality_status='FAIL' if sample.relative_path in ('dent.png','scratch.png') else 'PASS'
        sample.quality_source='fixture'
        samples.upsert(sample)
    config.gold.trusted_quality_sources=['fixture']
    registry.save(config,require_existing=True)
    config_path=tmp_path/'benchmark.yaml'
    config_path.write_text(yaml.safe_dump(config.model_dump(mode='json')))
    output=tmp_path/'benchmark-artifacts'
    built=run_benchmark_pipeline(config.task.task_id,config_path=str(config_path),db_path=db.db_path,
        build_id='real-artifact',output_dir=str(output))
    assert built.gold_jsonl
    catalog=AuditSources(db).catalog([config.dataset.id])
    assert [(item.build_id,item.covered_images) for item in catalog.benchmark_builds]==[('real-artifact',4)]
    manifest=AnalysisManifests(db).freeze([config.dataset.id])
    source=AuditDatasetProfiles(db).freeze(manifest,'real-artifact').benchmark
    assert source.source_matches_scope and source.covered_images==source.source_image_count==4
    assert source.source_hashes['gold.jsonl']==hashlib.sha256((output/'gold.jsonl').read_bytes()).hexdigest()
    assert sum(source.split_distribution.values())==4
    assert source.confirmed_gold_images>0
    assert source.pixel_gold_images==0
    assert source.readiness.domain_shift.status=='NOT_EVALUATED'
    assert AuditDatasetProfiles(db).freeze(manifest).benchmark is None


def test_targeted_recheck_preserves_the_previous_final_and_counts_only_the_active_version(native_audit):
    from iad_core.audit.batches import AuditBatches
    jobs,dataset_id,upstream,role = native_audit
    ModuleSettings(jobs.db).save(dict(module='audit',expected_revision=1,settings=dict(batch_size=2)))
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    batches=AuditBatches(jobs);batches.begin(run_id)
    samples=jobs.samples(run_id)
    original=save_image(jobs,run_id,samples[0])
    save_image(jobs,run_id,samples[1])
    master_observed(jobs,run_id,batches.context(run_id))
    batches.publish(run_id,dict(commit_key='request-review',batch_number=1,base_revision=0,discoveries=[],review_requests=[dict(
        sample_id=samples[0].sample_id,result_revision=1,reason='两图的标注关系解释直接冲突，复核当前主图。',
        conflict_refs=[dict(sample_id=samples[1].sample_id,result_revision=1,kind='image')])]))
    pending=batches.rechecks(run_id)
    assert len(pending)==1
    assert batches.begin(run_id).number==1
    assert jobs.context(run_id,samples[0].sample_id).review.reason.startswith('两图')
    save_image(jobs,run_id,samples[0],['missing'],commit_key='reviewed-final')
    active=jobs.sample(run_id,samples[0].sample_id)
    assert active.result_revision==2 and active.result.state=='suspect'
    assert batches.history(run_id,samples[0].sample_id)[0].final==original
    assert len(batches.history(run_id,samples[0].sample_id))==2
    statistics=AuditReports(jobs.db).statistics(run_id)
    assert (statistics.completed_images,statistics.suspect_images,statistics.issue_occurrences)==(2,1,1)
    master_observed(jobs,run_id,batches.context(run_id))
    batches.publish(run_id,dict(commit_key='review-complete',batch_number=1,base_revision=1,discoveries=[]))
    assert batches.begin(run_id).number==2


def test_incomplete_recheck_keeps_the_previous_effective_final(native_audit):
    from iad_core.audit.batches import AuditBatches
    from iad_core.audit.commits import AuditCommits
    jobs,dataset_id,upstream,role=native_audit
    ModuleSettings(jobs.db).save(dict(module='audit',expected_revision=1,settings=dict(batch_size=2)))
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    batches=AuditBatches(jobs);batches.begin(run_id)
    samples=jobs.samples(run_id)
    original=save_image(jobs,run_id,samples[0],['coverage'])
    save_image(jobs,run_id,samples[1])
    publish_batch(jobs,run_id,review_requests=[dict(sample_id=samples[0].sample_id,result_revision=1,
        reason='对照关系需要复核。',conflict_refs=[dict(sample_id=samples[1].sample_id,result_revision=1,kind='image')])])
    jobs.session_created(run_id,samples[0].sample_id)
    incomplete={**original.model_dump(mode='json'),'execution_status':'incomplete','state':None,'findings':[],
        'analysis':'现有视角不足以完成这次定向复核。','conclusion':'本次复核未完成。'}
    AuditCommits(jobs).accept(run_id,samples[0].sample_id,dict(commit_key='review-progress',final=incomplete))
    active=jobs.sample(run_id,samples[0].sample_id)
    assert active.state=='COMPLETED' and active.result_revision==1
    assert active.result==original
    jobs.failure(run_id,samples[0].sample_id,'本次复核未完成')
    assert jobs.sample(run_id,samples[0].sample_id).result==original
    assert batches.rechecks(run_id,pending_only=False)[0].state=='FAILED'
    assert len(batches.history(run_id,samples[0].sample_id))==1
    statistics=AuditReports(jobs.db).statistics(run_id)
    assert (statistics.completed_images,statistics.suspect_images,statistics.issue_occurrences)==(2,1,1)


def test_zero_issue_report_still_contains_coverage_capabilities_and_purpose_assessments(native_audit):
    from iad_core.audit.batches import AuditBatches
    from iad_core.audit.queries import AuditQueries
    jobs,dataset_id,upstream,role = native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    batches=AuditBatches(jobs);batches.begin(run_id)
    for sample in jobs.samples(run_id):
        save_image(jobs,run_id,sample)
    master_observed(jobs,run_id,batches.context(run_id))
    batches.publish(run_id,dict(commit_key='empty-findings',batch_number=1,base_revision=0,discoveries=[]))
    reports=AuditReports(jobs.db);reports.begin(run_id)
    reports.commit(run_id,dict(commit_key='report',discovery_ids=[],conclusion='可用于视觉探索和内部调试。',
        consistency_analysis='逐图核对，未获得上游候选。',coverage_analysis='覆盖规则背景与主体边缘，尚不能评价未采集场景。',
        independence_analysis='无法确定独立物理件和批次数量。',capabilities=[],usability=[dict(
            purpose=purpose,status='candidate' if purpose in ('exploration','training_experiment','debug') else 'not_evaluated',
            reason='原图与观察可用于研究。' if purpose in ('exploration','training_experiment','debug') else '没有可信 Gold 与独立测试范围。')
            for purpose in ('exploration','training_experiment','debug','image_evaluation','bbox_evaluation','pixel_evaluation','formal_benchmark')],
        review_priorities=[],limitations=[]))
    report=AuditQueries(jobs.db).report(run_id)
    assert report.statistics.issue_occurrences==0
    assert report.dataset_profile.total_images==6
    assert report.coverage_analysis.startswith('覆盖规则背景')
    assert len(report.usability)==7
    assert all(item.status!='usable' for item in report.usability if 'evaluation' in item.purpose)


def test_formal_report_needs_typical_support_images_and_real_readiness(native_audit):
    jobs,dataset_id,upstream,role=native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    samples=jobs.samples(run_id)
    for sample in samples:
        save_image(jobs,run_id,sample)
    discovery=dict(group_id='pattern',kind='visual_pattern',dimension='visual_coverage',status='supported',title='主体轮廓',
        description='完整原图呈现主体与背景。',visual_signature='规则轮廓',annotation_relation='尚未形成标注矛盾。',scope='已完成范围',
        support_refs=[dict(sample_id=samples[0].sample_id,result_revision=1,kind='image')],
        counter_refs=[dict(sample_id=samples[1].sample_id,result_revision=1,kind='image')],
        representatives=[dict(sample_id=samples[1].sample_id,role='counter',reason='对照图保留整体背景。')])
    publish_batch(jobs,run_id,[discovery])
    reports=AuditReports(jobs.db);reports.begin(run_id)
    with pytest.raises(ValueError,match='典型'):
        reports.commit(run_id,report_submission(discovery_ids=['pattern']))
    from iad_core.audit.report_models import AuditDiscovery
    with pytest.raises(ValueError,match='支持'):
        reports.validate_discoveries(run_id,[AuditDiscovery.model_validate({**discovery,'representatives':[
            dict(sample_id=samples[1].sample_id,role='representative',reason='误把反例用作典型支持。')]})],final=True)
    usage=report_submission()['usability']
    usage[3]['status']='usable'
    with pytest.raises(ValueError,match='真实 Gold'):
        reports.commit(run_id,report_submission(usability=usage))


def test_capability_gallery_accepts_typical_and_counter_originals_from_its_evidence(native_audit):
    from iad_core.audit.queries import AuditQueries
    jobs,dataset_id,upstream,role=native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    samples=jobs.samples(run_id)
    for sample in samples:
        save_image(jobs,run_id,sample)
    publish_batch(jobs,run_id)
    reports=AuditReports(jobs.db);reports.begin(run_id)
    originals=[AuditEvidence(jobs).read(run_id,sample.sample_id,dict(sample_id=sample.sample_id)).evidence_id for sample in samples[:2]]
    master_observed(jobs,run_id,{},originals)
    capability=dict(tag='low_contrast_defect',coverage_status='candidate',reason='较淡亮线与较清晰边缘形成可见度对照。',
        evidence_refs=[dict(sample_id=sample.sample_id,result_revision=1,kind='image') for sample in samples[:2]],
        representatives=[dict(sample_id=samples[0].sample_id,role='representative',reason='典型原图保留较淡亮线及周围背景。'),
            dict(sample_id=samples[1].sample_id,role='counter',reason='对照原图中相似位置边缘较清晰，不代表已确认良品。')],missing_conditions=[])
    reports.commit(run_id,report_submission(capabilities=[capability]))
    gallery=AuditQueries(jobs.db).report(run_id).evidence_groups['capability:low_contrast_defect']
    assert [item.role for item in gallery]==['representative','counter']
    assert all(item.image.is_whole_image and item.image.representation=='raw' for item in gallery)


@pytest.mark.parametrize(('typical_count','counter_count'),[(4,1),(1,3),(4,2)])
def test_model_selects_gallery_size_for_discoveries_and_capabilities(native_audit,typical_count,counter_count):
    from iad_core.audit.queries import AuditQueries
    jobs,dataset_id,upstream,role=native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    samples=jobs.samples(run_id)
    for sample in samples:
        save_image(jobs,run_id,sample)
    chosen=samples[:typical_count+counter_count]
    representatives=[dict(sample_id=sample.sample_id,role='representative' if index<typical_count else 'counter',
        reason='补充不同位置或覆盖关系的完整原图。') for index,sample in enumerate(chosen)]
    refs=[dict(sample_id=sample.sample_id,result_revision=1,kind='image') for sample in chosen]
    discovery=dict(group_id='coverage',kind='visual_pattern',dimension='visual_coverage',status='supported',title='主体覆盖关系',
        description='归纳主体位置和覆盖差异，原图用于核对规律。',visual_signature='规则轮廓',annotation_relation='当前覆盖关系未形成独立矛盾。',
        scope='冻结已完成范围',support_refs=refs[:typical_count],counter_refs=refs[typical_count:],representatives=representatives)
    publish_batch(jobs,run_id,[discovery])
    reports=AuditReports(jobs.db);reports.begin(run_id)
    capability=dict(tag='structural_relation',coverage_status='candidate',reason='已观察到不同位置的主体与背景关系。',
        evidence_refs=refs,representatives=representatives)
    reports.commit(run_id,report_submission(discovery_ids=['coverage'],capabilities=[capability]))
    report=AuditQueries(jobs.db).report(run_id)
    for group in ('coverage','capability:structural_relation'):
        gallery=report.evidence_groups[group]
        assert [item.sample_id for item in gallery]==[sample.sample_id for sample in chosen]
        assert len(gallery)==typical_count+counter_count
        assert all(item.image.is_whole_image and item.image.representation=='raw' for item in gallery)


def test_regenerating_report_reuses_frozen_images_and_refines_the_global_discoveries(native_audit):
    from iad_core.audit.batches import AuditBatches
    from iad_core.audit.queries import AuditQueries
    jobs,dataset_id,upstream,role=native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    for sample in jobs.samples(run_id):
        save_image(jobs,run_id,sample)
    publish_batch(jobs,run_id)
    reports=AuditReports(jobs.db);reports.begin(run_id)
    reports.commit(run_id,report_submission())
    assert jobs.finish(run_id)['status']=='COMPLETED'
    frozen=jobs.snapshot(run_id)
    originals=[sample.model_dump_json() for sample in jobs.samples(run_id)]
    prompts=dict(master_prompt=dict(system_prompt='跨全量归纳现象与规律。',user_prompt='综合修订发现账本。'),report_instruction='按综合发现生成报告。')
    resumed=jobs.regenerate_report(run_id,prompts)
    assert resumed['status']=='RUNNING' and resumed['completed']==6
    assert jobs.snapshot(run_id)==frozen
    assert reports.session(run_id).prompts.model_dump()==prompts
    assert [sample.model_dump_json() for sample in jobs.samples(run_id)]==originals
    assert AuditBatches(jobs).begin(run_id).number==1
    samples=jobs.samples(run_id)
    discovery=dict(group_id='shape',kind='visual_pattern',dimension='visual_coverage',status='supported',title='主体与背景的共性轮廓',
        description='冻结范围中可见规则主体和背景边界，变化主要来自位置关系。',visual_signature='规则轮廓',annotation_relation='未形成覆盖矛盾。',scope='本次已完成范围',
        support_refs=[dict(sample_id=sample.sample_id,result_revision=1,kind='image') for sample in samples],
        representatives=[dict(sample_id=sample.sample_id,role='representative',reason='呈现不同位置的主体轮廓。') for sample in samples])
    publish_batch(jobs,run_id,[discovery])
    reports.begin(run_id)
    reports.commit(run_id,report_submission(commit_key='regenerated',discovery_ids=['shape'],conclusion='共同轮廓支持视觉探索。'))
    assert jobs.finish(run_id)['status']=='COMPLETED'
    report=AuditQueries(jobs.db).report(run_id)
    assert report.conclusion=='共同轮廓支持视觉探索。'
    assert report.discoveries[0].title=='主体与背景的共性轮廓'
    assert len(report.evidence_groups['shape'])==6
    assert [sample.model_dump_json() for sample in jobs.samples(run_id)]==originals
    assert jobs.snapshot(run_id)==frozen


def test_later_batch_receives_the_effective_revision_of_an_earlier_image_recheck(native_audit):
    from iad_core.audit.batches import AuditBatches
    jobs,dataset_id,upstream,role = native_audit
    ModuleSettings(jobs.db).save(dict(module='audit',expected_revision=1,settings=dict(batch_size=2)))
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    batches=AuditBatches(jobs)
    samples=jobs.samples(run_id)
    batches.begin(run_id)
    for sample in samples[:2]:
        save_image(jobs,run_id,sample)
    publish_batch(jobs,run_id)
    batches.begin(run_id)
    for sample in samples[2:4]:
        save_image(jobs,run_id,sample)
    publish_batch(jobs,run_id,review_requests=[dict(sample_id=samples[0].sample_id,result_revision=1,
        reason='第二批的对照表明首图的覆盖关系需要复核。',
        conflict_refs=[dict(sample_id=samples[2].sample_id,result_revision=1,kind='image')])])
    save_image(jobs,run_id,samples[0],['revised'],commit_key='recheck')
    context=batches.context(run_id)
    revised=next(item for item in context['items'] if item['sample_id']==samples[0].sample_id)
    assert revised['result_revision']==2
    assert revised['final']['state']=='suspect'
    assert len(context['items'])==3
    with pytest.raises(ValueError,match='实际读取'):
        batches.publish(run_id,dict(commit_key='unread',batch_number=2,base_revision=2,discoveries=[]))
    publish_batch(jobs,run_id)
    assert batches.begin(run_id).number==3


def test_retry_reopens_only_the_batch_with_failed_images(native_audit):
    from iad_core.audit.batches import AuditBatches
    jobs,dataset_id,upstream,role=native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    batches=AuditBatches(jobs);batches.begin(run_id)
    samples=jobs.samples(run_id)
    for sample in samples[:-1]:
        save_image(jobs,run_id,sample)
    jobs.failure(run_id,samples[-1].sample_id,'本图模型调用失败')
    master_observed(jobs,run_id,batches.context(run_id))
    batches.publish(run_id,dict(commit_key='partial',batch_number=1,base_revision=0,discoveries=[]))
    AuditReports(jobs.db).failure(run_id,'整体分析调用失败')
    jobs.finish(run_id)
    jobs.resume(run_id)
    assert batches.begin(run_id).number==1
    states=jobs.samples(run_id)
    assert [sample.state for sample in states]==['COMPLETED']*5+['PENDING']
    assert all(sample.result_revision==1 for sample in states[:-1])


def test_resume_keeps_unstarted_batches_pending(native_audit):
    from iad_core.audit.batches import AuditBatches
    jobs,dataset_id,upstream,role=native_audit
    ModuleSettings(jobs.db).save(dict(module='audit',expected_revision=1,settings=dict(batch_size=2)))
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    batches=AuditBatches(jobs);batches.begin(run_id)
    for sample in jobs.samples(run_id)[:2]:
        save_image(jobs,run_id,sample)
    publish_batch(jobs,run_id)
    batches.begin(run_id)
    AuditReports(jobs.db).failure(run_id,'主会话中断')
    jobs.finish(run_id)
    jobs.resume(run_id)
    assert [batch.state for batch in batches.list(run_id)]==['COMPLETED','AUDITING','PENDING']
    assert [batch.clues_revision for batch in batches.list(run_id)]==[0,1,None]


def test_historical_reports_are_read_only_frozen_artifacts(native_audit):
    from iad_core.audit.queries import AuditQueries
    from iad_core.workbench.audit_result_models import AuditSampleQuery
    jobs,dataset_id,upstream,role=native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    jobs.cancel(run_id)
    queries=AuditQueries(jobs.db)
    summary=queries.report(run_id).model_dump(mode='json',exclude_computed_fields=True)
    snapshot=jobs.snapshot(run_id).model_dump(mode='json')
    snapshot['schema_version']=3
    html='<html><body>冻结历史报告原文</body></html>'
    with jobs.db.connection() as connection:
        connection.execute('UPDATE audit_workflow_runs SET snapshot_json=?,summary_json=?,report_html=? WHERE job_id=?',
            (json.dumps(snapshot),json.dumps(summary),html,run_id))
    assert queries.report(run_id).archived is True
    assert queries.export(run_id)['html']==html
    assert queries.samples(AuditSampleQuery(run_id=run_id)).archived is True
    with pytest.raises(ValueError,match='历史|归档'):
        jobs.resume(run_id)


def test_completed_report_keeps_its_frozen_metadata_when_the_dataset_is_renamed(native_audit):
    from iad_core.audit.queries import AuditQueries
    from iad_core.dataset.registry import DatasetRegistry
    jobs,dataset_id,upstream,role=native_audit
    run_id=jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    for sample in jobs.samples(run_id):
        save_image(jobs,run_id,sample)
    publish_batch(jobs,run_id)
    reports=AuditReports(jobs.db);reports.begin(run_id)
    reports.commit(run_id,report_submission())
    assert jobs.finish(run_id)['status']=='COMPLETED'
    queries=AuditQueries(jobs.db)
    frozen=queries.report(run_id)
    html=queries.export(run_id)
    registry=DatasetRegistry(jobs.db)
    config=registry.get(dataset_id)
    config.dataset.name='另一个数据集名称'
    registry.save(config,require_existing=True)
    assert queries.report(run_id)==frozen
    assert queries.export(run_id)==html
