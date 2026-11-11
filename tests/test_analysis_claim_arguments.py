from pathlib import Path

import pytest

from iad_core.analysis.commits import AnalysisCommits


@pytest.mark.parametrize('counter_state',['not_applicable','uncertain'])
def test_inapplicable_and_unobservable_direction_observations_are_not_counterexamples(agent_jobs, counter_state):
    from uuid import uuid4
    from iad_core.analysis.evidence import AnalysisEvidence
    from iad_core.analysis.finalization import AnalysisFinalizations
    from iad_core.analysis.queries import AnalysisQueries
    from iad_core.knowledge.instructions import default_directions
    from iad_core.workbench.calls import ModelCalls, NativeModelCallStart, NativeModelCallEnd
    from iad_core.workbench.module_settings import ModuleSettings
    jobs, dataset_id, role = agent_jobs
    ModuleSettings(jobs.db).save(dict(module='knowledge',expected_revision=0,
        settings=dict(model=dict(provider_id='swift-30003',model_id='fixture'),batch_size=4)))
    run_id = jobs.start(dict(submission_id=str(uuid4()),analysis_kind='knowledge',dataset_ids=[dataset_id],
        mining_prompt=dict(objective='核对限定视图中的外缘。',instruction='逐登记记录可见性与适用条件。',
            directions=[default_directions()[0].model_dump(mode='json')])),agent=role)['run_id']
    context = jobs.context(run_id)
    pages = [AnalysisEvidence(jobs).read(run_id,dict(sample_id=target.sample_id)) for target in context.round.targets]
    call = NativeModelCallStart(call_id='call_'+uuid4().hex,started_at='2026-11-09T12:00:00Z',request={'fixture':'explicit applicability observations'})
    ModelCalls(jobs.db).start_native(run_id,call,sample_id=None,session_id=context.session_id,attempt=1)
    AnalysisEvidence(jobs).delivered(run_id,call.call_id,[item.image.evidence_id for page in pages for item in page.images])
    ModelCalls(jobs.db).finish_native(run_id,None,NativeModelCallEnd(call_id=call.call_id,
        finished_at='2026-11-09T12:00:01Z',elapsed_ms=1000,finish_reason='tool-calls'))
    whole_ids = [next(item.image.evidence_id for item in page.images if item.image.is_whole_image) for page in pages]
    states = ['applicable','not_applicable','uncertain','applicable']
    reasons = ['目标区可核对，未见判据关注的变化。','目标结构不属于该方向。','目标区无法充分辨认。','亮度变化下仍可核对目标。']
    check = dict(check_id='edge',title='限定视图的外缘',subject='主体',location='外缘',criterion='外缘可辨时，沿边缘比较连续关系。',
        allowed_variations=['亮度变化下外缘仍可辨'],limitations=['仅在外缘可辨视图内使用'],status='conflicted',
        support_evidence_ids=[whole_ids[0]],counter_evidence_ids=[whole_ids[states.index(counter_state)]],
        dataset_ids=[dataset_id],direction_refs=['D1'])
    submission = dict(commit_key='visibility',base_revision=0,round_id=1,checks=[check],
        observations=[dict(sample_id=page.sample_id,dataset_id=dataset_id,description=reasons[index],
            evidence_ids=[item.image.evidence_id for item in page.images],
            directions=[dict(direction_ref='D1',status=states[index],reason=reasons[index])]) for index,page in enumerate(pages)],
        summary='保留可核对、结构不适用和可见性不足的区别。',limitations=[],unresolved_questions=[])
    with pytest.raises(ValueError,match='反例.*适用'):
        AnalysisCommits(jobs).accept(run_id,submission)
    assert jobs.state(run_id).revision == 0
    assert jobs.jobs.status(run_id)['completed'] == 0
    assert AnalysisQueries(jobs.db).observation_history(run_id,{}).total == 0
    check.update(status='provisional',counter_evidence_ids=[],key_evidence=[dict(evidence_id=whole_ids[0],role='support',reason='外缘可直接复查。')])
    submission['arguments'] = [dict(entry_id='edge',evidence_id=whole_ids[index],role='context',reason=reasons[index]) for index in [1,2]]
    submission['arguments'].append(dict(entry_id='edge',evidence_id=whole_ids[3],role='allowed_variation',reason=reasons[3]))
    AnalysisCommits(jobs).accept(run_id,submission)
    saved = jobs.state(run_id).catalog.checks[0]
    assert saved.status == 'provisional' and saved.counter_evidence_ids == []
    assert saved.independent_source_count == 1
    assert AnalysisQueries(jobs.db).arguments(run_id,dict(entry_id='edge',role='context')).total == 2
    assert AnalysisQueries(jobs.db).arguments(run_id,dict(entry_id='edge',role='allowed_variation')).total == 1
    finalized = AnalysisFinalizations(jobs).context(run_id)
    assert finalized.coverage.completed == 4
    direction, = finalized.directions
    assert (direction.applicable,direction.not_applicable,direction.uncertain,direction.failed) == (2,1,1,0)


