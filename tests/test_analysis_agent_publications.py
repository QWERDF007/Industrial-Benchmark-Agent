from uuid import uuid4

import pytest

from iad_core.analysis.commits import AnalysisCommits
from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.analysis.publications import AnalysisPublications
from iad_core.workbench.calls import ModelCalls, NativeModelCallEnd, NativeModelCallStart
from iad_core.workbench.module_settings import ModuleSettings


@pytest.mark.parametrize('module',['exploration','knowledge'])
@pytest.mark.parametrize('failure_count',[1,4])
def test_source_errors_without_visual_observations_do_not_publish_a_version(agent_jobs, module, failure_count):
    from pathlib import Path
    from iad_core.analysis.finalization import AnalysisFinalizations
    from iad_core.analysis.queries import AnalysisQueries
    from iad_core.knowledge.instructions import default_directions
    jobs, dataset_id, role = agent_jobs
    if module == 'knowledge':
        ModuleSettings(jobs.db).save(dict(module='knowledge',expected_revision=0,
            settings=dict(model=dict(provider_id='swift-30003',model_id='fixture'),batch_size=1)))
    request = dict(submission_id=str(uuid4()),analysis_kind=module,dataset_ids=[dataset_id])
    request.update(dict(normal_images=[dataset_id+':normal.png'],prompt=dict(text='查看真实原图。')) if module == 'exploration'
        else dict(mining_prompt=dict(objective='查看真实原图。',instruction='查看真实原图并如实记录取证错误。',
            directions=[default_directions()[0].model_dump(mode='json')])))
    run_id = jobs.start(request,agent=role)['run_id']
    for record in jobs.snapshot(run_id).manifest.records:
        Path(record.sample.image_path).unlink()
    for index in range(failure_count):
        context = jobs.context(run_id)
        page = AnalysisEvidence(jobs).read(run_id,dict(sample_id=context.round.targets[0].sample_id))
        assert page.error and page.images == []
        AnalysisCommits(jobs).accept(run_id,dict(commit_key='source-error-'+str(index),base_revision=context.revision,
            round_id=context.round.round_id,observations=[dict(dataset_id=dataset_id,sample_id=page.sample_id,
                description='原始图像文件不可读，未形成视觉观察。',evidence_ids=[],report_preparation_error=True)],
            **{'directions' if module == 'exploration' else 'checks':[]},
            summary='图像文件不可读。',limitations=['没有可见图像依据。'],unresolved_questions=[]))
    if failure_count == 4:
        with pytest.raises(ValueError,match='有效视觉观察'):
            AnalysisFinalizations(jobs).context(run_id)
        assert jobs.jobs.finish_external(run_id)['status'] == 'FAILED'
    else:
        assert jobs.cancel(run_id)['status'] == 'CANCELLED'
    assert AnalysisPublications(jobs.db).publish(run_id) is None
    assert AnalysisQueries(jobs.db).versions(dataset_id,module) == []
    assert jobs.jobs.status(run_id)['failed'] == failure_count
    assert jobs.jobs.status(run_id)['completed'] == 0


def test_published_evidence_exposes_frozen_quality_groups_for_automatic_rounds(agent_jobs):
    from iad_core.analysis.queries import AnalysisQueries
    from iad_core.dataset.registry import DatasetRegistry
    jobs,dataset_id,role=agent_jobs
    registry=DatasetRegistry(jobs.db)
    config=registry.get(dataset_id)
    config.quality.source='filename_regex'
    config.quality.pattern='^(normal|dent)'
    config.quality.mapping={'normal':'PASS','dent':'FAIL'}
    registry.save(config);registry.rescan(dataset_id)
    run_id=jobs.start(dict(submission_id=str(uuid4()),analysis_kind='exploration',dataset_ids=[dataset_id],
        normal_images=[dataset_id+':dent.png'],prompt={'text':'观察图级身份与主动裁窗。'}),agent=role)['run_id']
    evidence=AnalysisEvidence(jobs)
    for round_id in (1,2):
        context=jobs.context(run_id)
        page=evidence.read(run_id,{'sample_id':context.round.targets[0].sample_id})
        call=NativeModelCallStart(call_id='call_'+uuid4().hex,started_at='2026-11-09T12:00:00Z',request={'fixture':'published identity'})
        ModelCalls(jobs.db).start_native(run_id,call,sample_id=None,session_id=context.session_id,attempt=1)
        evidence.delivered(run_id,call.call_id,[i.image.evidence_id for i in page.images])
        ModelCalls(jobs.db).finish_native(run_id,None,NativeModelCallEnd(call_id=call.call_id,finished_at='2026-11-09T12:00:01Z',elapsed_ms=1000,finish_reason='tool-calls'))
        AnalysisCommits(jobs).accept(run_id,dict(commit_key='observe',base_revision=context.revision,round_id=round_id,
            observations=[dict(sample_id=page.sample_id,dataset_id=dataset_id,description='完整可见观察。',evidence_ids=[i.image.evidence_id for i in page.images])],
            directions=[],summary='逐登记保存。',limitations=[],unresolved_questions=[]))
    version_id=jobs.cancel(run_id)['analysis_version_id']
    view=AnalysisQueries(jobs.db).view(version_id)
    dent=next(i for i in view.evidence if i.sample_id==dataset_id+':dent.png')
    assert dent.sampling_group=='abnormal' and dent.candidate_role=='normal'
    automatic=next(i for i in view.evidence if i.candidate_role is None)
    frozen=next(r for r in jobs.snapshot(run_id).manifest.records if r.sample.sample_id==automatic.sample_id)
    assert automatic.sampling_group==frozen.sampling_group
    config.quality.mapping={'normal':'FAIL','dent':'PASS'}
    registry.save(config);registry.rescan(dataset_id)
    assert AnalysisQueries(jobs.db).view(version_id)==view


