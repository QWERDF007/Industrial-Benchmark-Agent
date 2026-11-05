import json

import httpx
import pytest

from iad_core.entry import knowledge_get
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient
from tests.knowledge_scenarios import frozen_observation_response


@pytest.mark.parametrize('retraction_case', ['valid', 'omitted', 'retirement', 'unknown_evidence', 'unknown_owner',
    'unknown_text', 'duplicate', 'reintroduced', 'global_variation', 'reason_reference', 'persistent_unknown_evidence'])
def test_model_retracts_specific_text_without_erasing_history_evidence_or_conflicts(knowledge_dataset, self_discovery_prompt, retraction_case):
    db, config = knowledge_dataset
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count':1000,'max_model_len':262144})
        observed = frozen_observation_response(request)
        if observed is not None:
            return observed
        body = json.loads(request.content)
        content = body['messages'][0]['content']
        parent = json.loads(content[0]['text'].split('冻结父版本候选：')[1].split('\n')[0])
        refs = [json.loads(item['text'][5:])['evidence_id'] for item in content
            if item['type']=='text' and item['text'].startswith('视觉证据：')]
        first = not parent['checks']
        check = dict(title='孔位关系',subject='孔',location='主体',criterion='双孔横向排列',
            allowed_variations=['所有视角均可互换','均匀高光变化'] if first else ['轻微曝光变化'],
            limitations=['推测采集条件已知','局部视角'] if first else ['缺少深度量测'],
            status='conflicted' if first else 'supported',support_evidence_ids=refs[:-1] if first else refs,
            counter_evidence_ids=refs[-1:] if first else [])
        result = dict(summary='记录当前可见规律',checks=[check],suspects=[],
            limitations=['照明光谱已知','缺少尺度标定'] if first else [])
        if not first:
            cid = parent['checks'][0]['check_id']
            result['revisions'] = [dict(previous_check_id=cid,current_check_titles=['孔位关系'],reason='本轮复核同一判据的适用条件')]
            if retraction_case == 'retirement':
                result['checks'] = []
                result['revisions'][0]['current_check_titles'] = []
            if retraction_case != 'omitted':
                result['text_retractions'] = [dict(check_id=owner,field=field,text=text,
                    reason='当前输入不能支持此前的条件断言，撤回该表述',evidence_ids=refs)
                    for owner,field,text in [(None,'limitations','照明光谱已知'),
                        (cid,'limitations','推测采集条件已知'),(cid,'allowed_variations','所有视角均可互换')]]
                bad = len(calls) == 1 or retraction_case == 'persistent_unknown_evidence'
                if bad:
                    target = result['text_retractions'][0]
                    if retraction_case in ('unknown_evidence', 'persistent_unknown_evidence'):
                        target['evidence_ids'] = ['@v99999']
                    elif retraction_case == 'unknown_owner':
                        target['check_id'] = 'check_unknown'
                    elif retraction_case == 'unknown_text':
                        target['text'] = '父版本不存在的限制'
                    elif retraction_case == 'duplicate':
                        result['text_retractions'].append(dict(target))
                    elif retraction_case == 'reintroduced':
                        result['limitations'].append(target['text'])
                    elif retraction_case == 'global_variation':
                        target['field'] = 'allowed_variations'
                    elif retraction_case == 'reason_reference':
                        target['reason'] = '根据@v0判断撤回'
        calls.append((body, result))
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        snapshots = []
        for start in [0,3]:
            ids = [f'{config.dataset.id}:part-{index}.png' for index in range(start,start+3)]
            job = runtime.knowledge.start(request=dict(image_count=3,images=ids,
                knowledge_preset=[snapshots[-1]['version_id']] if snapshots else []),mining_prompt=self_discovery_prompt)
            runtime.knowledge.wait(job['run_id'],8)
            state = runtime.knowledge.status(job['run_id'])
            if start == 3 and retraction_case == 'persistent_unknown_evidence':
                assert state['status'] == 'FAILED' and state['knowledge_version_id'] is None
                assert 'text_retraction_evidence' in state['errors'][0]['message']
                assert len(calls) == 3
                assert knowledge_get(dict(version_id=snapshots[0]['version_id']),db.db_path)['knowledge']==snapshots[0]
                return
            assert state['status']=='COMPLETED', state['errors']
            snapshots.append(knowledge_get(dict(version_id=state['knowledge_version_id']),db.db_path)['knowledge'])
        previous,current = snapshots
        assert current['parent_version_id']==previous['version_id']
        retained = retraction_case == 'omitted'
        assert current['limitations']==(['照明光谱已知'] if retained else []) + ['缺少尺度标定']
        check = current['checks'][0]
        retired = retraction_case == 'retirement'
        assert check['limitations']==(['推测采集条件已知'] if retained else []) + ['局部视角'] + ([] if retired else ['缺少深度量测'])
        assert check['allowed_variations']==(['所有视角均可互换'] if retained else []) + ['均匀高光变化'] + ([] if retired else ['轻微曝光变化'])
        if retired:
            assert current['conflicts'][0]['category'] == 'retirement_proposal'
            assert current['conflicts'][0]['resolution'] is None
        assert check['check_id']==previous['checks'][0]['check_id']
        assert check['status']=='conflicted', '撤回文字不能替模型或人工消除判据冲突'
        assert set(check['counter_evidence_ids']) >= set(previous['checks'][0]['counter_evidence_ids'])
        assert set(previous['checks'][0]['support_evidence_ids']) <= {item['image']['evidence_id'] for item in current['evidence']}
        assert previous['checks'][0]['support_evidence_ids'][0] in check['support_evidence_ids']
        assert len(current['text_retractions'])==(0 if retained else 3)
        actual = set(current['mining_steps'][-1]['image_evidence_ids'])
        assert all(set(item['evidence_ids'])<=actual for item in current['text_retractions'])
        assert all(not ref.startswith('@') for item in current['text_retractions'] for ref in item['evidence_ids'])
        assert knowledge_get(dict(version_id=previous['version_id']),db.db_path)['knowledge']==previous
        assert 'text_retractions' in calls[-1][0]['messages'][0]['content'][0]['text']
        if retraction_case not in ('valid', 'omitted', 'retirement'):
            assert len(calls) == 3, '不可用引用必须由模型纠正一次，不能猜测替换'
            assert '输出校验结果：' in calls[-1][0]['messages'][-1]['content']
    finally:
        runtime.close()