def test_omitting_prior_support_does_not_reduce_a_claims_independent_sources(observed_claim):
    jobs, run_id, submission, whole_ids = observed_claim
    commits = AnalysisCommits(jobs)
    check = submission['checks'][0]
    complete = jobs.context(run_id).catalog.checks[0]
    assert jobs.jobs.status(run_id)['completed'] == 4
    assert complete.independent_source_count == 3
    assert complete.status == 'supported'
    context = jobs.context(run_id)
    commits.accept(run_id, {**submission, 'commit_key':'select-representative', 'base_revision':context.revision,
        'observations':[], 'checks':[{**check, 'title':'沿主体外缘复核连续关系', 'support_evidence_ids':[whole_ids[0]],
            'key_evidence':[dict(evidence_id=whole_ids[0],role='support',reason='外缘完整可辨，可复核连续关系。')]}]})
    revised = jobs.context(run_id).catalog.checks[0]
    assert revised.independent_source_count == 3
    assert revised.status == 'supported'
    assert revised.suggested_status == 'supported'
    assert '3个独立图像来源组' in revised.assessment_reason
    assert set(revised.support_evidence_ids) == set(whole_ids)
    from iad_core.analysis.publications import AnalysisPublications
    from iad_core.analysis.queries import AnalysisQueries
    from iad_core.knowledge.models import KnowledgeDetailQuery
    jobs.jobs.finish_external(run_id)
    published = AnalysisPublications(jobs.db).publish(run_id)
    queries = AnalysisQueries(jobs.db)
    details = queries.details(KnowledgeDetailQuery(version_id=published.version_id, section='checks',
        check_id='edge', evidence_role='support'))
    assert details.total == 1
    assert [item.image.evidence_id for item in details.items] == [whole_ids[0]]
    assert details.check.support_count == 4
    assert set(details.support_evidence_ids) == set(whole_ids)


