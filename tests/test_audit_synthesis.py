import json

import httpx
import pytest

from iad_core.entry import audit_job_sample, audit_evidence, dataset_scan
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


@pytest.mark.parametrize('mistake', ['none', 'unknown', 'wrong_kind', 'non_text', 'descriptive', 'persistent'])
def test_audit_transmits_short_references_and_preserves_frozen_evidence_ownership(dataset, mllm_api, mistake):
    db, _, config = dataset
    original, _, responses = mllm_api
    requests = []
    target = config.dataset.id+':dent.png'

    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/tokenize') or body['response_format']['json_schema']['name'] != 'AuditConclusion':
            return original.send(request)
        requests.append(body)
        content = body['messages'][0]['content']
        if mistake=='descriptive' and len(requests)>1:
            feedback = json.loads(body['messages'][-1]['content'].split('输出校验结果：',1)[1])
            assert '@s0' in feedback['schema_validation_errors'][0]['msg'], '反馈应指出具体违规引用，不能让模型猜错在哪里'
        assert ':dent.png' not in json.dumps(body), '模型应看请求内引用，不能从样本ID抄出文件名'
        assert ':scratch.png' not in json.dumps(body)
        frozen = json.loads(content[0]['text'].split('冻结综合审计：', 1)[1].split('\n输出校验结果：',1)[0])
        assert frozen['audit_target']['sample_id'].startswith('@s')
        views = [json.loads(part['text'][5:]) for part in content if part['type']=='text' and part['text'].startswith('视觉证据：')]
        raw = [view['evidence_id'] for view in views if view['representation']=='raw']
        assert all(identity.startswith('@v') for identity in raw)
        assert all(annotation['sample_id'].startswith('@s') for view in views for annotation in view.get('annotations', []))
        check = frozen['knowledge']['checks'][0]['check_id']
        result_ids = [ref['result_id'] for ref in frozen['consistency']['record']['references']]
        result = dict(responses['VlmResult'], analysis_text='以主图的连续轮廓和独立来源进行实际对照。',
            observation='主体表面连续', applicable_rule='适用于当前可见表面', normal_alternative='保留光照变化解释',
            label_relation='undetermined', proposed_slice=[], evidence_ids=raw,
            basis=[dict(text='比较主图与对应参考表面', evidence_ids=raw, knowledge_check_ids=[check], consistency_result_ids=result_ids)])
        if len(requests)==1 or mistake=='persistent':
            if mistake in ('unknown','persistent'):
                result['basis'][0]['evidence_ids']=['@v999']
            if mistake=='wrong_kind':
                result['basis'][0]['evidence_ids']=[frozen['audit_target']['sample_id']]
            if mistake=='non_text':
                result['basis'][0]['evidence_ids']=[None]
            if mistake=='descriptive':
                result['analysis_text']='对照'+frozen['audit_target']['sample_id']+'观察轮廓。'
        return httpx.Response(200, json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 8)
        final = runtime.audit.status(job['run_id'])
        if mistake in ('unknown', 'wrong_kind', 'persistent'):
            assert len(requests)==2
            text = requests[1]['messages'][0]['content'][0]['text']
            feedback = json.loads(requests[1]['messages'][-1]['content'].split('输出校验结果：',1)[1])
            frozen = json.loads(text.split('冻结综合审计：',1)[1].split('\n输出校验结果：',1)[0])
            expected = frozen['audit_target']['sample_id'] if mistake=='wrong_kind' else '@v999'
            message = '\n'.join(issue['msg'] for issue in feedback['schema_validation_errors'])
            assert expected in message, '纠正反馈应指出实际违规引用，避免模型猜错或清空完整结果'
            assert 'evidence_ids' in message
        if mistake=='persistent':
            assert final['status']=='FAILED'
            assert len(requests)==2
            assert audit_job_sample(dict(run_id=job['run_id'],sample_id=target), db.db_path)['suggestion'] is None
            return
        assert final['status']=='COMPLETED', final['errors']
        assert len(requests)==(1 if mistake=='none' else 2), '引用错误由模型自行纠正一次，不替换它的文字或证据'
        detail = audit_job_sample(dict(run_id=job['run_id'],sample_id=target), db.db_path)
        conclusion = detail['suggestion']['analysis']['conclusion']
        assert all(identity.startswith('img_') for identity in conclusion['evidence_ids'])
        assert conclusion['basis'][0]['knowledge_check_ids']==[detail['knowledge']['checks'][0]['check_id']]
        assert set(conclusion['basis'][0]['consistency_result_ids'])=={ref['result_id'] for ref in detail['consistency']['references']}
        assert detail['suggestion']['analysis']['image_sources'][0]['sample']['sample_id']==target
        child = runtime.jobs.status(final['batch_runs'][0])
        mappings = list(child['model_reference_bindings'].values())
        assert any(target in mapping.values() for mapping in mappings), '实际请求引用必须保留可追溯绑定'
    finally:
        runtime.close()


