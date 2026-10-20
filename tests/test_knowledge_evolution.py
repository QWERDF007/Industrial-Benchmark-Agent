from uuid import uuid4
import json

import httpx
import pytest


def test_successor_accumulates_sources_and_keeps_rule_identity_when_wording_changes(knowledge_dataset):
    from iad_core.entry import knowledge_get
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.workbench.vision import VlmClient

    db, config = knowledge_dataset
    sample_ids = [config.dataset.id + f":part-{index}.png" for index in range(3)]
    observed = []
    previous = None

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        content = json.loads(request.content)['messages'][0]['content']
        images = [json.loads(item['text'].removeprefix('视觉证据：')) for item in content
                  if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        observed.append(images)
        checks = [{
            'title': '双孔相对位置' if previous is None else '双孔沿长轴排列',
            'subject': '圆孔与部件主体', 'location': '部件中部',
            'criterion': '两个圆孔沿主体长边排列，中心位于同一横向带内',
            'allowed_variations': [] if previous is None else ['均匀亮度变化'],
            'support_evidence_ids': [image['evidence_id'] for image in images],
            'counter_evidence_ids': [], 'limitations': ['无绝对尺寸'], 'status': 'supported',
        }]
        revisions = []
        if previous:
            assert previous['checks'][0]['check_id'] in content[0]['text']
            parent_check = json.loads(content[0]['text'].split('冻结父版本候选：')[1].split('\n')[0])['checks'][0]
            assert 'status' not in parent_check
            assert 'limitations' not in parent_check
            checks.append({**checks[0], 'title': '主体轮廓', 'subject': '主体',
                           'criterion': '主体可见轮廓为矩形'})
            revisions = [{'previous_check_id': previous['checks'][0]['check_id'],
                          'current_check_titles': ['双孔沿长轴排列'], 'reason': '同一位置判据，补充允许亮度变化'}]
        result = {'summary': '部件结构', 'checks': checks, 'suspects': [], 'limitations': [], 'revisions': revisions}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        first = service.start(dataset_id=config.dataset.id, kind='normal', sample_ids=sample_ids[:2])
        service.wait(first['run_id'], 5)
        assert service.status(first['run_id'])['status'] == 'COMPLETED', service.status(first['run_id'])
        previous = knowledge_get({'version_id': service.status(first['run_id'])['knowledge_version_id']}, db.db_path)['knowledge']
        successor = service.start(dataset_id=config.dataset.id, kind='normal', sample_ids=[sample_ids[2]])
        service.wait(successor['run_id'], 5)
        status = service.status(successor['run_id'])
        assert status['status'] == 'COMPLETED', status
        assert status['completed'] == status['total_samples'] == 3
        assert status['requested_sample_ids'] == [sample_ids[2]]
        current = knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']
        assert {source['sample_id'] for source in current['sources']} == set(sample_ids)
        assert current['parent_version_id'] == previous['version_id']
        assert current['checks'][0]['check_id'] == previous['checks'][0]['check_id']
        assert current['checks'][0]['allowed_variations'] == ['均匀亮度变化']
        assert current['checks'][1]['check_id'] != previous['checks'][0]['check_id']
        assert current['checks'][0]['predecessor_check_ids'] == [previous['checks'][0]['check_id']]
        assert current['checks'][1]['predecessor_check_ids'] == []
        assert current['revisions'] == current['mining_steps'][-1]['result']['revisions']
        assert len(observed[1]) == 3
        again = service.start(dataset_id=config.dataset.id, kind='normal', sample_ids=sample_ids[:1])
        service.wait(again['run_id'], 5)
        assert service.status(again['run_id'])['knowledge_version_id'] == current['version_id']
        assert len(observed) == 2
        assert knowledge_get({'version_id': previous['version_id']}, db.db_path)['knowledge'] == previous
    finally:
        service.close()


@pytest.mark.parametrize('invalid_revision', ['missing', 'foreign', 'duplicate_parent', 'unknown_title', 'duplicate_title'])
def test_invalid_rule_lineage_cannot_replace_the_published_knowledge(knowledge_dataset, invalid_revision):
    from iad_core.entry import knowledge_get
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.workbench.vision import VlmClient

    db, config = knowledge_dataset
    previous = None

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        content = json.loads(request.content)['messages'][0]['content']
        images = [json.loads(item['text'].removeprefix('视觉证据：')) for item in content
                  if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        result = {'summary': '孔位', 'checks': [{
            'title': '孔位', 'subject': '孔', 'location': '中部', 'criterion': '双孔横向排列',
            'allowed_variations': [], 'support_evidence_ids': [image['evidence_id'] for image in images],
            'counter_evidence_ids': [], 'limitations': [], 'status': 'supported',
        }], 'suspects': [], 'limitations': [], 'revisions': []}
        if previous:
            revision = {'previous_check_id': previous['checks'][0]['check_id'], 'current_check_titles': ['孔位'], 'reason': '同一孔位判据'}
            if invalid_revision == 'foreign':
                revision['previous_check_id'] = 'check_other_dataset'
            elif invalid_revision == 'unknown_title':
                revision['current_check_titles'] = ['不存在的检查项']
            elif invalid_revision == 'duplicate_title':
                revision['current_check_titles'] = ['孔位', '孔位']
            result['revisions'] = ([] if invalid_revision == 'missing' else
                                   [revision, revision] if invalid_revision == 'duplicate_parent' else [revision])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        first = service.start(dataset_id=config.dataset.id, kind='normal', sample_ids=[config.dataset.id + ':part-0.png'])
        service.wait(first['run_id'], 5)
        previous = knowledge_get({'version_id': service.status(first['run_id'])['knowledge_version_id']}, db.db_path)['knowledge']
        next_job = service.start(dataset_id=config.dataset.id, kind='normal', sample_ids=[config.dataset.id + ':part-1.png'])
        service.wait(next_job['run_id'], 5)
        failed = service.status(next_job['run_id'])
        assert failed['status'] == 'FAILED', failed
        assert failed['completed'] == 0
        assert failed['failed'] == 2
        assert 'Knowledge revision' in failed['errors'][0]['message']
        assert failed['mining_steps'][-1]['result']['checks']
        assert knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge'] == previous
    finally:
        service.close()


def test_source_losing_normal_qualification_is_not_carried_into_successor(knowledge_dataset):
    from iad_core.entry import knowledge_get
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.workbench.review import HumanReview, ReviewSubmission
    from iad_core.workbench.vision import VlmClient

    db, config = knowledge_dataset
    sample_ids = [config.dataset.id + f':part-{index}.png' for index in range(3)]
    previous = None
    observed = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        content = json.loads(request.content)['messages'][0]['content']
        images = [json.loads(item['text'].removeprefix('视觉证据：')) for item in content
                  if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        observed.append(images)
        result = {'summary': '双孔结构', 'checks': [{
            'title': '双孔', 'subject': '主体', 'location': '中部', 'criterion': '双孔横向排列',
            'allowed_variations': [], 'support_evidence_ids': [image['evidence_id'] for image in images],
            'counter_evidence_ids': [], 'limitations': [], 'status': 'supported',
        }], 'suspects': [], 'limitations': [], 'revisions': [] if previous is None else [{
            'previous_check_id': previous['checks'][0]['check_id'], 'current_check_titles': ['双孔'],
            'reason': '排除失去正常来源资格的样本后，剩余来源仍支持双孔位置',
        }]}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        first = service.start(dataset_id=config.dataset.id, kind='normal', sample_ids=sample_ids[:2])
        service.wait(first['run_id'], 5)
        previous = knowledge_get({'version_id': service.status(first['run_id'])['knowledge_version_id']}, db.db_path)['knowledge']
        human = HumanReview(db)
        human.submit(ReviewSubmission(submission_id=uuid4(), dataset_id=config.dataset.id, reviewer='operator', sample_id=sample_ids[0], decision='FAIL'))
        job = service.start(dataset_id=config.dataset.id, kind='normal', sample_ids=sample_ids[2:])
        service.wait(job['run_id'], 5)
        status = service.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        current = knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']
        assert {source['sample_id'] for source in current['sources']} == set(sample_ids[1:])
        assert current['removed_source_ids'] == [sample_ids[0]]
        assert {item['sample_id'] for item in current['evidence']} == set(sample_ids[1:])
        old_eids = {item['image']['evidence_id'] for item in previous['evidence'] if item['sample_id'] == sample_ids[0]}
        assert not old_eids.intersection(current['checks'][0]['support_evidence_ids'])
        assert len(observed[-1]) == 2
        assert current['checks'][0]['check_id'] == previous['checks'][0]['check_id']
        assert knowledge_get({'version_id': previous['version_id']}, db.db_path)['knowledge'] == previous
    finally:
        service.close()


def test_split_merge_and_retirement_have_explicit_rule_lineage(knowledge_dataset):
    from iad_core.entry import knowledge_get
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.workbench.vision import VlmClient

    db, config = knowledge_dataset
    previous = None
    stage = 0

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 4000, 'max_model_len': 262144})
        content = json.loads(request.content)['messages'][0]['content']
        images = [json.loads(item['text'].removeprefix('视觉证据：')) for item in content
                  if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        titles = [['双孔位置', '固定亮度'], ['左孔位置', '右孔位置'], ['双孔位置关系']][stage]
        revisions = []
        if stage == 1:
            revisions = [{'previous_check_id': previous['checks'][0]['check_id'], 'current_check_titles': titles,
                          'reason': '分开描述两孔相对边界位置'},
                         {'previous_check_id': previous['checks'][1]['check_id'], 'current_check_titles': [],
                          'reason': '新来源亮度变化反驳固定亮度假设'}]
        elif stage == 2:
            revisions = [{'previous_check_id': check['check_id'], 'current_check_titles': titles,
                          'reason': '用整体孔位关系合并两个局部判据'} for check in previous['checks']]
        result = {'summary': '结构判据', 'checks': [{
            'title': title, 'subject': '主体', 'location': '中部', 'criterion': title,
            'allowed_variations': [], 'support_evidence_ids': [image['evidence_id'] for image in images],
            'counter_evidence_ids': [], 'limitations': [], 'status': 'supported',
        } for title in titles], 'suspects': [], 'limitations': [], 'revisions': revisions}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        versions = []
        for index in range(3):
            stage = index
            job = service.start(dataset_id=config.dataset.id, kind='normal', sample_ids=[config.dataset.id + f':part-{index}.png'])
            service.wait(job['run_id'], 5)
            status = service.status(job['run_id'])
            assert status['status'] == 'COMPLETED', status
            previous = knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']
            versions.append(previous)
        original, split, merged = versions
        assert not {check['check_id'] for check in original['checks']} & {check['check_id'] for check in split['checks']}
        assert all(check['predecessor_check_ids'] == [original['checks'][0]['check_id']] for check in split['checks'])
        assert split['revisions'][1]['current_check_titles'] == []
        assert merged['checks'][0]['predecessor_check_ids'] == [check['check_id'] for check in split['checks']]
        assert merged['checks'][0]['check_id'] not in merged['checks'][0]['predecessor_check_ids']
        assert len(merged['sources']) == 3
        for version in versions:
            assert knowledge_get({'version_id': version['version_id']}, db.db_path)['knowledge'] == version
    finally:
        service.close()


def test_capacity_synthesis_preserves_parent_rules_and_accumulated_visual_support(knowledge_dataset):
    from iad_core.entry import knowledge_get
    from iad_core.knowledge.service import KnowledgeService
    from iad_core.workbench.vision import VlmClient

    db, config = knowledge_dataset
    previous = None
    observed = {}
    grouped = []

    def respond(request):
        content = json.loads(request.content)['messages'][0]['content']
        images = [json.loads(item['text'].removeprefix('视觉证据：')) for item in content
                  if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': len(images) * 2000, 'max_model_len': 12700})
        observed.update({image['evidence_id']: image for image in images})
        if previous:
            grouped.append(images)
            assert previous['checks'][0]['check_id'] in content[0]['text']
        support = [image['evidence_id'] for image in images] if images else list(observed)
        result = {'summary': '分组联合归纳', 'checks': [{
            'title': '孔位', 'subject': '主体', 'location': '中部', 'criterion': '双孔横向排列',
            'allowed_variations': [], 'support_evidence_ids': support,
            'counter_evidence_ids': [], 'limitations': [], 'status': 'supported',
        }], 'suspects': [], 'limitations': [], 'revisions': [] if previous is None else [{
            'previous_check_id': previous['checks'][0]['check_id'], 'current_check_titles': ['孔位'],
            'reason': '当前分组证据仍支持同一孔位关系',
        }]}
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(dataset_id=config.dataset.id, kind='normal', sample_ids=[config.dataset.id + ':part-0.png'])
        service.wait(job['run_id'], 5)
        previous = knowledge_get({'version_id': service.status(job['run_id'])['knowledge_version_id']}, db.db_path)['knowledge']
        job = service.start(dataset_id=config.dataset.id, kind='normal', sample_ids=[config.dataset.id + ':part-1.png', config.dataset.id + ':part-2.png'])
        service.wait(job['run_id'], 5)
        status = service.status(job['run_id'])
        assert status['status'] == 'COMPLETED', status
        current = knowledge_get({'version_id': status['knowledge_version_id']}, db.db_path)['knowledge']
        assert len(grouped) == 3
        assert sum(len(images) for images in grouped) == 3
        assert grouped[-1] == []
        assert current['checks'][0]['check_id'] == previous['checks'][0]['check_id']
        assert len(current['checks'][0]['support_evidence_ids']) == 3
        assert len(current['mining_steps'][-1]['child_step_ids']) == 2
    finally:
        service.close()