def test_counterexample_resolution_keeps_observation_and_revision_history(observed_claim):
    from iad_core.analysis.queries import AnalysisQueries
    jobs, run_id, submission, whole_ids = observed_claim
    commits, queries = AnalysisCommits(jobs), AnalysisQueries(jobs.db)
    check = submission['checks'][0]
    current = jobs.context(run_id)
    counter = dict(entry_id='edge', evidence_id=whole_ids[-1], role='counter',
        reason='该原图内缘存在暗色间断，需核对是否反驳连续性。')
    update = {**submission, 'commit_key':'counter', 'base_revision':current.revision, 'observations':[],
        'checks':[{**check, 'status':'provisional'}], 'arguments':[counter]}
    receipt = commits.accept(run_id, update)
    conflicted = jobs.context(run_id).catalog.checks[0]
    assert conflicted.suggested_status == 'provisional'
    assert conflicted.status == 'conflicted'
    assert conflicted.counter_evidence_ids == [whole_ids[-1]]
    active = queries.arguments(run_id, dict(entry_id='edge', role='counter'))
    assert active.total == 1 and active.items[0].reason == counter['reason']
    prior = active.items[0]
    observed = queries.observation_history(run_id, {}).items
    assert any(item.observation_id == prior.observation_id and whole_ids[-1] in item.evidence_ids for item in observed)
    resolved = {**update, 'commit_key':'explained', 'base_revision':receipt.revision,
        'checks':[{**check, 'status':'supported'}],
        'arguments':[{**counter, 'state':'resolved', 'reason':'重读完整外缘可见连续，暗带位于内缘，未截断该判据限定的外轮廓。'}]}
    commits.accept(run_id, resolved)
    assert jobs.context(run_id).catalog.checks[0].status == 'supported'
    assert jobs.context(run_id).catalog.checks[0].counter_evidence_ids == []
    assert queries.arguments(run_id, dict(entry_id='edge', role='counter', state='active')).total == 0
    history = queries.arguments(run_id, dict(entry_id='edge', role='counter', history=True))
    assert [item.state for item in history.items] == ['active', 'resolved']
    assert len({item.observation_id for item in history.items}) == 1
    before = queries.arguments(run_id, dict(entry_id='edge', role='counter', revision=receipt.revision))
    assert before.items == [prior]
    assert commits.accept(run_id, resolved).revision == receipt.revision + 1
    assert queries.arguments(run_id, dict(entry_id='edge', role='counter', history=True)).total == 2


@pytest.mark.parametrize('scope_field',['criterion','limitations'])
def test_claim_scope_revision_requires_review_and_preserves_previous_claim(observed_claim, scope_field):
    import json
    from iad_core.analysis.queries import AnalysisQueries
    jobs, run_id, submission, whole_ids = observed_claim
    commits, queries = AnalysisCommits(jobs), AnalysisQueries(jobs.db)
    original = queries.claim_history(run_id, 'edge')
    assert len(original.items) == 1
    assert original.items[0].content.criterion == submission['checks'][0]['criterion']
    context = jobs.context(run_id)
    check = {**submission['checks'][0], scope_field:('仅当外缘无暗区遮挡时，沿外缘核对连续关系。'
        if scope_field == 'criterion' else ['仅适用于外缘无暗区遮挡的视图。'])}
    update = {**submission, 'commit_key':'narrow', 'base_revision':context.revision,
        'observations':[], 'checks':[check]}
    with pytest.raises(ValueError, match='change_reason') as failed:
        commits.accept(run_id, update)
    correction = json.loads(str(failed.value).partition('\n')[2])
    assert correction['entry_id'] == 'edge'
    assert correction['changed_fields'] == [scope_field]
    assert correction['requires_change_reason'] is True
    assert [(item['evidence_id'],item['role']) for item in correction['missing_argument_reviews']] == [
        (eid,'support') for eid in whole_ids]
    assert all(item['observation_id'] for item in correction['missing_argument_reviews'])
    check['change_reason'] = '遮挡下外缘不可辨，限定为外缘清晰可见。'
    with pytest.raises(ValueError, match='复核全部') as failed:
        commits.accept(run_id, update)
    assert json.loads(str(failed.value).partition('\n')[2])['requires_change_reason'] is False
    assert jobs.context(run_id) == context
    assert queries.claim_history(run_id, 'edge') == original
    update['arguments'] = [dict(entry_id='edge', evidence_id=eid, role='support',
        state='out_of_scope' if eid == whole_ids[0] else 'active',
        reason='该登记不满足无暗区遮挡前提。' if eid == whole_ids[0] else '外缘可辨，支持限定条件内的比较动作。') for eid in whole_ids]
    receipt = commits.accept(run_id, update)
    assert receipt.completed_delta == 0
    revised = jobs.context(run_id).catalog.checks[0]
    assert set(revised.support_evidence_ids) == set(whole_ids[1:])
    history = queries.claim_history(run_id, 'edge')
    assert [item.claim_revision for item in history.items] == [1, 2]
    assert history.items[1].reason == check['change_reason']
    assert history.items[0] == original.items[0]
    arguments = queries.arguments(run_id, dict(entry_id='edge', history=True, limit=3))
    assert arguments.total == 8 and arguments.next_offset == 3
    remaining = queries.arguments(run_id, dict(entry_id='edge', history=True, offset=arguments.next_offset))
    assert len(remaining.items) == 5
    assert {item.claim_revision for item in remaining.items} == {1, 2}


