import json
import shutil

import httpx
import pytest

from iad_core.dataset.registry import DatasetImport
from iad_core.entry import knowledge_versions
from iad_core.knowledge.query import KnowledgeReader
from iad_core.storage.database import Database
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient
from tests.knowledge_scenarios import frozen_observation_response


def test_untyped_mining_covers_every_registered_image_and_publishes_one_head(dataset, tmp_path):
    db, registry, first = dataset
    shutil.copytree(tmp_path/'images', tmp_path/'second-images')
    shutil.copytree(tmp_path/'labels', tmp_path/'second-labels')
    second = registry.import_labelme(DatasetImport(format='labelme', name='第二子集',
        image_dir=str(tmp_path/'second-images'), annotation_dir=str(tmp_path/'second-labels')))
    prompt = dict(objective='联合观察结构及外观变化', instruction='只根据本次真实图像归纳可观察规律、差异与反例。',
        directions=[dict(direction_id='shape', title='结构变化', instruction='比较对应部件的实际变化')])
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        body = json.loads(request.content)
        calls.append(body)
        assert body['messages'][0]['content'][0]['text'].startswith(prompt['instruction'])
        observation = frozen_observation_response(request)
        if observation is not None:
            return observation
        parts = body['messages'][0]['content']
        refs = [json.loads(part['text'][5:])['evidence_id'] for part in parts
            if part['type'] == 'text' and part['text'].startswith('视觉证据：')
            and json.loads(part['text'][5:])['representation'] == 'raw']
        result = dict(summary='保留结构变化与相反证据', checks=[dict(title='结构外观', subject='主体', location='可见区域',
            criterion='对应结构具有可见轮廓', allowed_variations=[], support_evidence_ids=refs,
            counter_evidence_ids=[], limitations=[], status='supported')], suspects=[], limitations=[])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        submission = dict(analysis_kind='knowledge', dataset_ids=[first.dataset.id, second.dataset.id],
            batch_size=3, mining_prompt=prompt)
        job = runtime.models.analysis_workflows.start(submission)
        runtime.jobs.wait(job['run_id'], 10)
        final = runtime.models.analysis_workflows.status(job['run_id'])
        assert final['status'] == 'COMPLETED', final['errors']
        assert final['completed'] == final['total_samples'] == 8
        for result in final['dataset_results']:
            catalog = knowledge_versions(dict(dataset_id=result['dataset_id']), db.db_path)
            assert catalog['current_version_id'] == result['knowledge_version_id']
            assert 'current_version_ids' not in catalog
            current = KnowledgeReader(db).read(dataset_id=result['dataset_id']).knowledge
            assert current.version_id == result['knowledge_version_id']
            assert len(current.sources) == 4
            assert len(current.observed_source_ids) == 4
            assert current.comparison_sources == []
            assert current.mining_prompt.instruction == prompt['instruction']
        assert calls
        assert all('"phase": "learning"' in call['messages'][0]['content'][0]['text']
            for call in calls if call['response_format']['json_schema']['name'] == 'KnowledgeDraft')
    finally:
        runtime.close()


