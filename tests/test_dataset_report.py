import json

import httpx
import pytest

from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


@pytest.mark.parametrize('bounded_context', [False, True])
def test_scope_report_is_model_generated_from_frozen_facts_and_survives_new_audits(dataset, mllm_api, bounded_context):
    from iad_core.workbench.dataset_reports import DatasetReports, DatasetReportStart
    from iad_core.workbench.report_requirements import REPORT_REQUIREMENTS

    db, _, config = dataset
    original, _, _ = mllm_api
    import base64
    import io
    from pathlib import Path
    from PIL import Image
    from iad_core.entry import dataset_scan
    mask = Image.new('L', (21,21),255)
    buffer = io.BytesIO()
    mask.save(buffer,'PNG')
    label_path = Path(config.annotations.root,'dent.json')
    annotations = json.loads(label_path.read_text())
    annotations['shapes'].append(dict(label='真实mask',shape_type='mask',points=[[50,50],[70,70]],
        mask=base64.b64encode(buffer.getvalue()).decode()))
    label_path.write_text(json.dumps(annotations))
    dataset_scan(dict(dataset_id=config.dataset.id), db.db_path)
    calls = []
    instruction = '逐项说明数据集与模型能力，给出真实数据依据、缺证与适用范围。'

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            body = json.loads(request.content)
            content = body['messages'][0]['content']
            if bounded_context and content[0]['text'].startswith(instruction) and sum(item['type']=='image_url' for item in content)>2:
                return httpx.Response(200,json={'count':260000,'max_model_len':262144})
            return original.send(request)
        body = json.loads(request.content)
        if body['response_format']['json_schema']['name'] != 'DatasetReportConclusion':
            return original.send(request)
        calls.append(body)
        text = body['messages'][0]['content'][0]['text']
        assert text.startswith(instruction+'\n冻结报告事实：')
        context = json.loads(text.split('\n冻结报告事实：', 1)[1])
        assert ':dent.png' not in json.dumps(body) and ':scratch.png' not in json.dumps(body), '模型报告输入使用请求内短引用，具体样本身份保留在冻结绑定中'
        assert all(case['sample_id'].startswith('@s') for case in context['cases'])
        assert context['statistics']['registered_samples'] == 4
        assert context['statistics']['audited_samples'] == (2 if bounded_context else 1)
        technical = context['statistics']['technical_evidence']
        assert technical['image_decoding']['numerator'] == technical['image_decoding']['denominator'] == 4
        assert technical['annotation_geometry']['numerator'] == technical['annotation_geometry']['denominator'] == 3
        assert technical['bbox_scale']['area_fraction']['count'] == 3
        assert context['statistics']['gold_by_policy'] == []
        refs = [json.loads(item['text'][5:])['evidence_id'] for item in body['messages'][0]['content']
            if item['type']=='text' and item['text'].startswith('视觉证据：')]
        assert len(refs) >= 1
        assert all(ref.startswith('@v') for ref in refs)
        if context.get('phase')=='report_summary':
            assert len(context['child_reports'])>=2
            assert all(eid.startswith('@v') for child in context['child_reports'] for eid in child['observed_evidence_ids'])
        result = dict(sections={key: dict(analysis='当前样本仅用于观察现有覆盖与证据，未提供独立评测真值。',
            conclusion='保留已观察范围，当前证据不足以推断部署表现。', status='needs_evidence',
            missing_evidence=['独立确认的参考真值与冻结预测协议'], sample_ids=[context['cases'][0]['sample_id']],
            evidence_ids=refs[:2]) for key in REPORT_REQUIREMENTS},
            dataset_analysis='已登记图像有实际观察记录，其余范围尚未充分审计。', dataset_conclusion='当前范围待补充独立确认。',
            model_analysis='现有输出为构建工具的审计建议，不是参评模型的独立测试成绩。', model_conclusion='尚不能比较参评模型能力。')
        return httpx.Response(200, json={'choices': [{'finish_reason':'stop','message':{'content':json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    reports = DatasetReports(db, runtime.models.client, runtime.jobs)
    target = config.dataset.id+':dent.png'
    try:
        audit = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target, config.dataset.id+':scratch.png'] if bounded_context else [target])
        runtime.audit.wait(audit['run_id'], 5)
        request = DatasetReportStart(dataset_ids=[config.dataset.id], instruction=instruction)
        job = reports.start(request)
        runtime.jobs.wait(job['run_id'], 8)
        final = runtime.jobs.status(job['run_id'])
        assert final['status']=='COMPLETED', final['errors']
        assert len(calls)>1 if bounded_context else len(calls)==1
        result = DatasetReports.read(db, job['run_id'])
        bindings=runtime.jobs.status(job['run_id'])['model_reference_bindings']
        for body in calls:
            frozen=json.loads(body['messages'][0]['content'][0]['text'].split('冻结报告事实：',1)[1])
            assert target in bindings[frozen['reference_binding']].values()
        assert all(eid.startswith('img_') for section in result.conclusion.sections.values() for eid in section.evidence_ids)
        assert all(sid.startswith(config.dataset.id+':') for section in result.conclusion.sections.values() for sid in section.sample_ids)
        assert result.facts.included_run_ids == [audit['run_id']]
        assert result.instruction == instruction
        assert set(result.conclusion.sections) == set(REPORT_REQUIREMENTS)
        assert result.conclusion.dataset_conclusion == '当前范围待补充独立确认。'
        snapshot = result.model_dump_json(round_trip=True)
        assert reports.start(request)['run_id']==job['run_id'], '同一提交不能重新生成报告'
        second = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(second['run_id'], 5)
        assert DatasetReports.read(db, job['run_id']).model_dump_json(round_trip=True) == snapshot
        output = DatasetReports.export(db, job['run_id'])
        assert 'data:image/png;base64,' in output['html']
        assert '当前范围待补充独立确认。' in output['html']
        assert all(requirement['title'] in output['html'] for requirement in REPORT_REQUIREMENTS.values())
        assert '/api/iad/' not in output['html'] and 'https://' not in output['html']
        assert 'viewBox="0 0 320 240"' in output['html'], '离线图像必须以原图坐标呈现真实标注'
        assert '<rect x="10' in output['html']
        assert 'class="annotation-mask"' in output['html']
        assert '.annotations .annotation-mask{fill:#ffb74c;fill-opacity:.45;stroke:none}' in output['html'], '真实mask必须显示填充，不被共享框样式覆盖'
        assert '<meter' in output['html'], '离线报告保留与页面同口径的统计图'
        assert reports.list([config.dataset.id])[0]['run_id']==job['run_id']
        state = DatasetReports.status(db, job['run_id'])
        assert state.status == 'COMPLETED' and state.total_samples == 4
        assert 'facts' not in state.model_dump() and 'request' not in state.model_dump(), '轮询不返回大冻结上下文'
        view = DatasetReports.view(db, job['run_id'])
        assert view.scope_dataset_ids == [config.dataset.id]
        assert view.registered_samples == 4 and view.audited_samples == (2 if bounded_context else 1)
        assert len(view.evidence) >= 2
        assert view.evidence[0].source.annotations
        assert all(item.image.crop_bbox==[0,0,*item.image.original_size] for item in view.evidence)
        assert {item.label for item in view.data['detection_metrics']} >= {'Test Recall', 'TP', 'FN', 'I-AUROC', 'I-AP'}
        assert all(item.value=='不可计算' and item.basis for item in view.data['detection_metrics'])
        assert {item.label for item in view.data['efficiency_metrics']} >= {'p50 延迟', 'p95 延迟', '吞吐', '显存', '内存'}
    finally:
        runtime.close()


@pytest.mark.parametrize('persistent', [False, True])
@pytest.mark.parametrize('reference_field', ['evidence_ids', 'sample_ids'])
def test_report_repairs_unknown_evidence_once_and_preserves_frozen_input(dataset, mllm_api, persistent, reference_field):
    from iad_core.workbench.dataset_report_models import DatasetReportStart
    from iad_core.workbench.report_requirements import REPORT_REQUIREMENTS

    db, _, config = dataset
    original, _, _ = mllm_api
    calls = []

    def respond(request):
        body = json.loads(request.content)
        if request.url.path.endswith('/tokenize') or body['response_format']['json_schema']['name'] != 'DatasetReportConclusion':
            return original.send(request)
        calls.append(body)
        facts = json.loads(body['messages'][0]['content'][0]['text'].split('冻结报告事实：', 1)[1])
        refs = [json.loads(part['text'][5:])['evidence_id'] for part in body['messages'][0]['content']
            if part['type']=='text' and part['text'].startswith('视觉证据：')]
        result = dict(sections={key: dict(status='needs_evidence', analysis='当前范围有实际图像，缺少独立参考真值。',
            conclusion='只能报告当前已观察的范围。', missing_evidence=['独立确认的真值'],
            sample_ids=[facts['cases'][0]['sample_id']], evidence_ids=refs[:1]) for key in REPORT_REQUIREMENTS},
            dataset_analysis='已观察图像包含可见结构变化。', dataset_conclusion='当前范围需要补充独立依据。',
            model_analysis='没有独立预测及真值，不能计算模型成绩。', model_conclusion='当前不能评价模型准确率。')
        if len(calls)==1 or persistent:
            result['sections']['technical_usability'][reference_field]=['@v999' if reference_field=='evidence_ids' else '@s999']
        if len(calls)>1:
            feedback=json.loads(body['messages'][-1]['content'].split('输出校验结果：',1)[1])
            assert any(tuple(error['loc'])==('sections','technical_usability',reference_field,0)
                and ('@v999' if reference_field=='evidence_ids' else '@s999') in error['msg'] for error in feedback['schema_validation_errors'])
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result,ensure_ascii=False)}}]})

    runtime = WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        audit=runtime.audit.start(dataset_id=config.dataset.id,sample_ids=[config.dataset.id+':dent.png'])
        runtime.audit.wait(audit['run_id'],5)
        reports=runtime.models.dataset_reports
        job=reports.start(DatasetReportStart(dataset_ids=[config.dataset.id]))
        runtime.jobs.wait(job['run_id'],8)
        final=runtime.jobs.status(job['run_id'])
        assert len(calls)==2, '报告未知引用也必须有一次模型自行纠正机会，不能直接失败或程序猜测引用'
        assert calls[1]['messages'][0]==calls[0]['messages'][0]
        assert [part['role'] for part in calls[1]['messages']]==['user','assistant','user']
        assert final['status']==('FAILED' if persistent else 'COMPLETED'),final['errors']
        if persistent:
            with pytest.raises(LookupError,match='尚未生成'):
                reports.read(db,job['run_id'])
        else:
            report=reports.read(db,job['run_id'])
            assert set(report.conclusion.sections)==set(REPORT_REQUIREMENTS)
            assert all(eid.startswith('img_') for section in report.conclusion.sections.values() for eid in section.evidence_ids)
            assert report.conclusion.sections['technical_usability'].sample_ids==[config.dataset.id+':dent.png']
    finally:
        runtime.close()