@pytest.mark.parametrize('location', ['conclusion', 'check', 'region_request'])
@pytest.mark.parametrize('corrected', [True, False])
def test_joint_unknown_references_are_repaired_once_without_publishing_invalid_evidence(dataset, mllm_api, location, corrected):
    db, _, config = dataset
    original, _, _ = mllm_api
    calls = []
    unknown = 'img_'+'f'*64
    def respond(request):
        response = original.send(request)
        if request.url.path.endswith('/tokenize'):
            return response
        body = json.loads(request.content)
        if body['response_format']['json_schema']['name']!='JointAnalysis':
            return response
        calls.append(body)
        schema=body['response_format']['json_schema']['schema']
        views=[json.loads(part['text'][5:]) for part in body['messages'][0]['content'] if part['type']=='text' and part['text'].startswith('视觉证据：')]
        supplied={view['evidence_id'] for view in views}
        ids=schema['properties']['evidence_ids']['items']
        assert set(ids.get('enum',[ids.get('const')]))==supplied,'联合检查Schema应给模型实际图像引用选项，不能只声明任意字符串'
        assessment=schema['$defs'][schema['properties']['check_assessments']['items']['$ref'].split('/')[-1]]
        ids=assessment['properties']['evidence_ids']['items']
        assert set(ids.get('enum',[ids.get('const')]))==supplied
        result = json.loads(response.json()['choices'][0]['message']['content'])
        if len(calls)==1 or not corrected:
            if location=='conclusion':
                result['evidence_ids']=[unknown]
            elif location=='check':
                result['check_assessments'][0]['evidence_ids']=[unknown]
            else:
                result['global_view']['suspect_regions']=[dict(bbox_1000=[100,100,300,300],reason='需复核区域',check_ids=['unknown-check'])]
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})
    runtime = WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        target=config.dataset.id+':dent.png'
        job=runtime.audit.start(dataset_id=config.dataset.id,sample_ids=[target])
        runtime.audit.wait(job['run_id'],8)
        final=runtime.audit.status(job['run_id'])
        assert len(calls)==2,'联合检查的未知引用也应给模型一次自行纠正机会'
        detail=audit_job_sample(dict(run_id=job['run_id'],sample_id=target),db.db_path)
        if corrected:
            assert final['status']=='COMPLETED',final['errors']
            assert unknown not in detail['suggestion']['analysis']['conclusion']['evidence_ids']
        else:
            assert final['status']=='FAILED' and detail['suggestion'] is None
    finally:
        runtime.close()


@pytest.mark.parametrize('comparison_encoding', ['default', 'uncompressed'])
def test_audit_model_synthesizes_the_frozen_knowledge_consistency_and_actual_comparison_images(dataset, mllm_api, comparison_encoding):
    db, registry, config = dataset
    if comparison_encoding == 'uncompressed':
        from PIL import Image
        from pathlib import Path
        from iad_core.storage.repositories import SampleRepository
        path = Path(SampleRepository(db).get(config.dataset.id+':scratch.png').image_path)
        with Image.open(path) as image:
            pixels = image.copy()
        pixels.save(path, compress_level=0)
        registry.rescan(config.dataset.id)
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
        wire_target = frozen['audit_target']['sample_id']
        assert frozen['consistency']['record']['sample_id'] == wire_target
        assert frozen['consistency']['record']['status'] == 'COMPLETE'
        assert frozen['visual_observations']['joint_steps'], '必须结合已完成的真实视觉观察'
        assert frozen['knowledge']['checks'] and frozen['knowledge']['knowledge_version_id']
        image_owners = frozen['image_owners']
        assert wire_target.startswith('@s')
        assert image_owners[frozen['audit_target']['overview_evidence_id']] == wire_target
        assert wire_target not in frozen['input_scope']['reference_sample_ids']
        assert frozen['input_scope']['reference_sample_ids']
        assert frozen['input_scope']['visual_source_count'] == len(set(image_owners.values()))
        assert {item['sample_id'] for item in frozen['consistency']['record']['references']} <= set(image_owners.values()), '比较事实必须带实际对应图像，不能只送比较JSON'
        target_view = next(view for view in views if image_owners[view['evidence_id']] == wire_target)
        comparison = next(view for view in views if image_owners[view['evidence_id']] != wire_target)
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
    client, bodies, responses = mllm_api
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
        synthesis = next(body for body in bodies if body['response_format']['json_schema']['name']=='AuditConclusion')
        frozen = json.loads(synthesis['messages'][0]['content'][0]['text'].split('冻结综合审计：',1)[1])
        check = frozen['knowledge']['checks'][0]
        assert check['status']=='conflicted'
        assert check['independent_support'] is True, '判据有分歧不等于没有独立图像支持'
        assert check['usable_for_judgment'] is False, '来源独立不代表尚有冲突的判据已可用于验收'
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
        feedback=json.loads(calls[1]['messages'][-1]['content'].split('输出校验结果：',1)[1])
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


