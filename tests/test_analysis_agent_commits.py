from uuid import uuid4

import pytest

from iad_core.analysis.commits import AnalysisCommits
from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.workbench.calls import ModelCalls, NativeModelCallEnd, NativeModelCallStart


@pytest.mark.parametrize('module', ['exploration', 'knowledge'])
def test_partial_publication_uses_global_draft_text_and_rejected_text_does_not_save_observations(agent_jobs, module):
    from iad_core.analysis.publications import AnalysisPublications
    from iad_core.analysis.queries import AnalysisQueries
    from iad_core.knowledge.instructions import default_directions
    from iad_core.workbench.module_settings import ModuleSettings

    jobs, dataset_id, role = agent_jobs
    request = dict(submission_id=str(uuid4()), analysis_kind=module, dataset_ids=[dataset_id])
    if module == 'exploration':
        request.update(normal_images=[dataset_id + ':normal.png'], prompt={'text':'核对主体边缘。'})
    else:
        ModuleSettings(jobs.db).save(dict(module='knowledge', expected_revision=0,
            settings=dict(model=dict(provider_id='swift-30003', model_id='fixture'), batch_size=1)))
        request['mining_prompt'] = dict(objective='核对主体边缘。', instruction='保留可复核依据。',
            directions=[default_directions()[0].model_dump(mode='json')])
    run_id = jobs.start(request, agent=role)['run_id']
    context = jobs.context(run_id)
    evidence = AnalysisEvidence(jobs)
    page = evidence.read(run_id, dict(sample_id=context.round.targets[0].sample_id))
    ids = [item.image.evidence_id for item in page.images]
    whole = next(item.image.evidence_id for item in page.images if item.image.is_whole_image)
    calls = ModelCalls(jobs.db)
    call = NativeModelCallStart(call_id='call_' + uuid4().hex, started_at='2026-11-09T12:00:00Z',
        request={'fixture':'partial global draft'})
    calls.start_native(run_id, call, sample_id=None, session_id=context.session_id, attempt=1)
    evidence.delivered(run_id, call.call_id, ids)
    calls.finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id,
        finished_at='2026-11-09T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
    entry = dict(title='主体边缘连续关系', dataset_ids=[dataset_id], counter_evidence_ids=[], limitations=[])
    if module == 'exploration':
        entry.update(direction_id='edge', applies_to='both', instruction='外缘可辨时沿轮廓复核连续关系。',
            rationale='完整主体外缘可作为核对参照。', evidence_ids=[whole])
    else:
        entry.update(check_id='edge', subject='主体', location='外缘', criterion='外缘可辨时沿轮廓复核连续关系。',
            allowed_variations=[], status='provisional', support_evidence_ids=[whole], direction_refs=['D1'])
    field = 'directions' if module == 'exploration' else 'checks'
    submission = dict(commit_key='partial', base_revision=0, round_id=1,
        observations=[dict(dataset_id=dataset_id, sample_id=page.sample_id, description='本轮原图外缘可辨。',
            evidence_ids=ids, directions=[dict(direction_ref=d.ref, status='applicable', reason='外缘可辨。')
                for d in context.selected_directions])],
        summary='主体外缘可沿可辨轮廓复核，其他视图尚待观察。', limitations=[], unresolved_questions=[],
        **{field:[entry]})
    commits, queries = AnalysisCommits(jobs), AnalysisQueries(jobs.db)
    for update in [dict(summary='本批4张已核对，目录三条方向均更新。'),
            {field:[{**entry, 'title':'本轮新增主体外缘'}]}]:
        with pytest.raises(ValueError, match='发现顺序'):
            commits.accept(run_id, {**submission, **update})
        assert jobs.state(run_id).revision == 0
        assert queries.observation_history(run_id, {}).total == 0
        assert jobs.jobs.status(run_id)['completed'] == 0
    receipt = commits.accept(run_id, submission)
    assert commits.accept(run_id, submission) == receipt
    from iad_core.workbench.analysis_operations import analysis_results
    live = analysis_results({'run_id':run_id}, jobs.db.db_path)
    assert live['publication'] is None
    assert live['current']['revision'] == 1
    assert live['current']['catalog']['summary'] == submission['summary']
    assert live['current']['coverage']['completed'] == 1
    assert whole in {item['evidence_id'] for item in live['current']['evidence']}
    assert jobs.jobs.status(run_id)['analysis_version_id'] is None
    if module == 'knowledge':
        assert live['current']['checks'][0]['support_count'] == 1
        assert live['current']['check_evidence']['edge']['support'][0]['image']['evidence_id'] == whole
    cancelled = jobs.cancel(run_id)
    published = AnalysisPublications(jobs.db).get(cancelled['analysis_version_id'])
    assert published.coverage.completed == 1 and published.coverage.unprocessed == 3
    assert published.catalog.summary == submission['summary']
    assert published.finalization.complete is False
    assert getattr(published.catalog, field)[0].title == entry['title']
    assert queries.observation_history(run_id, {}).items[0].description == '本轮原图外缘可辨。'
    final = analysis_results({'run_id':run_id}, jobs.db.db_path)
    assert final['publication']['version_id'] == published.version_id
    assert final['current']['revision'] == final['publication']['revision']


