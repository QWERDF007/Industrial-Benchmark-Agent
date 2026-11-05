import json
from uuid import uuid4

import httpx
import pytest

from iad_core import entry
from iad_core.knowledge.service import KnowledgeService
from iad_core.knowledge.instructions import FrozenMiningPrompt, MiningPromptConfiguration
from iad_core.workbench.vision import VlmClient
from tests.knowledge_scenarios import selected_group


def test_custom_complete_prompt_is_exactly_the_frozen_model_instruction():
    configuration = MiningPromptConfiguration(objective='比较边缘', directions=[], instruction='逐图比较原始标注与边缘，保留不确定项。')
    frozen = FrozenMiningPrompt.capture(configuration)
    assert frozen.instruction == configuration.instruction
    assert FrozenMiningPrompt.model_validate_json(frozen.model_dump_json()) == frozen


def test_support_and_counter_evidence_have_independent_filtered_pages(knowledge_dataset, self_discovery_prompt):
    db, config = knowledge_dataset

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        content = json.loads(request.content)['messages'][0]['content']
        evidence = [json.loads(item['text'].removeprefix('视觉证据：'))['evidence_id'] for item in content
                    if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        draft = dict(summary='孔位存在差异', checks=[dict(title='孔位关系', subject='孔', location='主体',
            criterion='左右可见孔位', allowed_variations=[], support_evidence_ids=evidence[:-1],
            counter_evidence_ids=evidence[-1:], limitations=[], status='conflicted')], suspects=[], limitations=[])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(draft)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = service.start(request=selected_group(db, config.dataset.id, 'normal'), model_name='test-mllm', mining_prompt=self_discovery_prompt)
        service.wait(job['run_id'], 5)
        result = service.status(job['run_id'])
        assert result['status'] == 'COMPLETED', result['errors']
        original = entry.knowledge_get({'version_id': result['knowledge_version_id']}, db.db_path)['knowledge']
        check = original['checks'][0]
        query = dict(version_id=original['version_id'], check_id=check['check_id'], page_size=2)
        support = entry.knowledge_details(dict(query, evidence_role='support'), db.db_path)
        counter = entry.knowledge_details(dict(query, evidence_role='counter'), db.db_path)
        second = entry.knowledge_details(dict(query, evidence_role='support', page=2), db.db_path)
        assert support['total'] == 5
        assert counter['total'] == 1
        assert [item['image']['evidence_id'] for item in support['items']] == check['support_evidence_ids'][:2]
        assert [item['image']['evidence_id'] for item in second['items']] == check['support_evidence_ids'][2:4]
        assert [item['image']['evidence_id'] for item in counter['items']] == check['counter_evidence_ids']
        assert entry.knowledge_details(dict(query, evidence_role='counter'), db.db_path) == counter
        assert entry.knowledge_get({'version_id': original['version_id']}, db.db_path)['knowledge'] == original
    finally:
        service.close()


def test_check_review_is_persistent_version_scoped_and_does_not_change_model_evidence(knowledge_dataset, self_discovery_prompt):
    db, config = knowledge_dataset

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        content = json.loads(request.content)['messages'][0]['content']
        evidence = [json.loads(item['text'].removeprefix('视觉证据：'))['evidence_id'] for item in content
                    if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        result = dict(summary='双孔外观', checks=[dict(title='孔位关系', subject='孔', location='主体',
            criterion='左右可见孔位', allowed_variations=[], support_evidence_ids=evidence,
            counter_evidence_ids=[], limitations=['当前视角'], status='supported')], suspects=[], limitations=[])
        return httpx.Response(200, json={'choices': [{'message': {'content': json.dumps(result)}}]})

    service = KnowledgeService(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        versions = []
        for offset in (0, 3):
            images = [f'{config.dataset.id}:part-{index}.png' for index in range(offset, offset + 3)]
            job = service.start(request=selected_group(db, config.dataset.id, 'normal', images=images), model_name='test-mllm', mining_prompt=self_discovery_prompt)
            service.wait(job['run_id'], 5)
            result = service.status(job['run_id'])
            assert result['status'] == 'COMPLETED', result['errors']
            versions.append(result['knowledge_version_id'])
        original = entry.knowledge_get({'version_id': versions[0]}, db.db_path)['knowledge']
        check_id = original['checks'][0]['check_id']
        query = {'version_id': versions[0], 'page_size': 8}
        before = entry.knowledge_details(query, db.db_path)
        assert before['items'][0]['review']['status'] == 'pending'
        assert before['items'][0]['review']['revision'] == 0
        submission = dict(version_id=versions[0], check_id=check_id, expected_revision=0,
                          submission_id=str(uuid4()), status='rejected', note='孔位证据不足，请补充另一视角')
        saved = entry.knowledge_check_review(submission, db.db_path)
        assert saved['revision'] == 1
        assert entry.knowledge_check_review(submission, db.db_path) == saved
        assert entry.knowledge_details(query, db.db_path)['items'][0]['review'] == saved
        assert entry.knowledge_details(dict(query, review_status='pending'), db.db_path)['total'] == 0
        assert entry.knowledge_details(dict(query, review_status='rejected', search='孔位'), db.db_path)['total'] == 1
        detail = entry.knowledge_details(dict(query, check_id=check_id), db.db_path)
        assert detail['support_evidence_ids'] == original['checks'][0]['support_evidence_ids']
        assert detail['check']['review'] == saved
        assert entry.knowledge_details({'version_id': versions[1]}, db.db_path)['items'][0]['review']['status'] == 'pending'
        assert entry.knowledge_get({'version_id': versions[0]}, db.db_path)['knowledge'] == original
        metadata = entry.knowledge_versions({'dataset_id': config.dataset.id}, db.db_path)
        assert {item['version_id'] for item in metadata['versions']} == set(versions)
        assert metadata['versions'][0]['check_count'] == 1
        assert metadata['versions'][0]['supported_check_count'] == 1
        with pytest.raises(ValueError, match='已变化'):
            entry.knowledge_check_review(dict(submission, submission_id=str(uuid4()), status='confirmed'), db.db_path)
        with pytest.raises(LookupError):
            entry.knowledge_check_review(dict(submission, submission_id=str(uuid4()), check_id='foreign-check'), db.db_path)
    finally:
        service.close()