@pytest.mark.parametrize('peer_count,leaf_limit,summary_limit,late_failure',[(5,2,8,False),(17,1,3,False),(5,2,8,True)])
def test_audit_capacity_covers_all_comparisons_and_keeps_earlier_counter_evidence(dataset, mllm_api, tmp_path, peer_count, leaf_limit, summary_limit, late_failure):
    from shutil import copyfile
    db, registry, config = dataset
    for index in range(peer_count):
        copyfile(tmp_path/'images/dent.png', tmp_path/f'images/peer-{index}.png')
    registry.rescan(config.dataset.id)
    original, _, defaults = mllm_api
    seen, leaves, synthesis_calls = [], [], []
    marker = '前批反对证据仍未消解'
    target = config.dataset.id+':dent.png'

    def respond(request):
        body = json.loads(request.content)
        parts = body['messages'][0]['content']
        text = parts[0]['text']
        if '冻结综合审计：' not in text:
            return original.send(request)
        frozen = json.loads(text.split('冻结综合审计：')[1])
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count':262144 if len(frozen['consistency']['results']) > leaf_limit or len(frozen.get('partial_conclusions',[]))>summary_limit else 1000, 'max_model_len':262144})
        synthesis_calls.append(body)
        views = [json.loads(part['text'][5:]) for part in parts if part['type']=='text' and part['text'].startswith('视觉证据：')]
        raw = [view['evidence_id'] for view in views if view['representation']=='raw']
        prior = frozen.get('partial_conclusions', [])
        if prior:
            peers = {item['result_id']: item['sample_id'] for item in frozen['consistency']['record']['references']}
            assert {view['evidence_id'] for view in views} <= set(frozen['image_owners']), '所有实际输入都应有来源归属'
            visual_owners = {frozen['image_owners'][view['evidence_id']] for view in views if view['representation']=='raw'}
            for node in prior:
                assert visual_owners & {peers[rid] for rid in node['input_result_ids']}, '每批汇总应带本批比较图，不能全部重复知识参考图'
            if len(frozen['comparison_coverage']['input_result_ids'])==frozen['comparison_coverage']['total_results']:
                assert any(marker in node['conclusion']['analysis_text'] for node in prior), '最终汇总必须看到前批反对证据'
            refs = list(dict.fromkeys(eid for node in prior for eid in node['conclusion']['evidence_ids']))
            result_ids = list(dict.fromkeys(rid for node in prior for item in node['conclusion']['basis'] for rid in item['consistency_result_ids']))
            assert set(refs)<=set(frozen['image_owners']),'子批次引用应保留其实际来源归属'
            description = marker if any(marker in node['conclusion']['analysis_text'] for node in prior) else '其他范围可见正常外观'
        else:
            comparisons = frozen['consistency']['results']
            ids = [item['result_id'] for item in comparisons]
            seen.extend((frozen['reference_binding'], identity) for identity in ids)
            leaves.append(frozen)
            if late_failure and len(leaves)==2:
                return httpx.Response(503,json={'error':{'message':'后批模型不可用'}})
            assert len(ids) <= leaf_limit
            assert {item['sample_id'] for item in frozen['consistency']['record']['references']} <= set(frozen['image_owners'].values())
            assert any(frozen['image_owners'][view['evidence_id']]==frozen['audit_target']['sample_id'] for view in views)
            refs, result_ids = raw, ids
            description = marker if len(leaves)==1 else '其他范围可见正常外观'
        result = dict(defaults['VlmResult'], suggested_label='UNCERTAIN', reason_category='INSUFFICIENT_EVIDENCE',
            description=description, analysis_text=description, observation='可见蓝色表面', applicable_rule='仅核对当前可见范围',
            normal_alternative='保留反光解释', label_relation='undetermined', proposed_slice=[], evidence_ids=refs,
            basis=[dict(text=description,evidence_ids=refs,knowledge_check_ids=[],consistency_result_ids=result_ids)])
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job=runtime.audit.start(dataset_id=config.dataset.id,sample_ids=[target],instruction='联合保留真实图像、前后批证据与未知项。')
        runtime.audit.wait(job['run_id'],20)
        final=runtime.audit.status(job['run_id'])
        if late_failure:
            assert final['status']=='FAILED' and final['failed']==1
            assert audit_job_sample(dict(run_id=job['run_id'],sample_id=target),db.db_path)['suggestion'] is None
            assert len(leaves)==2
            return
        assert final['status']=='COMPLETED', final['errors']
        child=runtime.jobs.status(final['batch_runs'][0])
        assert child['completed_batches']==child['total_batches']==1+len(synthesis_calls),'最终进度应保留全部实际视觉批次和汇总'
        detail=audit_job_sample(dict(run_id=job['run_id'],sample_id=target),db.db_path)
        expected={item['result_id'] for item in detail['consistency']['references']}
        restored = [child['model_reference_bindings'][binding][identity] for binding,identity in seen]
        assert set(restored)==expected and len(restored)==len(expected),'全部冻结比较应恰好进入一个视觉批次'
        assert len(leaves)>1
        analysis=detail['suggestion']['analysis']
        assert analysis['conclusion']['analysis_text']==marker
        assert analysis['conclusion']['suggested_label']=='UNCERTAIN'
        assert {source['sample']['sample_id'] for source in analysis['image_sources']} >= {item['sample_id'] for item in detail['consistency']['references']}
        assert set(analysis['conclusion']['basis'][0]['consistency_result_ids'])==expected
    finally:
        runtime.close()