def test_partial_versions_keep_frozen_evidence_when_resume_releases_failed_media(agent_jobs):
    from pathlib import Path
    from iad_core.analysis.queries import AnalysisQueries
    from iad_core.dataset.registry import DatasetRegistry
    jobs,dataset_id,role = agent_jobs
    (Path(jobs.db.db_path).parent/'labels'/'dent.json').write_text('{broken-json')
    DatasetRegistry(jobs.db).rescan(dataset_id)
    started = jobs.start(dict(submission_id=str(uuid4()),analysis_kind='exploration',dataset_ids=[dataset_id],
        normal_images=[dataset_id+':dent.png'],prompt={'text':'保留可见整图及不可读标注原因。'}),agent=role)
    run_id = started['run_id']
    evidence = AnalysisEvidence(jobs)
    page = evidence.read(run_id,{'sample_id':dataset_id+':dent.png'})
    assert page.error == '原图可读，必需标注文件不可读'
    call = NativeModelCallStart(call_id='call_'+uuid4().hex,started_at='2026-11-09T12:00:00Z',request={'fixture':'limited whole image'})
    ModelCalls(jobs.db).start_native(run_id,call,sample_id=None,session_id=jobs.state(run_id).session_id,attempt=1)
    evidence.delivered(run_id,call.call_id,[item.image.evidence_id for item in page.images])
    ModelCalls(jobs.db).finish_native(run_id,None,NativeModelCallEnd(call_id=call.call_id,finished_at='2026-11-09T12:00:01Z',elapsed_ms=1000,finish_reason='tool-calls'))
    AnalysisCommits(jobs).accept(run_id,dict(commit_key='limited',base_revision=0,round_id=1,
        observations=[dict(sample_id=page.sample_id,dataset_id=dataset_id,description='原图可见，标注不可读。',
            evidence_ids=[item.image.evidence_id for item in page.images],report_preparation_error=True)],
        directions=[],summary='保留受限观察。',limitations=['未读取有效标注。'],unresolved_questions=[]))
    version_id = jobs.cancel(run_id)['analysis_version_id']
    queries = AnalysisQueries(jobs.db)
    before = queries.sample_evidence(version_id,page.sample_id)
    assert len(before.items) == 1
    jobs.resume(run_id)
    assert queries.sample_evidence(version_id,page.sample_id) == before