def test_unified_storage_keeps_legacy_snapshots_exact_and_requires_a_new_current_version(dataset):
    from iad_core.knowledge.models import KnowledgeSnapshot
    db, _, config = dataset
    snapshots = []
    for kind in ('normal', 'defect'):
        snapshots.append(KnowledgeSnapshot(version_id='legacy-'+kind, dataset_id=config.dataset.id, kind=kind,
            parent_version_id=None, normal_version_id='legacy-normal' if kind=='defect' else None,
            model_name='historical-model', generation_version='dataset-knowledge-v39', signature=kind,
            summary='历史观察', checks=[], suspects=[], limitations=[], sources=[], evidence=[], mining_steps=[],
            created_at='2026-11-01T00:00:00+00:00').model_dump_json())
    with db.connection() as connection:
        connection.execute('DROP TABLE knowledge_heads')
        connection.execute('DROP TABLE knowledge_versions')
        connection.execute("""CREATE TABLE knowledge_versions (
            version_id TEXT PRIMARY KEY, dataset_id TEXT NOT NULL REFERENCES datasets(dataset_id),
            kind TEXT NOT NULL CHECK(kind IN ('normal','defect')),
            parent_version_id TEXT REFERENCES knowledge_versions(version_id),
            normal_version_id TEXT REFERENCES knowledge_versions(version_id),
            signature TEXT NOT NULL,snapshot_json TEXT NOT NULL,created_at TEXT NOT NULL)""")
        connection.execute('CREATE INDEX idx_knowledge_dataset_kind ON knowledge_versions(dataset_id,kind,created_at)')
        connection.execute("""CREATE TABLE knowledge_heads (dataset_id TEXT NOT NULL REFERENCES datasets(dataset_id),
            kind TEXT NOT NULL CHECK(kind IN ('normal','defect')),version_id TEXT NOT NULL REFERENCES knowledge_versions(version_id),
            PRIMARY KEY(dataset_id,kind))""")
        for raw in snapshots:
            value = json.loads(raw)
            connection.execute('INSERT INTO knowledge_versions VALUES(?,?,?,?,?,?,?,?)',
                (value['version_id'],value['dataset_id'],value['kind'],None,value['normal_version_id'],value['signature'],raw,value['created_at']))
            connection.execute('INSERT INTO knowledge_heads VALUES(?,?,?)', (config.dataset.id,value['kind'],value['version_id']))
    migrated = Database(db.db_path)
    catalog = knowledge_versions(dict(dataset_id=config.dataset.id), db.db_path)
    assert catalog['current_version_id'] is None, '旧类型结果不能自动冒充统一知识'
    assert {version['version_id'] for version in catalog['versions']} == {'legacy-normal', 'legacy-defect'}
    for raw in snapshots:
        version_id = json.loads(raw)['version_id']
        historical = KnowledgeReader(migrated).read(version_id=version_id).knowledge
        assert historical.model_dump_json() == raw
    with migrated.connection() as connection:
        assert connection.execute('PRAGMA foreign_key_check').fetchall() == []
        assert [row[0] for row in connection.execute('SELECT snapshot_json FROM knowledge_versions ORDER BY rowid')] == snapshots


def test_unified_source_context_uses_the_same_latest_human_review_as_the_public_reader(dataset):
    from iad_core.knowledge.sources import KnowledgeSources
    from iad_core.storage.models import ReviewDecisionRecord
    from iad_core.storage.review_repository import ReviewRepository
    db, _, config = dataset
    sample_id = config.dataset.id+':normal.png'
    reviews = ReviewRepository(db)
    for reviewer, decision, timestamp in [('z-old', 'PASS', '2026-11-01T00:00:00+00:00'),
        ('a-new', 'FAIL', '2026-11-02T00:00:00+00:00')]:
        reviews.append_decision(ReviewDecisionRecord(sample_id=sample_id, reviewer=reviewer, decision=decision, submitted_at=timestamp))
    assert reviews.get_decision(sample_id).decision == 'FAIL'
    assert KnowledgeSources(db).registered(config.dataset.id).qualifications[sample_id] == 'human_fail'


@pytest.mark.parametrize('corrected', [True, False])
def test_model_corrects_missing_support_and_conclusion_references_once(knowledge_dataset, self_discovery_prompt, corrected):
    db, config = knowledge_dataset
    generations = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count':1000,'max_model_len':262144})
        body = json.loads(request.content)
        generations.append(body)
        references = [json.loads(part['text'][5:])['evidence_id'] for part in body['messages'][0]['content']
            if part['type']=='text' and part['text'].startswith('视觉证据：')]
        invalid = len(generations)==1 or not corrected
        result = dict(summary='可见轮廓'+(references[0] if invalid else ''), checks=[dict(title='主体轮廓', subject='主体',
            location='可见区域',criterion='具有连续外轮廓',allowed_variations=[],limitations=[],status='supported',
            support_evidence_ids=[] if invalid else references,counter_evidence_ids=[])], suspects=[], limitations=[])
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.knowledge.start(request=dict(images=[config.dataset.id+':part-0.png',config.dataset.id+':part-1.png'],image_count=2),
            mining_prompt=self_discovery_prompt)
        runtime.jobs.wait(job['run_id'],5)
        final = runtime.jobs.status(job['run_id'])
        assert len(generations)==2, '混合的可纠正错误也必须进入一次模型纠正'
        feedback = json.loads(generations[1]['messages'][0]['content'][0]['text'].split('输出校验结果：',1)[1])
        assert {issue['type'] for issue in feedback['schema_validation_errors']} == {'evidence_in_conclusion','knowledge_support_evidence'}
        assert final['status']==('COMPLETED' if corrected else 'FAILED'), final['errors']
        if corrected:
            snapshot = KnowledgeReader(db).read(version_id=final['knowledge_version_id']).knowledge
            assert snapshot.summary=='可见轮廓' and snapshot.checks[0].support_evidence_ids
    finally:
        runtime.close()