def test_anomaly_audit_sends_original_and_quality_without_synthetic_annotation_crops(dataset, mllm_api, self_discovery_prompt, tmp_path):
    from PIL import Image
    db, registry, _ = dataset
    folder=tmp_path/'classification'
    for name,color in [('OK/a.png',(0,0,180)),('OK/b.png',(0,0,210)),('NG/c.png',(0,0,255))]:
        path=folder/name;path.parent.mkdir(parents=True,exist_ok=True);Image.new('RGB',(320,240),color).save(path)
    from iad_core.task.config import FolderRule
    from iad_core.dataset.folder_preview import preview_folder_dataset
    rules=[FolderRule(path='OK',role='normal'),FolderRule(path='NG',role='anomaly')]
    config=registry.import_dataset(dict(format='folder_classification',name='单一异常检测子集',root_dir=str(folder),
        rules=[rule.model_dump() for rule in rules],preview_fingerprint=preview_folder_dataset(str(folder),rules).preview_fingerprint))
    original, _, _=mllm_api
    observed=[]
    def respond(request):
        body=json.loads(request.content)
        if request.url.path.endswith('/chat/completions') and body['response_format']['json_schema']['name'] in ('JointAnalysis','AuditConclusion'):
            kind=body['response_format']['json_schema']['name']
            images=[json.loads(part['text'][5:]) for part in body['messages'][0]['content'] if part['type']=='text' and part['text'].startswith('视觉证据：')]
            observed.append(kind)
            assert all(image['dataset_format']=='folder_classification' and image['image_label'] in ('OK','NG') for image in images)
            assert all(image['role']!='roi' and image['crop_bbox']==[0,0,320,240] for image in images)
            if kind=='JointAnalysis':assert len(images)==1 and images[0]['image_label']=='NG'
        return original.send(request)
    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        ids=[config.dataset.id+':'+name for name in ['OK/a.png','OK/b.png','NG/c.png']]
        knowledge=runtime.knowledge.start(request=dict(images=ids,image_count=3),mining_prompt=self_discovery_prompt)
        runtime.jobs.wait(knowledge['run_id'],5)
        assert runtime.jobs.status(knowledge['run_id'])['status']=='COMPLETED'
        job=runtime.audit.start(dataset_id=config.dataset.id,sample_ids=[ids[-1]])
        runtime.audit.wait(job['run_id'],5)
        final=runtime.audit.status(job['run_id'])
        assert final['status']=='COMPLETED',final['errors']
        assert observed==['JointAnalysis','AuditConclusion']
        detail=audit_job_sample(dict(run_id=job['run_id'],sample_id=ids[-1]),db.db_path)
        assert not detail['suggestion']['analysis']['regions']
    finally:runtime.close()


