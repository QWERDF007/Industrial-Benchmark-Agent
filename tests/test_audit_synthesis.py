import json

import httpx
import pytest

from iad_core.entry import audit_job_sample, audit_evidence, dataset_scan
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


def test_audit_model_synthesizes_the_frozen_knowledge_consistency_and_actual_comparison_images(dataset, mllm_api):
    db, _, config = dataset
    original, _, responses = mllm_api
    synthesis_calls = []
    instruction = '结合冻结知识、一致性和实际比较图，输出综合分析、结论与判断依据。'
    target = config.dataset.id+':dent.png'

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return original.send(request)
        body = json.loads(request.content)
        if body['response_format']['json_schema']['name'] != 'AuditConclusion':
            return original.send(request)
        synthesis_calls.append(body)
        content = body['messages'][0]['content']
        assert content[0]['text'].startswith(instruction+'\n冻结综合审计：')
        frozen = json.loads(content[0]['text'].split('\n冻结综合审计：', 1)[1])
        views = [json.loads(part['text'][5:]) for part in content
            if part['type'] == 'text' and part['text'].startswith('视觉证据：')]
        assert frozen['consistency']['record']['sample_id'] == target
        assert frozen['consistency']['record']['status'] == 'COMPLETE'
        assert frozen['visual_observations']['joint_steps'], '必须结合已完成的真实视觉观察'
        assert frozen['knowledge']['checks'] and frozen['knowledge']['knowledge_version_id']
        image_owners = frozen['image_owners']
        target_view = next(view for view in views if image_owners[view['evidence_id']] == target)
        comparison = next(view for view in views if image_owners[view['evidence_id']] != target)
        assert target_view['annotations'], 'Labelme整图必须携带真实标注'
        assert comparison['source_sha256'] != target_view['source_sha256']
        refs = [target_view['evidence_id'], comparison['evidence_id']]
        result = dict(responses['VlmResult'], evidence_ids=refs,
            analysis_text='整体表面变化与冻结外观规律相符，局部差异仍需结合正常反光解释复核；一致性记录未单独构成缺陷事实。',
            observation='主体表面具有连续蓝色外观', applicable_rule='仅适用于可见表面外观', normal_alternative='光照可造成局部亮度变化',
            label_relation='undetermined', proposed_slice=[],
            basis=[dict(text='以独立图像对照当前表面的外观变化', evidence_ids=refs,
                knowledge_check_ids=[frozen['knowledge']['checks'][0]['check_id']], consistency_result_ids=[])])
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target], instruction=instruction)
        runtime.audit.wait(job['run_id'], 8)
        final = runtime.audit.status(job['run_id'])
        assert final['status'] == 'COMPLETED', final['errors']
        assert len(synthesis_calls) == 1, '视觉观察之后必须由模型综合一致性、冻结知识和比较图'
        detail = audit_job_sample(dict(run_id=job['run_id'], sample_id=target), db.db_path)
        analysis = detail['suggestion']['analysis']
        assert analysis['conclusion']['analysis_text'].startswith('整体表面变化')
        assert analysis['conclusion']['basis'][0]['knowledge_check_ids'] == [detail['knowledge']['checks'][0]['check_id']]
        assert len(analysis['input_snapshot_signature']) == 64
        assert analysis['consistency']['check_id'] == detail['consistency']['check_id']
        sources = analysis['image_sources']
        assert sources[0]['sample']['sample_id'] == target and sources[0]['annotations']
        assert any(source['sample']['sample_id'] != target for source in sources)
        evidence_id = analysis['conclusion']['basis'][0]['evidence_ids'][1]
        assert audit_evidence(dict(suggestion_id=detail['suggestion']['suggestion_id'], evidence_id=evidence_id), db.db_path)['path']
        from pathlib import Path
        frozen_annotations = sources[0]['annotations']
        Path(config.annotations.root, 'dent.json').write_text(json.dumps(dict(imageWidth=320, imageHeight=240,
            shapes=[dict(label='后来修改的类别', shape_type='rectangle', points=[[100, 100], [180, 180]])])))
        dataset_scan(dict(dataset_id=config.dataset.id), db.db_path)
        historical = audit_job_sample(dict(run_id=job['run_id'], sample_id=target), db.db_path)
        assert historical['source_current'] is False
        assert historical['suggestion']['analysis']['image_sources'][0]['annotations'] == frozen_annotations
        assert historical['suggestion']['analysis']['conclusion'] == analysis['conclusion']
    finally:
        runtime.close()