@pytest.mark.parametrize('reference_case', ['valid','corrected','invalid','foreign'])
@pytest.mark.parametrize('finding_status', ['supported', 'refuted'])
def test_verified_suspects_are_reconsidered_visually_without_assuming_criterion_polarity(knowledge_dataset, self_discovery_prompt, finding_status, reference_case):
    db, config = knowledge_dataset
    learning_calls = []
    verification_calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        body = json.loads(request.content)
        content = body['messages'][0]['content']
        prompt = content[0]['text']
        views = [json.loads(part['text'][5:]) for part in content
            if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        if body['response_format']['json_schema']['name'] == 'KnowledgeVerification':
            verification_calls.append(body)
            roi = next(view for view in views if view['role'] == 'roi')
            comparison = next(view for view in views if view['source_sha256'] != roi['source_sha256'])
            bad=reference_case in ('invalid','foreign') or reference_case=='corrected' and len(verification_calls)==1
            if len(verification_calls)==2:
                feedback=json.loads(prompt.split('输出校验结果：')[1])
                assert ('finding_999' if reference_case=='foreign' else ': finding_0') in feedback['previous_response']
                assert all(issue['ctx']['repairable_output'] for issue in feedback['schema_validation_errors'])
            result = dict(findings=[dict(finding_id=('finding_999' if reference_case=='foreign' else ': finding_0') if bad else 'finding_0', status=finding_status,
                affected_check_titles=['局部异色规律'], description='核对局部色差与结构', normal_explanation='保留反光解释',
                limitations=[], conflicts=[], evidence_ids=[roi['evidence_id'], comparison['evidence_id']])])
        else:
            learning_calls.append(body)
            refs = [view['evidence_id'] for view in views if view['role'] == 'overview']
            result = dict(summary='按实际图像保留局部外观规律', checks=[dict(title='局部异色规律', subject='主体',
                location='表面', criterion='局部异色具有连续边界', allowed_variations=[], limitations=[],
                status='supported', support_evidence_ids=refs[:2], counter_evidence_ids=refs[2:])],
                suspects=[dict(evidence_id=refs[0], bbox_1000=[100, 100, 300, 300],
                    description='局部异色', normal_explanation='需核对反光')], limitations=[])
            if len(learning_calls) == 2:
                sources = json.loads(prompt.split('\n来源：', 1)[1])
                findings = [finding for source in sources for finding in source['verified_findings']]
                assert len(findings) == 1 and findings[0]['judgment']['status'] == finding_status
                assert any(view['role'] == 'roi' for view in views), '核验后的判据必须结合真实追加ROI重新观察'
                assert all(eid in {view['evidence_id'] for view in views}
                    for eid in findings[0]['judgment']['evidence_ids'])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        sample_ids = [config.dataset.id+f':part-{index}.png' for index in range(3)]
        job = runtime.knowledge.start(request=dict(images=sample_ids, image_count=3), mining_prompt=self_discovery_prompt)
        runtime.jobs.wait(job['run_id'], 5)
        final = runtime.jobs.status(job['run_id'])
        assert len(verification_calls)==(1 if reference_case=='valid' else 2),'错误的冻结疑点引用应交由模型纠正一次'
        if reference_case in ('invalid','foreign'):
            assert final['status']=='FAILED' and final['knowledge_version_id'] is None
            assert 'frozen_finding_reference' in final['errors'][0]['message']
            return
        assert final['status'] == 'COMPLETED', final['errors']
        assert len(learning_calls) == 2
        snapshot = KnowledgeReader(db).read(version_id=final['knowledge_version_id']).knowledge
        assert snapshot.findings[0].judgment.status == finding_status
        check = snapshot.checks[0]
        evidence = {item.image.evidence_id: item.sample_id for item in snapshot.evidence}
        assert [evidence[eid] for eid in check.support_evidence_ids] == sample_ids[:2]
        assert [evidence[eid] for eid in check.counter_evidence_ids] == sample_ids[2:]
        assert check.allowed_variations == [], '程序不能从疑点的正常解释自行改写判据'
        assert len(snapshot.mining_steps) == 2
        assert snapshot.generation_version == 'dataset-knowledge-v41'
    finally:
        runtime.close()