@pytest.mark.parametrize('migrate_existing', [False, True])
def test_commit_keys_are_scoped_to_the_round_and_saved_receipts_survive_schema_update(agent_jobs, migrate_existing):
    from iad_core.storage.analysis_schema import initialize_analysis_schema
    jobs, dataset_id, role = agent_jobs
    if migrate_existing:
        with jobs.db.connection() as connection:
            commits_sql = connection.execute("SELECT sql FROM sqlite_master WHERE name='analysis_workflow_commits'").fetchone()[0]
            observations_sql = connection.execute("SELECT sql FROM sqlite_master WHERE name='analysis_sample_observations'").fetchone()[0]
            connection.execute('DROP TABLE analysis_sample_observations')
            connection.execute('DROP TABLE analysis_workflow_commits')
            connection.execute(commits_sql.replace('PRIMARY KEY(job_id,round_id,commit_key)', 'PRIMARY KEY(job_id,commit_key)'))
            connection.execute(observations_sql)
    started = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[dataset_id],
        normal_images=[dataset_id + ':normal.png'], prompt={'text':'查看每轮全部目标。'}), agent=role)
    run_id = started['run_id']
    evidence, commits = AnalysisEvidence(jobs), AnalysisCommits(jobs)
    submissions, receipts = [], []
    for round_id in (1, 2):
        context = jobs.context(run_id)
        assert context.round.round_id == round_id
        pages = [evidence.read(run_id, {'sample_id':target.sample_id}) for target in context.round.targets]
        ids = [item.image.evidence_id for page in pages for item in page.images]
        call = NativeModelCallStart(call_id='call_' + uuid4().hex, started_at='2026-11-09T12:00:00Z', request={'fixture':'round media'})
        ModelCalls(jobs.db).start_native(run_id, call, sample_id=None, session_id=context.session_id, attempt=1)
        evidence.delivered(run_id, call.call_id, ids)
        ModelCalls(jobs.db).finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id,
            finished_at='2026-11-09T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
        submission = dict(commit_key='accepted', base_revision=context.revision, round_id=round_id,
            observations=[dict(dataset_id=dataset_id, sample_id=page.sample_id, description='本轮实际图像观察。',
                evidence_ids=[item.image.evidence_id for item in page.images]) for page in pages],
            directions=[], summary='保留本场已观察结果。', limitations=[], unresolved_questions=[])
        submissions.append(submission)
        receipts.append(commits.accept(run_id, submission))
        assert receipts[-1].completed_delta == len(pages)
        assert receipts[-1].round_complete is True
        assert commits.accept(run_id, submission) == receipts[-1]
        if round_id == 1 and migrate_existing:
            with jobs.db.connection() as connection:
                before = {table:[tuple(row) for row in connection.execute('SELECT * FROM ' + table)]
                    for table in ('analysis_workflow_commits', 'analysis_sample_observations', 'analysis_workflow_runs')}
                connection.execute('BEGIN IMMEDIATE')
                initialize_analysis_schema(connection)
                for table, rows in before.items():
                    assert [tuple(row) for row in connection.execute('SELECT * FROM ' + table)] == rows
                assert connection.execute('PRAGMA foreign_key_check').fetchall() == []
    assert set(receipts[0].observation_ids).isdisjoint(receipts[1].observation_ids)
    assert jobs.jobs.status(run_id)['completed'] == 3
    assert jobs.context(run_id).round.round_id == 3
    assert commits.accept(run_id, submissions[0]) == receipts[0]
    with pytest.raises(ValueError, match='提交键'):
        commits.accept(run_id, {**submissions[1], 'summary':'同轮同键的不同内容。'})
    jobs.cancel(run_id)
    assert commits.accept(run_id, submissions[1]) == receipts[1]
    with pytest.raises(InterruptedError, match='作业已停止'):
        commits.accept(run_id, {**submissions[1], 'commit_key':'late'})