def test_history_filters_by_claim_and_controls_do_not_become_counterexamples(observed_claim):
    from iad_core.analysis.queries import AnalysisQueries
    jobs, run_id, submission, whole_ids = observed_claim
    commits, queries = AnalysisCommits(jobs), AnalysisQueries(jobs.db)
    context = jobs.context(run_id)
    second = {**submission['checks'][0], 'check_id':'inner', 'title':'内缘亮暗', 'status':'provisional',
        'support_evidence_ids':[whole_ids[0]]}
    commits.accept(run_id, {**submission, 'commit_key':'separate-claim', 'base_revision':context.revision,
        'observations':[], 'checks':[second], 'arguments':[
            dict(entry_id='edge', evidence_id=whole_ids[1], role='context', reason='保留外缘可辨的正常对照，不推翻连续性。'),
            dict(entry_id='inner', evidence_id=whole_ids[0], role='support', reason='内缘亮暗差别在该登记清楚可见。')]})
    checks = {check.check_id:check for check in jobs.context(run_id).catalog.checks}
    assert checks['edge'].status == 'supported' and checks['edge'].counter_evidence_ids == []
    history = queries.observation_history(run_id, dict(entry_id='inner', evidence_role='support'))
    assert history.total == 1
    assert whole_ids[0] in history.items[0].evidence_ids
    assert queries.observation_history(run_id, dict(direction_ref='D1')).total == 4
    context = jobs.context(run_id)
    AnalysisCommits(jobs).accept(run_id, {**submission, 'commit_key':'key-control', 'base_revision':context.revision,
        'observations':[], 'checks':[{**submission['checks'][0], 'key_evidence':[
            dict(evidence_id=whole_ids[1], role='context', reason='展示与连续轮廓相容的正常对照。')]}]})
    assert jobs.context(run_id).catalog.checks[0].independent_source_count == 3
    from iad_core.knowledge.models import KnowledgeDetailQuery
    version = jobs.cancel(run_id)['analysis_version_id']
    detail = queries.details(KnowledgeDetailQuery(version_id=version, section='checks', check_id='edge', evidence_role='support'))
    assert detail.total == 1 and detail.items[0].image.evidence_id == whole_ids[1]


def test_key_evidence_rejects_duplicate_pixels_without_dropping_complete_sources(observed_claim):
    from iad_core.analysis.queries import AnalysisQueries
    jobs, run_id, submission, whole_ids = observed_claim
    queries = AnalysisQueries(jobs.db)
    observed = queries.observation_history(run_id, {}).items
    duplicate_wholes = [next(eid for eid in item.evidence_ids if eid in whole_ids) for item in observed
        if item.sample_id.endswith((':dent.png', ':scratch.png'))]
    assert len(duplicate_wholes) == 2
    context = jobs.context(run_id)
    update = {**submission, 'commit_key':'duplicate-keys', 'base_revision':context.revision,
        'observations':[], 'checks':[{**submission['checks'][0], 'key_evidence':[
            dict(evidence_id=eid, role='support', reason='复核相同外缘的连续关系。') for eid in duplicate_wholes]}]}
    with pytest.raises(ValueError, match='同像素'):
        AnalysisCommits(jobs).accept(run_id, update)
    assert jobs.context(run_id) == context
    assert queries.arguments(run_id, dict(entry_id='edge', role='support')).total == 4