def test_json_object_report_receives_actual_schema_in_its_complete_editable_prompt(dataset, mllm_api):
    from iad_core.workbench.dataset_reports import DatasetReports, DatasetReportStart
    from iad_core.workbench.report_requirements import DEFAULT_REPORT_PROMPT, REPORT_REQUIREMENTS

    db, _, config = dataset
    original, _, _ = mllm_api
    runtime = WorkbenchRuntime(db, VlmClient(original))
    calls=[]

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        body=json.loads(request.content);calls.append(body)
        assert body['response_format']=={'type':'json_object'}
        text=body['messages'][0]['content'][0]['text']
        schemas=[json.loads(line) for line in text.splitlines() if line.startswith('{"$defs"')]
        assert len(schemas)==1, 'json_object模式下必须通过完整可编辑提示词提供实际Schema，不能只提到未提供的Schema'
        schema=schemas[0]
        assert set(schema['required'])=={'sections','dataset_analysis','dataset_conclusion','model_analysis','model_conclusion'}
        sections=schema['$defs'][schema['properties']['sections']['$ref'].split('/')[-1]]
        assert set(sections['required'])==set(REPORT_REQUIREMENTS)
        assert text.startswith(DEFAULT_REPORT_PROMPT.replace('{{response_schema}}',json.dumps(schema,ensure_ascii=False))+'\n冻结报告事实：')
        assert '{{response_schema}}' not in text
        facts=json.loads(text.split('冻结报告事实：',1)[1])
        refs=[json.loads(item['text'][5:])['evidence_id'] for item in body['messages'][0]['content']
            if item['type']=='text' and item['text'].startswith('视觉证据：')]
        result=dict(sections={key:dict(status='needs_evidence',analysis='观察范围有图像记录，缺独立依据。',
            conclusion='当前不能评价实际模型成绩。',missing_evidence=['独立真值与预测'],sample_ids=[facts['cases'][0]['sample_id']],evidence_ids=refs[:1])
            for key in REPORT_REQUIREMENTS},dataset_analysis='当前存在未审计图像。',dataset_conclusion='需补充范围核验。',
            model_analysis='没有独立模型成绩。',model_conclusion='不可计算实际准确率。')
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps(result,ensure_ascii=False)}}]})

    client=None
    try:
        audit=runtime.audit.start(dataset_id=config.dataset.id,sample_ids=[config.dataset.id+':dent.png'])
        runtime.audit.wait(audit['run_id'],5)
        profile=runtime.models.client.profile.model_copy(update={'request_parameters':{'response_format':{'type':'json_object'}}})
        client=VlmClient(httpx.Client(transport=httpx.MockTransport(respond)),profile=profile)
        reports=DatasetReports(db,client,runtime.jobs)
        job=reports.start(DatasetReportStart(dataset_ids=[config.dataset.id]))
        runtime.jobs.wait(job['run_id'],8)
        final=runtime.jobs.status(job['run_id'])
        assert final['status']=='COMPLETED',final['errors']
        assert len(calls)==1
        assert reports.read(db,job['run_id']).instruction==DEFAULT_REPORT_PROMPT
    finally:
        runtime.close()
        if client:client.close()