@pytest.mark.parametrize('stage', ['JointAnalysis', 'AuditConclusion'])
@pytest.mark.parametrize('persistent', [False, True])
def test_missing_audit_fields_are_corrected_in_original_conversation(dataset, mllm_api, finding_response, stage, persistent):
    db, _, config = dataset
    original, _, _ = mllm_api
    generated, tokenized = [], []
    target = config.dataset.id+':dent.png'

    def respond(request):
        body = json.loads(request.content)
        response = original.send(request)
        if request.url.path.endswith('/tokenize'):
            tokenized.append(body)
            return response
        if body['response_format']['json_schema']['name'] != stage:
            return response
        generated.append(body)
        result = response.json()
        answer = json.loads(result['choices'][0]['message']['content'])
        if stage == 'JointAnalysis':
            refs = [json.loads(part['text'][5:])['evidence_id'] for part in body['messages'][0]['content']
                    if part['type']=='text' and part['text'].startswith('视觉证据：')]
            answer['findings'] = [dict(finding_response, check_ids=[], evidence_ids=[refs[0]])]
            if len(generated)==1 or persistent:
                del answer['findings'][0]['description']
        elif len(generated)==1 or persistent:
            del answer['applicable_rule']
            del answer['normal_alternative']
        result['choices'][0]['message']['content'] = json.dumps(answer, ensure_ascii=False)
        return httpx.Response(200, json=result)

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 8)
        final = runtime.audit.status(job['run_id'])
        assert len(generated)==2, final['errors']
        correction = generated[1]['messages']
        assert [message['role'] for message in correction] == ['user', 'assistant', 'user']
        assert correction[0] == generated[0]['messages'][0], '原完整提示词、Schema和所有图像必须逐字保留'
        prior = json.loads(correction[1]['content'])
        if stage=='JointAnalysis':
            assert 'description' not in prior['findings'][0]
        else:
            assert 'applicable_rule' not in prior and 'normal_alternative' not in prior
        feedback = json.loads(correction[-1]['content'].split('输出校验结果：',1)[1])
        assert feedback['schema_validation_errors']
        assert 'previous_response' not in feedback, '先前输出只保留在assistant消息中，不再重复转义嵌入'
        assert any(body['messages']==correction for body in tokenized), '容量校验必须计入完整纠正对话'
        if persistent:
            assert final['status']=='FAILED'
            assert audit_job_sample(dict(run_id=job['run_id'],sample_id=target),db.db_path)['suggestion'] is None
        else:
            assert final['status']=='COMPLETED', final['errors']
            detail = audit_job_sample(dict(run_id=job['run_id'],sample_id=target),db.db_path)
            assert detail['suggestion'] is not None
    finally:
        runtime.close()


@pytest.mark.parametrize('persistent', [False, True])
def test_audit_repair_receives_all_reference_and_text_errors_together(dataset, mllm_api, persistent):
    db, _, config = dataset
    original, _, _ = mllm_api
    generated = []
    target = config.dataset.id+':dent.png'

    def respond(request):
        body = json.loads(request.content)
        response = original.send(request)
        if request.url.path.endswith('/tokenize') or body['response_format']['json_schema']['name'] != 'AuditConclusion':
            return response
        generated.append(body)
        result = response.json()
        answer = json.loads(result['choices'][0]['message']['content'])
        if len(generated) > 1:
            feedback = json.loads(body['messages'][-1]['content'].split('输出校验结果：', 1)[1])
            errors = feedback['schema_validation_errors']
            paths = {tuple(error['loc']) for error in errors}
            assert paths == {('evidence_ids', 0), ('basis', 0, 'knowledge_check_ids', 0),
                             ('analysis_text',), ('normal_alternative',)}, '一次纠正应同时收到所有独立字段错误，不能先修引用再发现原有正文错误'
            assert any('@v999' in error['msg'] for error in errors)
            assert any('@k999' in error['msg'] for error in errors)
            assert any('@s0' in error['msg'] for error in errors)
        if len(generated) == 1 or persistent:
            answer['evidence_ids'] = ['@v999']
            answer['basis'][0]['knowledge_check_ids'] = ['@k999']
            answer['analysis_text'] = '待审图像@s0出现局部亮度变化。'
            del answer['normal_alternative']
        result['choices'][0]['message']['content'] = json.dumps(answer, ensure_ascii=False)
        return httpx.Response(200, json=result)

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(job['run_id'], 8)
        final = runtime.audit.status(job['run_id'])
        assert final['status'] == ('FAILED' if persistent else 'COMPLETED'), final['errors']
        assert len(generated) == 2
        assert generated[1]['messages'][0] == generated[0]['messages'][0]
        detail = audit_job_sample(dict(run_id=job['run_id'], sample_id=target), db.db_path)
        if persistent:
            assert detail['suggestion'] is None
            return
        assert all(identity.startswith('img_') for identity in detail['suggestion']['analysis']['conclusion']['evidence_ids'])
    finally:
        runtime.close()