def test_merge_preserves_counterexamples_and_partial_publication_can_seed_mining_without_presets(agent_jobs, tmp_path, monkeypatch):
    jobs, dataset_id, role = agent_jobs
    job = jobs.start({'submission_id': str(uuid4()), 'analysis_kind': 'exploration', 'dataset_ids': [dataset_id],
        'normal_images': [dataset_id + ':normal.png', dataset_id + ':dent.png'], 'prompt': {'text': '比较原图并保留反例。'}}, agent=role)
    run_id = job['run_id']
    evidence = AnalysisEvidence(jobs)
    pages = [evidence.read(run_id, {'sample_id': sid}) for sid in [dataset_id + ':normal.png', dataset_id + ':dent.png']]
    call = NativeModelCallStart(call_id='call_' + uuid4().hex, started_at='2026-11-09T12:00:00Z', request={'fixture': 'visual request'})
    ModelCalls(jobs.db).start_native(run_id, call, sample_id=None, session_id=jobs.state(run_id).session_id, attempt=1)
    evidence.delivered(run_id, call.call_id, [image.image.evidence_id for page in pages for image in page.images])
    ModelCalls(jobs.db).finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id,
        finished_at='2026-11-09T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
    whole_ids = [page.images[0].image.evidence_id for page in pages]
    first = dict(commit_key='first', base_revision=0, round_id=1,
        observations=[dict(sample_id=page.sample_id, dataset_id=dataset_id, description='本登记实际可见观察。',
            evidence_ids=[item.image.evidence_id for item in page.images]) for page in pages],
        directions=[dict(direction_id='D' + str(index + 1), title=title, instruction='沿边缘核对轮廓连续性。',
            applies_to='both', rationale='保留两张原图的可见差别。', evidence_ids=[whole_ids[index]],
            counter_evidence_ids=[whole_ids[1 - index]], dataset_ids=[dataset_id], limitations=['缺少更多独立来源。'])
            for index, title in enumerate(['边缘观察', '轮廓观察'])], summary='可复查的检查方向。', limitations=[], unresolved_questions=['需要更多独立来源。'])
    first['directions'].append({**first['directions'][0], 'direction_id':'D3', 'title':'亮带分布',
        'instruction':'沿表面检查亮带的分布位置。'})
    commits = AnalysisCommits(jobs)
    commits.accept(run_id, first)
    assert {item.direction_id for item in jobs.state(run_id).catalog.directions} == {'D1','D2','D3'}
    commits.accept(run_id, {**first, 'commit_key':'revise', 'base_revision':1, 'round_id':2,
        'arguments':[
            dict(entry_id='D1',evidence_id=whole_ids[0],role='support',reason='完整边缘提供复核动作的依据。'),
            dict(entry_id='D1',evidence_id=whole_ids[1],role='counter',reason='局部轮廓差异仍影响比较解释。')],
        'observations':[], 'directions':[{**first['directions'][0], 'counter_evidence_ids':[],
            'change_reason':'补充已观察的轮廓差异及缺失视角。',
            'rationale':'两张图的轮廓差异已形成当前比较依据。', 'limitations':['仍缺少背面视角。']}]})
    revised = jobs.state(run_id).catalog.directions[0]
    assert revised.rationale == '两张图的轮廓差异已形成当前比较依据。'
    assert revised.limitations == ['仍缺少背面视角。']
    commits.accept(run_id, dict(commit_key='merge', base_revision=2, round_id=2, observations=[], directions=[],
        arguments=[dict(entry_id='D1',evidence_id=whole_ids[0],role='support',reason='合并范围内完整边缘仍提供比较依据。'),
            dict(entry_id='D1',evidence_id=whole_ids[1],role='counter',reason='缺少背面视角时仍需保留轮廓差异反例。')],
        merges=[dict(target_id='D1', source_ids=['D2'],reason='两方向沿相同外缘核对，保留全部正反论据。')], summary='同一检查动作合并，保留全部反例。', limitations=[], unresolved_questions=['需要更多独立来源。']))
    from iad_core.analysis.queries import AnalysisQueries
    arguments = AnalysisQueries(jobs.db).arguments(run_id, dict(entry_id='D1'))
    assert arguments.total == 4
    assert {item.origin_entry_id for item in arguments.items if item.role == 'support'} == {'D1', 'D2'}
    status = jobs.cancel(run_id)
    publications = AnalysisPublications(jobs.db)
    publication = publications.get(status['analysis_version_id'])
    assert (publication.coverage.completed, publication.coverage.failed, publication.coverage.unprocessed) == (2, 0, 2)
    assert publication.execution_status == 'CANCELLED'
    assert len(publication.catalog.directions) == 2
    parallel = next(item for item in publication.catalog.directions if item.direction_id == 'D3')
    assert parallel.instruction == '沿表面检查亮带的分布位置。'
    assert parallel.predecessor_direction_ids == []
    direction = publication.catalog.directions[0]
    assert set(direction.evidence_ids) == set(direction.counter_evidence_ids) == set(whole_ids)
    assert direction.predecessor_direction_ids == ['D2']
    assert publications.publish(run_id) == publication
    assert len(jobs.jobs.status(run_id)['model_calls']) == 1
    from iad_core.analysis.queries import AnalysisQueries
    detail = AnalysisQueries(jobs.db).sample_evidence(publication.version_id,pages[1].sample_id)
    assert detail.registration.sample.sample_id == pages[1].sample_id
    assert detail.registration.annotations[0].bbox == [10,10,30,30]
    assert {item.evidence_id for item in detail.items} == {item.image.evidence_id for item in pages[1].images}
    assert detail.version_id == publication.version_id
    assert len(jobs.jobs.status(run_id)['model_calls']) == 1

    empty_presets = tmp_path / 'empty-directions'
    empty_presets.mkdir()
    monkeypatch.setenv('IAD_KNOWLEDGE_DIRECTIONS_DIR', str(empty_presets))
    ModuleSettings(jobs.db).save({'module': 'knowledge', 'expected_revision': 0,
        'settings': {'model': {'provider_id': 'swift-30003', 'model_id': 'fixture'}, 'batch_size': 1}})
    mining = jobs.start({'submission_id': str(uuid4()), 'analysis_kind': 'knowledge', 'dataset_ids': [dataset_id],
        'mining_prompt': {'objective': '沿已选方向检查完整范围。', 'instruction': '用户手改的完整正文。', 'directions': [dict(
            direction_id='D1', title='本场有效标题', instruction='本场有效检查动作。', origin='explored',
            source=dict(origin='explored', run_id=run_id, version_id=publication.version_id, direction_id='D1'))]}}, agent=role)
    frozen = jobs.snapshot(mining['run_id'])
    selected = frozen.selected_directions[0]
    assert selected.title == '本场有效标题'
    assert selected.instruction == '本场有效检查动作。'
    assert selected.source_title == '边缘观察'
    assert set(selected.source_counter_evidence_ids) == set(whole_ids)
    assert frozen.instruction == '用户手改的完整正文。'
    assert jobs.context(mining['run_id']).catalog.checks == []
    assert jobs.context(mining['run_id']).completed_sample_ids == []
    assert len(frozen.manifest.records) == 4
