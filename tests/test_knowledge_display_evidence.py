import json

import httpx

from iad_core.entry import knowledge_details, knowledge_get
from iad_core.knowledge.instructions import FrozenMiningPrompt, MiningPromptConfiguration
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


def test_knowledge_cards_and_pagination_resolve_crop_references_to_distinct_frozen_whole_images(dataset):
    db, _, config = dataset
    raw_calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        body = json.loads(request.content)
        views = [json.loads(part['text'][5:]) for part in body['messages'][0]['content']
            if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        raw = [view for view in views if view['representation'] == 'raw']
        raw_calls.extend(raw)
        assert len([view for view in raw if view['role'] == 'roi']) >= 2
        assert any(view['representation'] == 'annotation_mask' for view in views)
        overviews = [view for view in raw if view['role'] == 'overview']
        regions = [view for view in raw if view['role'] == 'roi']
        support = [overviews[0]['evidence_id'], regions[0]['evidence_id']]
        counter = [regions[1]['evidence_id']]
        result = dict(summary='可见局部外观差异', checks=[dict(title='表面外观', subject='主体', location='可见表面',
            criterion='表面具有连续外观', allowed_variations=[], status='conflicted', limitations=[],
            support_evidence_ids=support, counter_evidence_ids=counter)], suspects=[], limitations=[])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.knowledge.start(request=dict(images=[config.dataset.id+':dent.png', config.dataset.id+':scratch.png'], image_count=2),
            mining_prompt=FrozenMiningPrompt.capture(MiningPromptConfiguration(objective='联合比较', directions=[])))
        runtime.jobs.wait(job['run_id'], 5)
        final = runtime.jobs.status(job['run_id'])
        assert final['status'] == 'COMPLETED', final['errors']
        original = knowledge_get(dict(version_id=final['knowledge_version_id']), db.db_path)['knowledge']
        check = original['checks'][0]
        listing = knowledge_details(dict(version_id=original['version_id']), db.db_path)
        assert listing['items'][0]['support_count'] == 1
        assert listing['items'][0]['counter_count'] == 1
        for role in ['support', 'counter']:
            page = knowledge_details(dict(version_id=original['version_id'], check_id=check['check_id'], evidence_role=role, page_size=1), db.db_path)
            assert page['total'] == 1
            assert len(page['items']) == 1
            evidence = page['items'][0]['image']
            assert evidence['role'] == 'overview' and evidence['representation'] == 'raw'
            assert evidence['crop_bbox'] == [0, 0, 320, 240]
            assert evidence['sent_size'] == [320, 240]
            assert page[role+'_evidence_ids'] == check[role+'_evidence_ids'], '模型事实引用不应被展示映射改写'
        gallery = knowledge_details(dict(version_id=original['version_id'], section='evidence',
            evidence_ids=json.dumps([*check['support_evidence_ids'], *check['counter_evidence_ids']]), page_size=1), db.db_path)
        assert gallery['total'] == 2 and len(gallery['items']) == 1
        assert gallery['items'][0]['image']['role'] == 'overview'
        assert knowledge_get(dict(version_id=original['version_id']), db.db_path)['knowledge'] == original
        assert any(view['role'] == 'roi' for view in raw_calls), '只调整展示，仍给模型整图、标注和真实局部'
    finally:
        runtime.close()