@pytest.mark.parametrize('observed_claim', [3], indirect=True)
def test_version_export_keeps_its_complete_arguments_after_job_resume(observed_claim, tmp_path):
    import json
    import zipfile
    from iad_core.analysis.exports import AnalysisExports
    from iad_core.analysis.publications import AnalysisPublications
    from iad_core.analysis.queries import AnalysisQueries
    jobs, run_id, submission, whole_ids = observed_claim
    version_id = jobs.cancel(run_id)['analysis_version_id']
    publication = AnalysisPublications(jobs.db).get(version_id)
    assert publication.coverage.completed == 3 and publication.coverage.unprocessed == 1
    jobs.resume(run_id)
    context = jobs.context(run_id)
    from iad_core.analysis.evidence import AnalysisEvidence
    from iad_core.workbench.calls import ModelCalls,NativeModelCallStart,NativeModelCallEnd
    from uuid import uuid4
    pages=AnalysisEvidence(jobs).batch(run_id).registrations
    call=NativeModelCallStart(call_id='call_'+uuid4().hex,started_at='2026-11-10T12:00:00Z',request={})
    ModelCalls(jobs.db).start_native(run_id,call,sample_id=None,session_id=context.session_id,attempt=1)
    AnalysisEvidence(jobs).delivered(run_id,call.call_id,[item.image.evidence_id for page in pages for item in page.images])
    ModelCalls(jobs.db).finish_native(run_id,None,NativeModelCallEnd(call_id=call.call_id,
        finished_at='2026-11-10T12:00:01Z',elapsed_ms=1000,finish_reason='tool-calls'))
    observations=[dict(sample_id=page.sample_id,dataset_id=page.images[0].dataset_id,description='可见主体结构。',evidence_ids=[page.evidence_id],
        directions=[dict(direction_ref='D1',status='applicable',reason='目标结构可核对。')]) for page in pages]
    AnalysisCommits(jobs).accept(run_id, {**submission, 'commit_key':'after-publication',
        'base_revision':context.revision, 'round_id':context.round.round_id, 'observations':observations, 'checks':[],
        'arguments':[dict(entry_id='edge', evidence_id=whole_ids[0], role='counter', reason='新核对的反例仍待解释。')]})
    assert AnalysisQueries(jobs.db).arguments(run_id, dict(entry_id='edge', role='counter')).total == 1
    exported = AnalysisExports(jobs.db).create(version_id, str(tmp_path / 'export'),
        '{"type":"session"}\n{"type":"fixture","purpose":"frozen version export"}\n')
    with zipfile.ZipFile(exported.path) as archive:
        arguments = [json.loads(line) for line in archive.read('arguments.jsonl').decode().splitlines()]
        claims = [json.loads(line) for line in archive.read('claims.jsonl').decode().splitlines()]
        frozen = json.loads(archive.read('knowledge.json'))
    assert len(arguments) == 3
    assert {item['role'] for item in arguments} == {'support'}
    assert {item['evidence_id'] for item in arguments} == set(whole_ids)
    assert all(item['revision'] <= publication.revision for item in arguments)
    assert len(claims) == 1 and claims[0]['content']['criterion'] == submission['checks'][0]['criterion']
    assert frozen['catalog']['checks'][0]['counter_evidence_ids'] == []
    assert AnalysisPublications(jobs.db).get(version_id) == publication
    original_archive = Path(exported.path).read_bytes()
    resumed_version = jobs.cancel(run_id)['analysis_version_id']
    resumed_trace = '{"type":"session"}\n{"type":"fixture","purpose":"frozen version export"}\n{"type":"fixture","purpose":"resumed counterexample"}\n'
    resumed_export = AnalysisExports(jobs.db).create(resumed_version, str(tmp_path / 'export'), resumed_trace)
    with zipfile.ZipFile(resumed_export.path) as archive:
        assert archive.read('session/events.jsonl').decode() == resumed_trace
        resumed_arguments = [json.loads(line) for line in archive.read('arguments.jsonl').decode().splitlines()]
    assert any(item['role'] == 'counter' for item in resumed_arguments)
    assert Path(exported.path).read_bytes() == original_archive