def test_conflicted_knowledge_remains_auditable_without_promoting_it_to_truth(dataset, mllm_api):
    db, _, config = dataset
    client, _, responses = mllm_api
    responses['KnowledgeDraft']['checks'][0]['status'] = 'conflicted'
    runtime = WorkbenchRuntime(db, VlmClient(client))
    try:
        from iad_core.knowledge.instructions import FrozenMiningPrompt, MiningPromptConfiguration
        job = runtime.knowledge.start(request=dict(images=[config.dataset.id+':normal.png',config.dataset.id+':normal2.png'],image_count=2),
            mining_prompt=FrozenMiningPrompt.capture(MiningPromptConfiguration(objective='观察仍有分歧的外观规律',directions=[])))
        runtime.jobs.wait(job['run_id'],5)
        knowledge_id = runtime.jobs.status(job['run_id'])['knowledge_version_id']
        assert knowledge_id
        responses['VlmResult'].update(suggested_label='UNCERTAIN',reason_category='INSUFFICIENT_EVIDENCE')
        audit = runtime.audit.start(dataset_id=config.dataset.id,sample_ids=[config.dataset.id+':dent.png'])
        runtime.audit.wait(audit['run_id'],5)
        final=runtime.audit.status(audit['run_id'])
        assert final['status']=='COMPLETED',final['errors']
        detail=audit_job_sample(dict(run_id=audit['run_id'],sample_id=config.dataset.id+':dent.png'),db.db_path)
        assert detail['suggestion']['analysis']['knowledge_version_id']==knowledge_id
        assert detail['knowledge']['checks'][0]['status']=='conflicted'
        assert detail['suggestion']['analysis']['conclusion']['suggested_label']=='UNCERTAIN'
    finally:
        runtime.close()


@pytest.mark.parametrize('corrected',[True,False])
def test_audit_returns_finding_coverage_errors_to_the_model_once_without_changing_its_coordinates(dataset,mllm_api,corrected):
    db,_,config=dataset
    original,_,responses=mllm_api
    calls=[]
    box=[100,100,140,140]
    def respond(request):
        response=original.send(request)
        if request.url.path.endswith('/tokenize'):
            return response
        body=json.loads(request.content)
        if body['response_format']['json_schema']['name']!='JointAnalysis':
            return response
        calls.append(body)
        content=body['messages'][0]['content']
        images=[json.loads(part['text'][5:]) for part in content if part['type']=='text' and part['text'].startswith('视觉证据：')]
        overview=next(item for item in images if item['role']=='overview')
        roi=next(item for item in images if item['role']=='roi' and item['representation']=='raw')
        assert roi['crop_bbox'][2]<box[0], '实际局部不覆盖模型给出的疑点'
        result=json.loads(response.json()['choices'][0]['message']['content'])
        evidence=overview['evidence_id'] if corrected and len(calls)>1 else roi['evidence_id']
        check=result['check_assessments'][0]['check_id']
        result['findings']=[dict(check_ids=[check],location=dict(scope='local',bbox=box,description='主体中部'),
            description='可见局部亮度变化',hypothesis='可能异色',normal_explanation='保留反光解释',review_action='核对实际区域',
            priority='medium',evidence_ids=[evidence])]
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})
    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    target=config.dataset.id+':dent.png'
    try:
        job=runtime.audit.start(dataset_id=config.dataset.id,sample_ids=[target])
        runtime.audit.wait(job['run_id'],5)
        final=runtime.audit.status(job['run_id'])
        assert len(calls)==2, '空间覆盖错误必须进入同一模型输出校验，只给一次自行纠正机会'
        feedback=json.loads(calls[1]['messages'][0]['content'][0]['text'].split('输出校验结果：',1)[1])
        assert 'does not cover the finding' in str(feedback['schema_validation_errors'])
        assert all(item['ctx']['repairable_output'] for item in feedback['schema_validation_errors'])
        if corrected:
            assert final['status']=='COMPLETED',final['errors']
            detail=audit_job_sample(dict(run_id=job['run_id'],sample_id=target),db.db_path)
            finding=detail['suggestion']['analysis']['findings'][0]
            assert finding['location']['bbox']==box
            assert finding['evidence_ids']==[detail['suggestion']['analysis']['overview']['evidence_id']]
        else:
            assert final['status']=='FAILED'
            assert audit_job_sample(dict(run_id=job['run_id'],sample_id=target),db.db_path)['suggestion'] is None
    finally:
        runtime.close()