def test_incomplete_batch_is_rejected_and_full_delivery_commit_is_idempotent(agent_jobs):
    jobs, dataset_id, role = agent_jobs
    started = jobs.start({'submission_id': str(uuid4()), 'analysis_kind': 'exploration', 'dataset_ids': [dataset_id],
        'normal_images': [dataset_id + ':dent.png'], 'prompt': {'text': '观察原图与所有标注局部。'}}, agent=role)
    run_id = started['run_id']
    evidence = AnalysisEvidence(jobs)
    media = evidence.read(run_id, {'sample_id': dataset_id + ':dent.png'})
    assert media.total > 1
    assert media.images[0].image.original_size == [320, 240]
    assert media.images[0].image.sent_size == [320, 240]
    assert media.images[0].model_context['annotations'][0]['bbox'] == [10, 10, 30, 30]
    ids = [item.image.evidence_id for item in media.images]
    submission = dict(commit_key='round-1-a', base_revision=0, round_id=1, observations=[dict(
        dataset_id=dataset_id, sample_id=dataset_id + ':dent.png', description='观察原图主体及原标注矩形。',
        evidence_ids=[ids[0]])], directions=[], summary='保留可见观察。', limitations=[], unresolved_questions=[])
    commits = AnalysisCommits(jobs)
    with pytest.raises(ValueError, match='实际模型请求'):
        commits.accept(run_id, submission)
    assert jobs.context(run_id).revision == 0
    call = NativeModelCallStart(call_id='call_' + uuid4().hex, started_at='2026-11-09T12:00:00Z', request={'fixture': 'actual attachment request'})
    ModelCalls(jobs.db).start_native(run_id, call, sample_id=None, session_id=jobs.state(run_id).session_id, attempt=1)
    evidence.delivered(run_id, call.call_id, ids[:1])
    ModelCalls(jobs.db).finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id,
        finished_at='2026-11-09T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
    with pytest.raises(ValueError, match='实际模型请求'):
        commits.accept(run_id, submission)
    assert jobs.context(run_id).revision == 0
    assert jobs.context(run_id).accepted_observations == []
    crop_call = NativeModelCallStart(call_id='call_' + uuid4().hex, started_at='2026-11-09T12:01:00Z', request={'fixture': 'remaining views'})
    ModelCalls(jobs.db).start_native(run_id, crop_call, sample_id=None, session_id=jobs.state(run_id).session_id, attempt=1)
    evidence.delivered(run_id, crop_call.call_id, ids[1:])
    ModelCalls(jobs.db).finish_native(run_id, None, NativeModelCallEnd(call_id=crop_call.call_id,
        finished_at='2026-11-09T12:01:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
    complete = commits.accept(run_id, submission)
    assert commits.accept(run_id, submission) == complete
    with pytest.raises(ValueError, match='提交键'):
        commits.accept(run_id, {**submission, 'summary': '不同内容。'})
    with pytest.raises(ValueError, match='目录版本'):
        commits.accept(run_id, {**submission, 'commit_key': 'stale'})
    assert complete.completed_delta == 1
    assert complete.round_complete is True
    assert jobs.jobs.status(run_id)['completed'] == 1
    assert jobs.context(run_id).round.round_id == 2
    assert len(complete.observation_ids) == 1


def test_another_job_cannot_borrow_media_even_for_the_same_sample(agent_jobs):
    jobs, dataset_id, role = agent_jobs
    request = {'submission_id': str(uuid4()), 'analysis_kind': 'exploration', 'dataset_ids': [dataset_id],
        'normal_images': [dataset_id + ':normal.png'], 'prompt': {'text': '寻找检查方向。'}}
    first = jobs.start(request, agent=role)
    first_media = AnalysisEvidence(jobs).read(first['run_id'], {'sample_id': dataset_id + ':normal.png'})
    jobs.cancel(first['run_id'])
    second = jobs.start({**request, 'submission_id': str(uuid4())}, agent=role)
    commit = dict(commit_key='foreign', base_revision=0, round_id=1,
        observations=[dict(dataset_id=dataset_id, sample_id=dataset_id + ':normal.png', description='实际观察。',
            evidence_ids=[first_media.images[0].image.evidence_id])], directions=[], summary='', limitations=[], unresolved_questions=[])
    with pytest.raises(ValueError, match='本场'):
        AnalysisCommits(jobs).accept(second['run_id'], commit)
    assert jobs.jobs.status(second['run_id'])['completed'] == 0


@pytest.mark.parametrize('module', ['exploration', 'knowledge'])
@pytest.mark.parametrize('delivered_count', [6, 8])
def test_eight_registrations_use_batch_delivery_for_exploration_and_observations_for_mining(agent_jobs, tmp_path, module, delivered_count):
    from PIL import Image
    from iad_core.analysis.coverage import AnalysisCoverageReader
    from iad_core.dataset.registry import DatasetImport, DatasetRegistry
    from iad_core.knowledge.instructions import default_directions
    from iad_core.workbench.analysis_manifest import AnalysisManifests
    from iad_core.workbench.module_settings import ModuleSettings

    jobs, dataset_id, role = agent_jobs
    directory = tmp_path / 'second-subset'
    directory.mkdir()
    for index in range(4):
        Image.new('RGB', (32, 24), (100 + index, 110, 120)).save(directory / f'{index}.png')
    other = DatasetRegistry(jobs.db).import_labelme(DatasetImport(format='labelme', name='第二子集',
        image_dir=str(directory), annotation_dir=str(directory)))
    dataset_ids = [dataset_id, other.dataset.id]
    ids = [record.sample.sample_id for record in AnalysisManifests(jobs.db).freeze(dataset_ids).records]
    ModuleSettings(jobs.db).save(dict(module='knowledge', expected_revision=0,
        settings=dict(model=dict(provider_id='swift-30003', model_id='fixture'), batch_size=8)))
    request = dict(submission_id=str(uuid4()), analysis_kind=module, dataset_ids=dataset_ids)
    if module == 'exploration':
        request.update(normal_images=ids, prompt={'text': '观察八条手选登记。'})
    else:
        request['mining_prompt'] = dict(objective='观察八条登记。', instruction='按已选方向逐图观察。',
            directions=[default_directions()[0].model_dump(mode='json')])
    run_id = jobs.start(request, agent=role)['run_id']
    evidence, commits = AnalysisEvidence(jobs), AnalysisCommits(jobs)
    pages = [evidence.read(run_id, {'sample_id': sid}) for sid in ids]
    context = jobs.context(run_id)
    assert len(context.round.targets) == len(pages) == 8
    assert jobs.jobs.status(run_id)['completed'] == 0

    def deliver(selected):
        delivered = [image.image.evidence_id for page in selected for image in page.images]
        call = NativeModelCallStart(call_id='call_' + uuid4().hex, started_at='2026-11-09T12:00:00Z',
            request={'fixture': 'delivery receipt boundary', 'sample_ids': [page.sample_id for page in selected]})
        ModelCalls(jobs.db).start_native(run_id, call, sample_id=None, session_id=context.session_id, attempt=1)
        evidence.delivered(run_id, call.call_id, delivered)
        ModelCalls(jobs.db).finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id,
            finished_at='2026-11-09T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))

    observations = [dict(sample_id=page.sample_id, dataset_id=page.images[0].dataset_id,
        description='已观察本登记全部必需媒体。', evidence_ids=[image.image.evidence_id for image in page.images],
        directions=[dict(direction_ref=direction.ref, status='applicable', reason='本图主体可见。')
            for direction in context.selected_directions]) for page in pages]
    submission = dict(commit_key='six', base_revision=0, round_id=1, observations=observations[:6],
        summary='当前全局已观察状态。', limitations=[], unresolved_questions=[],
        **({'directions': []} if module == 'exploration' else {'checks': []}))
    deliver(pages[:delivered_count])
    if delivered_count == 6:
        with pytest.raises(ValueError, match='实际模型请求'):
            commits.accept(run_id, {**submission, 'observations': observations})
        assert jobs.context(run_id).revision == 0
        assert AnalysisCoverageReader(jobs.db).observations(run_id) == []
    if delivered_count == 6:
        with pytest.raises(ValueError, match='实际模型请求'):
            commits.accept(run_id, submission)
        deliver(pages[6:])
    if module == 'knowledge':
        with pytest.raises(ValueError, match='全部登记'):
            commits.accept(run_id, submission)
    receipt = commits.accept(run_id, {**submission,'observations':observations if module=='knowledge' else observations[:6]})
    assert receipt.completed_delta == 8 and receipt.round_complete
    coverage = AnalysisCoverageReader(jobs.db).read(run_id)
    assert coverage.completed == coverage.whole_images_observed == 8
    assert len(AnalysisCoverageReader(jobs.db).observations(run_id)) == (8 if module=='knowledge' else 6)
    assert jobs.context(run_id).round is None
    assert commits.accept(run_id,{**submission,'observations':observations if module=='knowledge' else observations[:6]}) == receipt


@pytest.mark.parametrize('module,view', [(module, view) for module in ['exploration', 'knowledge']
    for view in ['annotation', 'mask', 'model', 'all'] if view != 'mask'])
@pytest.mark.parametrize('field',['support','counter','text'])
def test_catalog_rejects_crop_citations_atomically_and_accepts_corrected_whole_image(agent_jobs,module,field,view):
    from iad_core.knowledge.instructions import default_directions
    from iad_core.workbench.module_settings import ModuleSettings
    jobs,dataset_id,role=agent_jobs
    request=dict(submission_id=str(uuid4()),analysis_kind=module,dataset_ids=[dataset_id])
    if module=='exploration':request.update(normal_images=[dataset_id+':dent.png'],prompt={'text':'引用关键整图。'})
    else:
        ModuleSettings(jobs.db).save(dict(module='knowledge',expected_revision=0,settings=dict(model=dict(provider_id='swift-30003',model_id='fixture'),batch_size=4)))
        request['mining_prompt']=dict(objective='核对原图。',instruction='引用关键整图。',directions=[default_directions()[0].model_dump(mode='json')])
    run_id=jobs.start(request,agent=role)['run_id']
    evidence=AnalysisEvidence(jobs)
    evidence.read(run_id,{'sample_id':dataset_id+':dent.png'})
    evidence.crop(run_id,{'sample_id':dataset_id+':dent.png','bbox':[4,5,18,16]})
    page=evidence.read(run_id,{'sample_id':dataset_id+':dent.png'})
    whole=page.images[0].image.evidence_id
    bad_ids=[i.image.evidence_id for i in page.images if not i.image.is_whole_image and
        (view=='all' or (i.image.representation=='annotation_mask' if view=='mask' else i.image.representation=='raw' and i.image.source==view))]
    bad=bad_ids[0]
    ids=[i.image.evidence_id for p in (evidence.batch(run_id).registrations if module=='knowledge' else [page]) for i in p.images]
    pages=evidence.batch(run_id).registrations if module=='knowledge' else [page]
    context=jobs.context(run_id)
    call=NativeModelCallStart(call_id='call_'+uuid4().hex,started_at='2026-11-09T12:00:00Z',request={'fixture':'whole and crop delivery'})
    ModelCalls(jobs.db).start_native(run_id,call,sample_id=None,session_id=context.session_id,attempt=1)
    evidence.delivered(run_id,call.call_id,ids)
    ModelCalls(jobs.db).finish_native(run_id,None,NativeModelCallEnd(call_id=call.call_id,finished_at='2026-11-09T12:00:01Z',elapsed_ms=1000,finish_reason='tool-calls'))
    support=bad_ids if field=='support' else [whole]
    counter=bad_ids if field=='counter' else []
    item=dict(title='边缘检查',dataset_ids=[dataset_id],counter_evidence_ids=counter,limitations=[])
    if module=='exploration':item.update(direction_id='D1',instruction='比较边缘。',applies_to='both',rationale='边缘可见。',evidence_ids=support)
    else:item.update(check_id='C1',subject='主体',location='边缘',criterion='核对边缘。',allowed_variations=[],status='provisional',support_evidence_ids=support,direction_refs=['D1'])
    if field=='text':item['rationale' if module=='exploration' else 'criterion']='可见边缘'+''.join('['+eid+']' for eid in bad_ids)+'。'
    catalog_field='directions' if module=='exploration' else 'checks'
    submission=dict(commit_key='correctable',base_revision=0,round_id=1,summary='可复核结果。',limitations=[],unresolved_questions=[],
        observations=[dict(sample_id=p.sample_id,dataset_id=dataset_id,description='完整原图及局部观察。',evidence_ids=[i.image.evidence_id for i in p.images],
            directions=[dict(direction_ref='D1',status='applicable',reason='边缘可见。')] if module=='knowledge' else []) for p in pages],**{catalog_field:[item]})
    if view=='all':submission[catalog_field].append({**item,('direction_id' if module=='exploration' else 'check_id'):('D2' if module=='exploration' else 'C2')})
    commits=AnalysisCommits(jobs)
    with pytest.raises(ValueError,match='完整原图') as error:commits.accept(run_id,submission)
    assert all(eid in str(error.value) for eid in bad_ids) and whole in str(error.value)
    if view=='all':assert ('D2' if module=='exploration' else 'C2') in str(error.value)
    assert jobs.context(run_id).revision==0 and jobs.context(run_id).accepted_observations==[]
    assert jobs.jobs.status(run_id)['completed']==0
    for edited in submission[catalog_field]:
        edited['counter_evidence_ids']=[whole] if field=='counter' else []
        edited['evidence_ids' if module=='exploration' else 'support_evidence_ids']=[whole]
        if field=='text':edited['rationale' if module=='exploration' else 'criterion']='可见边缘['+whole+']。'
    receipt=commits.accept(run_id,submission)
    assert receipt.revision==1 and receipt.completed_delta==(4 if module=='knowledge' else 1)
    assert jobs.context(run_id).revision==1


@pytest.mark.parametrize('module',['exploration','knowledge'])
def test_key_support_reselection_keeps_observations_and_counterexamples(agent_jobs,module):
    from iad_core.knowledge.instructions import default_directions
    from iad_core.workbench.module_settings import ModuleSettings
    jobs,dataset_id,role=agent_jobs
    request=dict(submission_id=str(uuid4()),analysis_kind=module,dataset_ids=[dataset_id])
    if module=='exploration':request.update(normal_images=[dataset_id+':'+name+'.png' for name in ['normal','dent','scratch','normal2']],prompt={'text':'选择关键整图。'})
    else:
        ModuleSettings(jobs.db).save(dict(module='knowledge',expected_revision=0,settings=dict(model=dict(provider_id='swift-30003',model_id='fixture'),batch_size=4)))
        request['mining_prompt']=dict(objective='核对原图。',instruction='选择关键整图。',directions=[default_directions()[0].model_dump(mode='json')])
    run_id=jobs.start(request,agent=role)['run_id'];evidence=AnalysisEvidence(jobs)
    pages=evidence.batch(run_id).registrations
    call=NativeModelCallStart(call_id='call_'+uuid4().hex,started_at='2026-11-09T12:00:00Z',request={'fixture':'key whole images'})
    ModelCalls(jobs.db).start_native(run_id,call,sample_id=None,session_id=jobs.context(run_id).session_id,attempt=1)
    evidence.delivered(run_id,call.call_id,[image.image.evidence_id for page in pages for image in page.images])
    ModelCalls(jobs.db).finish_native(run_id,None,NativeModelCallEnd(call_id=call.call_id,finished_at='2026-11-09T12:00:01Z',elapsed_ms=1000,finish_reason='tool-calls'))
    whole=[page.images[0].image.evidence_id for page in pages[:2]]
    support_field='evidence_ids' if module=='exploration' else 'support_evidence_ids'
    item=dict(title='边缘检查',dataset_ids=[dataset_id],counter_evidence_ids=[whole[0]],limitations=[],**{support_field:whole})
    if module=='exploration':item.update(direction_id='D1',instruction='比较边缘。',applies_to='both',rationale='边缘可见。')
    else:item.update(check_id='C1',subject='主体',location='边缘',criterion='核对边缘。',allowed_variations=[],status='provisional',direction_refs=['D1'])
    field='directions' if module=='exploration' else 'checks'
    observation=[dict(sample_id=page.sample_id,dataset_id=dataset_id,description='完整观察。',evidence_ids=[i.image.evidence_id for i in page.images],
        directions=[dict(direction_ref='D1',status='applicable',reason='边缘可见。')] if module=='knowledge' else []) for page in pages]
    submission=dict(commit_key='all',base_revision=0,round_id=1,summary='保留观察及反例。',limitations=[],unresolved_questions=[],observations=observation,**{field:[item]})
    commits=AnalysisCommits(jobs);commits.accept(run_id,submission)
    context=jobs.context(run_id)
    commits.accept(run_id,{**submission,'commit_key':'key','base_revision':context.revision,'round_id':context.round.round_id if context.round else 1,'observations':[],
        field:[{**item,support_field:[whole[1]],'counter_evidence_ids':[], 'key_evidence':[
            dict(evidence_id=whole[1],role='support',reason='边缘可见，展示复核动作。'),
            dict(evidence_id=whole[0],role='counter',reason='保留影响解释的边界差别。')]}]})
    selected=getattr(jobs.context(run_id).catalog,field)[0]
    assert getattr(selected,support_field)==whole
    assert [key.evidence_id for key in selected.key_evidence]==[whole[1],whole[0]]
    assert selected.counter_evidence_ids==[whole[0]]
    context=jobs.context(run_id)
    receipt=commits.accept(run_id,{**submission,'commit_key':'observations-only','base_revision':context.revision,
        'round_id':context.round.round_id if context.round else 1,'observations':[],field:[],'summary':'保留已有关键证据与反例。'})
    assert receipt.completed_delta==0 and receipt.observation_ids==[]
    assert getattr(jobs.context(run_id).catalog,field)==[selected]
    assert jobs.context(run_id).catalog.summary=='保留已有关键证据与反例。'
    from iad_core.analysis.coverage import AnalysisCoverageReader
    assert len(AnalysisCoverageReader(jobs.db).observations(run_id))==len(pages)
    assert jobs.jobs.status(run_id)['completed']==len(pages)


@pytest.mark.parametrize('module',['exploration','knowledge'])
def test_existing_crop_counterexample_requires_explicit_whole_image_correction(agent_jobs,module):
    import json
    from iad_core.knowledge.instructions import default_directions
    from iad_core.workbench.module_settings import ModuleSettings
    jobs,dataset_id,role=agent_jobs
    if module=='knowledge':
        ModuleSettings(jobs.db).save(dict(module=module,expected_revision=0,settings=dict(model=dict(provider_id='swift-30003',model_id='fixture'),batch_size=2)))
    request=dict(submission_id=str(uuid4()),analysis_kind=module,dataset_ids=[dataset_id])
    if module=='exploration':request.update(normal_images=[dataset_id+':dent.png'],prompt={'text':'核对原图反例。'})
    else:request['mining_prompt']=dict(objective='核对原图反例。',instruction='保留反例来源。',directions=[default_directions()[0].model_dump(mode='json')])
    run_id=jobs.start(request,agent=role)['run_id'];evidence=AnalysisEvidence(jobs)
    page=evidence.read(run_id,{'sample_id':dataset_id+':dent.png'});ids=[item.image.evidence_id for item in page.images]
    whole=page.images[0].image.evidence_id;crop=next(item.image.evidence_id for item in page.images if not item.image.is_whole_image)
    call=NativeModelCallStart(call_id='call_'+uuid4().hex,started_at='2026-11-09T12:00:00Z',request={'fixture':'whole and crop'})
    ModelCalls(jobs.db).start_native(run_id,call,sample_id=None,session_id=jobs.context(run_id).session_id,attempt=1)
    pages=[page]+[p for p in evidence.batch(run_id).registrations if p.sample_id!=page.sample_id]
    evidence.delivered(run_id,call.call_id,[i.image.evidence_id for p in pages for i in p.images])
    ModelCalls(jobs.db).finish_native(run_id,None,NativeModelCallEnd(call_id=call.call_id,finished_at='2026-11-09T12:00:01Z',elapsed_ms=1000,finish_reason='tool-calls'))
    support='evidence_ids' if module=='exploration' else 'support_evidence_ids';field='directions' if module=='exploration' else 'checks'
    item=dict(title='边缘反例',dataset_ids=[dataset_id],counter_evidence_ids=[whole],limitations=[],**{support:[whole]})
    if module=='exploration':item.update(direction_id='D1',instruction='比较边缘。',applies_to='both',rationale='同来源存在反例。')
    else:item.update(check_id='C1',subject='主体',location='边缘',criterion='比较边缘。',allowed_variations=[],status='conflicted',direction_refs=['D1'])
    submission=dict(commit_key='observed',base_revision=0,round_id=1,summary='保留反例。',limitations=[],unresolved_questions=[],
        observations=[dict(sample_id=p.sample_id,dataset_id=dataset_id,description='已看原图与全部局部。',evidence_ids=[i.image.evidence_id for i in p.images],
            directions=[dict(direction_ref='D1',status='applicable',reason='边缘可见。')] if module=='knowledge' else []) for p in pages],**{field:[item]})
    commits=AnalysisCommits(jobs);commits.accept(run_id,submission)
    # Seed a persisted crop counterexample with complete original observations.
    catalog=jobs.context(run_id).catalog.model_dump(mode='json');catalog[field][0]['counter_evidence_ids']=[crop]
    catalog[field][0][support]=[crop]
    text_field='rationale' if module=='exploration' else 'criterion'
    catalog[field][0][text_field]='边缘可见['+crop+']。'
    with jobs.db.connection() as connection:
        connection.execute('DELETE FROM analysis_claim_revisions WHERE job_id=?',(run_id,))
        connection.execute('UPDATE analysis_workflow_runs SET catalog_json=? WHERE job_id=?',(json.dumps(catalog),run_id))
    context=jobs.context(run_id)
    if context.round:
        batch = evidence.batch(run_id)
        call = NativeModelCallStart(call_id='call_'+uuid4().hex,started_at='2026-11-09T12:01:00Z',request={})
        ModelCalls(jobs.db).start_native(run_id,call,sample_id=None,session_id=context.session_id,attempt=1)
        evidence.delivered(run_id,call.call_id,[item.image.evidence_id for page in batch.registrations for item in page.images])
        ModelCalls(jobs.db).finish_native(run_id,None,NativeModelCallEnd(call_id=call.call_id,
            finished_at='2026-11-09T12:01:01Z',elapsed_ms=1000,finish_reason='tool-calls'))
    update={**submission,'commit_key':'correct-counter','base_revision':context.revision,'round_id':context.round.round_id,'observations':[],field:[]}
    if module=='knowledge':
        update['observations']=[dict(sample_id=p.sample_id,dataset_id=dataset_id,description='原图主体可见。',evidence_ids=[i.image.evidence_id for i in p.images],
            directions=[dict(direction_ref='D1',status='applicable',reason='主体可核对。')]) for p in batch.registrations]
    with pytest.raises(ValueError,match='完整原图') as error:commits.accept(run_id,update)
    assert crop in str(error.value) and whole in str(error.value)
    assert jobs.context(run_id).revision==context.revision
    update['citation_corrections']=[dict(entry_id='D1' if module=='exploration' else 'C1',evidence_id=crop,whole_image_id=crop)]
    with pytest.raises(ValueError,match='完整原图'):commits.accept(run_id,update)
    assert jobs.context(run_id).revision==context.revision
    update['citation_corrections']=[dict(entry_id='D1' if module=='exploration' else 'C1',evidence_id=crop,whole_image_id=whole)]
    target=next(target for target in context.round.targets if target.sample_id not in context.completed_sample_ids)
    next_page=evidence.read(run_id,{'sample_id':target.sample_id})
    next_ids=[item.image.evidence_id for item in next_page.images]
    next_call=NativeModelCallStart(call_id='call_'+uuid4().hex,started_at='2026-11-09T12:01:00Z',request={'fixture':'next registration'})
    ModelCalls(jobs.db).start_native(run_id,next_call,sample_id=None,session_id=context.session_id,attempt=1)
    evidence.delivered(run_id,next_call.call_id,next_ids)
    ModelCalls(jobs.db).finish_native(run_id,None,NativeModelCallEnd(call_id=next_call.call_id,finished_at='2026-11-09T12:01:01Z',elapsed_ms=1000,finish_reason='tool-calls'))
    update['observations']=[dict(sample_id=p.sample_id,dataset_id=dataset_id,description='新登记的完整实际观察。',evidence_ids=[i.image.evidence_id for i in p.images],
        directions=[dict(direction_ref='D1',status='applicable',reason='主体可见。')] if module=='knowledge' else []) for p in (batch.registrations if module=='knowledge' else [next_page])]
    commits.accept(run_id,update)
    corrected=getattr(jobs.context(run_id).catalog,field)[0]
    assert corrected.counter_evidence_ids==[whole]
    assert getattr(corrected,support)==[whole]
    assert getattr(corrected,text_field)=='边缘可见['+whole+']。'
    assert corrected.title=='边缘反例'
    assert commits.accept(run_id,update).revision==context.revision+1
    assert jobs.jobs.status(run_id)['completed']==(3 if module=='exploration' else 4)
    from iad_core.analysis.coverage import AnalysisCoverageReader
    assert AnalysisCoverageReader(jobs.db).observations(run_id)[0].evidence_ids==ids