def test_explained_support_is_not_counted_for_the_current_claim(observed_claim):
    from iad_core.analysis.queries import AnalysisQueries
    jobs, run_id, submission, whole_ids = observed_claim
    context = jobs.context(run_id)
    AnalysisCommits(jobs).accept(run_id, {**submission, 'commit_key':'all-out-of-scope', 'base_revision':context.revision,
        'observations':[], 'checks':[], 'arguments':[dict(entry_id='edge', evidence_id=eid, role='support',
            state='out_of_scope', reason='重读显示该登记的目标轮廓被遮挡，不能支持当前连续性主张。') for eid in whole_ids]})
    check = jobs.context(run_id).catalog.checks[0]
    assert check.suggested_status == 'supported'
    assert check.status == 'provisional' and check.independent_source_count == 0
    assert check.support_evidence_ids == []
    assert check.assessment_reason
    arguments = AnalysisQueries(jobs.db).arguments(run_id, dict(entry_id='edge', state='out_of_scope'))
    assert arguments.total == 4
    assert jobs.jobs.status(run_id)['completed'] == 4


def test_merging_a_new_claim_retains_its_explicit_counterargument_and_origin(observed_claim):
    from iad_core.analysis.queries import AnalysisQueries
    jobs, run_id, submission, whole_ids = observed_claim
    queries = AnalysisQueries(jobs.db)
    context = jobs.context(run_id)
    source = {**submission['checks'][0], 'check_id':'inner', 'title':'内缘暗带与轮廓',
        'criterion':'内缘暗带可辨时，复核它是否截断外侧轮廓。',
        'allowed_variations':['内缘亮暗变化但外轮廓仍连续'],
        'support_evidence_ids':[whole_ids[0]], 'counter_evidence_ids':[whole_ids[-1]], 'status':'conflicted'}
    merged = {**submission, 'commit_key':'merge-new-claim', 'base_revision':context.revision,
        'observations':[], 'checks':[source],
        'merges':[dict(target_id='edge',source_ids=['inner'],reason='内缘暗带与外轮廓需要沿同一边界联合核对。')],
        'arguments':[
            *[dict(entry_id='edge',evidence_id=eid,role='support',reason='外轮廓仍可辨，支持联合比较。') for eid in whole_ids],
            dict(entry_id='inner',evidence_id=whole_ids[-1],role='counter',reason='暗带存在间断，需复核是否截断轮廓。')]}
    receipt = AnalysisCommits(jobs).accept(run_id, merged)
    check, = jobs.context(run_id).catalog.checks
    assert check.check_id == 'edge'
    assert check.status == 'conflicted'
    assert check.predecessor_check_ids == ['inner']
    assert check.allowed_variations == ['内缘亮暗变化但外轮廓仍连续']
    counter, = queries.arguments(run_id, dict(entry_id='edge',role='counter',state='active')).items
    assert counter.origin_entry_id == 'inner'
    assert counter.reason == '暗带存在间断，需复核是否截断轮廓。'
    source_counter, = queries.arguments(run_id, dict(entry_id='inner',role='counter',state='active')).items
    assert counter.observation_id == source_counter.observation_id
    assert queries.claim_history(run_id,'inner').items[0].content.criterion == source['criterion']
    assert queries.arguments(run_id,dict(entry_id='edge',revision=context.revision,role='counter')).total == 0
    assert AnalysisCommits(jobs).accept(run_id, merged) == receipt
    assert jobs.jobs.status(run_id)['completed'] == 4
