import json
from shutil import copyfile
import base64
import io
import threading
from uuid import uuid4

import httpx
import pytest
from PIL import Image
from iad_core.dataset.registry import DatasetRegistry, DatasetImport

from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.gallery import GalleryQueries, GalleryQuery
from iad_core.consistency.group_analysis import GroupAnalyses
from iad_core.consistency.group_analysis_models import GroupAnalysisStart
from iad_core.consistency.result_models import ConsistencyQuery
from iad_core.consistency.result_queries import ResultQueries
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient
from iad_core.workbench.model_profile import ModelProfile


@pytest.mark.parametrize('capacity', [12, 3])
def test_default_joint_analysis_uses_one_model_batch_when_it_fits_and_splits_without_omissions(dataset, tmp_path, capacity):
    db, registry, config = dataset
    for index in range(11):
        copyfile(tmp_path/'images/dent.png', tmp_path/f'images/candidate-{index}.png')
        copyfile(tmp_path/'labels/dent.json', tmp_path/f'labels/candidate-{index}.json')
    registry.rescan(config.dataset.id)
    observed = []

    def respond(request):
        body = json.loads(request.content)
        text = body['messages'][0]['content'][0]['text']
        visual = '冻结图组：' in text
        group = json.JSONDecoder().raw_decode(text.split('冻结图组：')[1])[0] if visual else None
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 262144 if visual and len(group['candidates']) > capacity else 1000, 'max_model_len':262144})
        if visual:
            names={source['sample_id']:config.dataset.id+':'+source['name'] for source in group['sources'].values()}
            observed.append({names[sid] for sid in group['candidates']})
            refs = [dict(candidate_id=sid, comparison=dict(result_id=member['comparison']['result_id'], evidence_id=member['comparison']['evidence_id']))
                for sid, member in group['candidates'].items()]
        else:
            summaries=json.JSONDecoder().raw_decode(text.split('冻结批次分析：')[1])[0]
            refs=[ref for node in summaries['summaries'] for ref in node['result']['overall']['references']]
        result = dict(overall=dict(verdict='UNCERTAIN', text=None, references=refs),
            conclusions=[dict(text='保留当前图像的标注比较依据', references=refs)], limitations=[])
        if visual:
            result['assessments'] = [dict(candidate_id=ref['candidate_id'], verdict='UNCERTAIN', categories=[],conclusion=None, explanation='当前缺少直接比较证据', findings=[]) for ref in refs]
        return httpx.Response(200, json={'choices':[{'finish_reason':'stop', 'message':{'content':json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond)),
        profile=ModelProfile(endpoint='http://model/v1', model_id='fixture-model', capacity_mode='vllm_tokenize',
            context_tokens=262144, max_output_tokens=32768)))
    try:
        anchor = config.dataset.id+':dent.png'
        expected = {config.dataset.id+':'+name+'.png' for name in ['scratch', *[f'candidate-{index}' for index in range(11)]]}
        for candidate in sorted(expected):
            runtime.consistency_service.compare(ConsistencyCompare(sample_a=anchor, sample_b=candidate))
        page = ResultQueries(db).query(ConsistencyQuery(selection={'kind':'scope','subjects':{'kind':'all_registered'}}))
        group = GalleryQueries(db).query(GalleryQuery(query_id=page.query_id,kind='groups')).items[0]
        request = GroupAnalysisStart(query_id=page.query_id,kind='groups',group_id=group.group_id,request_id='joint-default-capacity')
        analyses = GroupAnalyses(runtime, runtime.client)
        started = analyses.start(request)
        runtime.jobs.wait(started.run_id,10)
        result = analyses.read(request)
        assert result.status == 'COMPLETED', result.error
        assert len(observed) == (1 if capacity == 12 else 4), '容量允许时不人为切成很多小图组；超限才拆分'
        assert set.union(*observed) == expected
        assert sum(map(len,observed)) == len(expected)
        assert {item.candidate_id for item in result.result.assessments} == expected
        generated=len(observed)
        next_request=request.model_copy(update={'request_id':'reuse-capacity-qualified-batches'})
        reused=analyses.start(next_request)
        runtime.jobs.wait(reused.run_id,10)
        next_result=analyses.read(next_request)
        assert next_result.status=='COMPLETED',next_result.error
        assert len(observed)==generated, '容量动态拆分后仍应复用实际输入完全一致的合格批次'
        saved=runtime.jobs.status(reused.run_id)
        assert all(batch['run_id']==started.run_id for batch in saved['group_analysis_batches'])
        assert {item.candidate_id for item in next_result.result.assessments}==expected
    finally:
        runtime.close()


def test_group_analysis_persists_visual_batches_and_resumes_before_model_synthesis(dataset,tmp_path):
    db,registry,config=dataset
    for index in range(3):
        copyfile(tmp_path/'images/dent.png',tmp_path/f'images/third{index}.png')
        copyfile(tmp_path/'labels/dent.json',tmp_path/f'labels/third{index}.json')
    registry.rescan(config.dataset.id)
    calls=[]
    citations={}

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        body=json.loads(request.content)
        parts=body['messages'][0]['content']
        schema=body['response_format']['json_schema']['name']
        calls.append(schema)
        if schema=='GroupAnalysisDraft':
            payload=json.JSONDecoder().raw_decode(parts[0]['text'].split('冻结图组：')[1])[0]
            assert len(payload['candidates'])<=2
            definitions=body['response_format']['json_schema']['schema']['$defs']
            expected=set(payload['candidates'])
            assert {branch['properties']['candidate_id']['enum'][0] for branch in definitions['GroupAnalysisReference']['anyOf']}==expected
            assert set(definitions['GroupPairAssessment']['properties']['candidate_id']['enum'])==expected
            assert set(definitions['GroupAnalysisComparison']['properties']['evidence_id']['enum'])=={
                member['comparison']['evidence_id'] for member in payload['candidates'].values()}
            assert any(part['type']=='image_url' for part in parts)
            refs=[]
            for candidate,member in payload['candidates'].items():
                pair=member['comparison']
                ref=dict(candidate_id=candidate,comparison=dict(result_id=pair['result_id'],evidence_id=pair['evidence_id']))
                citations[candidate]=ref
                refs.append(ref)
            if len(calls) in (2, 3):
                return httpx.Response(200,json={'choices':[{'message':{'content':'{}'}}]})
            result=dict(overall=dict(verdict='MATERIAL',text='类别不一致',references=refs),
                assessments=[dict(candidate_id=ref['candidate_id'],verdict='MATERIAL',categories=['类别不一致'],conclusion='类别不一致',explanation='本批图像存在标注差异',findings=['标注不同']) for ref in refs],
                conclusions=[dict(text='本批标注不同',references=refs)],limitations=[])
        else:
            assert schema=='GroupAnalysisSummary'
            definitions=body['response_format']['json_schema']['schema']['$defs']
            assert {branch['properties']['candidate_id']['enum'][0] for branch in definitions['GroupAnalysisReference']['anyOf']}==set(citations)
            assert not any(part['type']=='image_url' for part in parts)
            summaries=json.JSONDecoder().raw_decode(parts[0]['text'].split('冻结批次分析：')[1])[0]
            refs=[ref for node in summaries['summaries'] for ref in node['result']['overall']['references']]
            result=dict(overall=dict(verdict='MATERIAL',text='类别不一致',references=refs),
                conclusions=[dict(text='已完成批次均有标注差异',references=refs)],limitations=['汇总依据已保存的逐批视觉分析'])
        return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps(result)}}]})

    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        anchor=config.dataset.id+':dent.png'
        for name in ('scratch','third0','third1','third2'):
            runtime.consistency_service.compare(ConsistencyCompare(sample_a=anchor,sample_b=config.dataset.id+':'+name+'.png'))
        page=ResultQueries(db).query(ConsistencyQuery(selection={'kind':'scope','subjects':{'kind':'all_registered'}}))
        group=GalleryQueries(db).query(GalleryQuery(query_id=page.query_id,kind='groups')).items[0]
        request=GroupAnalysisStart(query_id=page.query_id,kind='groups',group_id=group.group_id,request_id='batched-analysis',batch_size=2)
        analyses=GroupAnalyses(runtime,runtime.client)
        first=analyses.start(request)
        runtime.jobs.wait(first.run_id,5)
        failed=runtime.jobs.status(first.run_id)
        assert failed['status']=='PARTIAL',failed['errors']
        assert failed['completed']==2 and failed['failed']==3
        assert len(failed['group_analysis_batches'])==1
        old_batch=failed['group_analysis_batches'][0]
        assert analyses.read(request).result is None
        resumed=analyses.retry(first.run_id)
        runtime.jobs.wait(resumed['run_id'],5)
        final=runtime.jobs.status(resumed['run_id'])
        assert final['status']=='COMPLETED',final['errors']
        assert final['completed']==3
        assert final['group_analysis_batches'][0]==old_batch
        result=analyses.read(request)
        assert len(result.result.assessments)==4
        assert len({item.candidate_id for item in result.result.assessments})==4
        assert calls==['GroupAnalysisDraft','GroupAnalysisDraft','GroupAnalysisDraft','GroupAnalysisDraft','GroupAnalysisSummary']
    finally:
        runtime.close()


@pytest.mark.parametrize('corrected', [True, False])
@pytest.mark.parametrize('error_kind', ['overall_verdict','descriptive_text'])
def test_group_synthesis_corrects_its_output_once_and_keeps_completed_visual_batches(dataset, tmp_path, corrected, error_kind):
    db, registry, config = dataset
    copyfile(tmp_path/'images/dent.png', tmp_path/'images/third.png')
    copyfile(tmp_path/'labels/dent.json', tmp_path/'labels/third.json')
    registry.rescan(config.dataset.id)
    calls = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 262144})
        body = json.loads(request.content)
        name = body['response_format']['json_schema']['name']
        calls.append(body)
        prompt = body['messages'][0]['content'][0]['text']
        if name == 'GroupAnalysisDraft':
            payload = json.JSONDecoder().raw_decode(prompt.split('冻结图组：', 1)[1])[0]
            candidate, member = next(iter(payload['candidates'].items()))
            citation = dict(candidate_id=candidate, comparison=dict(result_id=member['comparison']['result_id'], evidence_id=member['comparison']['evidence_id']))
            names={source['sample_id']:source['name'] for source in payload['sources'].values()}
            verdict = 'MATERIAL' if names[candidate]=='scratch.png' else 'UNCERTAIN'
            result = dict(overall=dict(verdict=verdict, text='类别不一致' if verdict=='MATERIAL' else None, references=[citation]),
                assessments=[dict(candidate_id=candidate, verdict=verdict, categories=['类别不一致'] if verdict=='MATERIAL' else [], conclusion='类别不一致' if verdict=='MATERIAL' else None, explanation='保留原始标注的可见差异或证据限制', findings=[])],
                conclusions=[dict(text='仅概括本批实际观察', references=[citation])], limitations=[])
        else:
            assert name == 'GroupAnalysisSummary'
            assert not any(part['type'] == 'image_url' for part in body['messages'][0]['content'])
            attempts = sum(call['response_format']['json_schema']['name'] == name for call in calls)
            summaries=json.JSONDecoder().raw_decode(prompt.split('冻结批次分析：')[1])[0]
            refs=[ref for node in summaries['summaries'] for ref in node['result']['overall']['references']]
            result = dict(overall=dict(verdict='MATERIAL' if corrected and attempts == 2 else 'UNCERTAIN', text='类别不一致' if corrected and attempts==2 else None, references=refs),
                conclusions=[dict(text='部分成员已确认差异，另有成员证据不足，两者均须保留', references=refs)], limitations=[])
            if error_kind=='descriptive_text':
                result['overall']['verdict']='MATERIAL'
                if attempts==1 or not corrected:
                    result['overall']['text']='批次@c1存在差异'
                    result['conclusions'][0]['text']='part.png 的标注差异仍需保留'
                    result['limitations']=['图像@c2尚有未知项']
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(result)}}]})

    runtime = WorkbenchRuntime(db, VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        for name in ('scratch', 'third'):
            runtime.consistency_service.compare(ConsistencyCompare(sample_a=config.dataset.id+':dent.png', sample_b=config.dataset.id+':'+name+'.png'))
        page = ResultQueries(db).query(ConsistencyQuery(selection={'kind': 'scope', 'subjects': {'kind': 'all_registered'}}))
        group = GalleryQueries(db).query(GalleryQuery(query_id=page.query_id, kind='groups')).items[0]
        request = GroupAnalysisStart(query_id=page.query_id, kind='groups', group_id=group.group_id, request_id='summary-repair', batch_size=1)
        analyses = GroupAnalyses(runtime, runtime.client)
        job = analyses.start(request)
        runtime.jobs.wait(job.run_id, 5)
        view = analyses.read(request)
        assert [call['response_format']['json_schema']['name'] for call in calls] == [
            'GroupAnalysisDraft', 'GroupAnalysisDraft', 'GroupAnalysisSummary', 'GroupAnalysisSummary']
        feedback = json.loads(calls[-1]['messages'][-1]['content'].split('输出校验结果：', 1)[1])
        original=json.loads(calls[-1]['messages'][1]['content'])
        if error_kind=='descriptive_text':
            assert {tuple(issue['loc']) for issue in feedback['schema_validation_errors']} == {
                ('overall','text'),('conclusions',0,'text'),('limitations',0)}
            assert original['conclusions'][0]['text']=='part.png 的标注差异仍需保留'
            assert original['overall']['verdict']=='MATERIAL'
        else:
            assert '批次汇总结论与实际逐批结论不一致' in feedback['schema_validation_errors'][0]['msg']
            assert original['overall']['verdict']=='UNCERTAIN'
        saved = runtime.jobs.status(job.run_id)
        assert len(saved['group_analysis_batches']) == 2
        if corrected:
            assert view.status == 'COMPLETED', view.error
            assert view.result.overall.verdict == 'MATERIAL'
            assert {item.verdict for item in view.result.assessments} == {'MATERIAL', 'UNCERTAIN'}
        else:
            assert view.status == 'PARTIAL' and view.result is None
            assert saved['completed'] == 2 and saved['failed'] == 1
    finally:
        runtime.close()


def test_full_scope_consistency_sends_distinct_images_to_mllm_without_requiring_exact_groups(knowledge_dataset):
    db,config=knowledge_dataset
    observed=[]
    generations=[]

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        body=json.loads(request.content)
        generations.append(body)
        parts=body['messages'][0]['content']
        assert '只分析当前冻结范围的真实标注' in parts[0]['text']
        payload=json.JSONDecoder().raw_decode(parts[0]['text'].split('冻结图组：')[1])[0]
        observed.extend(config.dataset.id+':'+source['name'] for source in payload['sources'].values())
        assert any(part['type']=='image_url' for part in parts)
        if len(generations) in (1, 2):
            return httpx.Response(200,json={'choices':[{'message':{'content':'{}'}}]})
        refs=[dict(candidate_id=identity,comparison=dict(result_id=member['comparison']['result_id'],evidence_id=member['comparison']['evidence_id']))
              for identity,member in payload['candidates'].items()]
        result=dict(overall=dict(verdict='UNCERTAIN',text=None,references=refs),
            assessments=[dict(candidate_id=ref['candidate_id'],verdict='UNCERTAIN',categories=[],conclusion=None,explanation='逐批查看原图后仍需补充可比较部位',findings=[]) for ref in refs],
            conclusions=[dict(text='保留不同图像的比较限制',references=refs)],limitations=['图像并非严格相同'])
        return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps(result)}}]})

    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        request=dict(submission_id=str(uuid4()),subjects={'kind':'datasets','dataset_ids':[config.dataset.id]},batch_size=3,candidate_batch_size=2,instruction='只分析当前冻结范围的真实标注')
        started=runtime.models.consistency_model_batches.start(request)
        assert runtime.models.consistency_model_batches.start(request)['run_id']==started['run_id']
        runtime.jobs.wait(started['run_id'],10)
        partial=runtime.jobs.status(started['run_id'])
        assert partial['status']=='PARTIAL',partial['errors']
        assert partial['completed']==partial['failed']==3
        resumed=runtime.models.consistency_model_batches.retry(started['run_id'])
        runtime.jobs.wait(resumed['run_id'],10)
        completed=runtime.jobs.status(resumed['run_id'])
        assert completed['status']=='COMPLETED',completed['errors']
        assert completed['completed']==completed['total_samples']==3
        assert completed['completed_batches']==completed['total_batches']==2
        assert len(completed['batch_runs'])==1
        assert set(completed['sample_ids'])==set(partial['failed_sample_ids'])
        assert set(observed)==set(partial['sample_ids'])
        assert len(generations)==4
        query=ResultQueries(db).query(ConsistencyQuery(selection={'kind':'scope','subjects':{'kind':'datasets','dataset_ids':[config.dataset.id]}}))
        assert GalleryQueries(db).query(GalleryQuery(query_id=query.query_id,kind='groups')).total==0
        assert all(runtime.jobs.status(run_id)['group_analysis']['overall']['verdict']=='UNCERTAIN' for run_id in completed['batch_runs'])
    finally:
        runtime.close()


def test_labelme_mask_consistency_sends_frozen_annotation_shape_with_full_and_cropped_pixels(defect_dataset):
    db,dataset,original,_=defect_dataset
    calls=[]

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        parts=json.loads(request.content)['messages'][0]['content']
        descriptors=[json.loads(item['text'].removeprefix('视觉证据：')) for item in parts
                     if item['type']=='text' and item['text'].startswith('视觉证据：')]
        calls.append(descriptors)
        payload=json.JSONDecoder().raw_decode(parts[0]['text'].split('冻结图组：')[1])[0]
        refs=[dict(candidate_id=identity,comparison=dict(result_id=member['comparison']['result_id'],evidence_id=member['comparison']['evidence_id']))
              for identity,member in payload['candidates'].items()]
        counts={source['sample_id']:len(source['annotations']) for source in payload['sources'].values()}
        category='多类别' if counts[payload['anchor']['sample_id']]>counts[refs[0]['candidate_id']] else '少类别'
        result=dict(overall=dict(verdict='MATERIAL',text=category,references=refs),
            assessments=[dict(candidate_id=ref['candidate_id'],verdict='MATERIAL',categories=[category],conclusion=category,explanation='真实图像与标注已提供',findings=[]) for ref in refs],
            conclusions=[dict(text='保留差异与限制',references=refs)],limitations=[])
        masks=[index for index,item in enumerate(descriptors) if item['representation']=='annotation_mask']
        assert masks,'Labelme mask须随JSON、整图及裁剪一起送入模型'
        images=[item for item in parts if item['type']=='image_url']
        with Image.open(io.BytesIO(base64.b64decode(images[masks[0]]['image_url']['url'].split(',',1)[1]))) as mask:
            assert {value for _,value in mask.convert('L').getcolors()}=={0,255}
        assert any(item['role']=='overview' and item['sent_size']==[320,240] for item in descriptors)
        assert any(item['role']=='roi' and item['representation']=='raw' for item in descriptors)
        return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps(result)}}]})

    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job=runtime.models.consistency_model_batches.start(dict(subjects={'kind':'samples',
            'sample_ids':[dataset['dataset_id']+':part-0.png',original['sample']['sample_id']]},batch_size=2))
        runtime.jobs.wait(job['run_id'],5)
        final=runtime.jobs.status(job['run_id'])
        assert final['status']=='COMPLETED',final['errors']
        assert len(calls)==1
    finally:
        runtime.close()


def test_active_cross_dataset_model_scope_prevents_deleting_other_member_and_cancels_child(dataset,tmp_path):
    db,registry,config=dataset
    images,labels=tmp_path/'other-images',tmp_path/'other-labels'
    images.mkdir();labels.mkdir()
    for index in range(2):
        Image.new('RGB',(320,240),(40+index,100,190)).save(images/f'other-{index}.png')
    other=registry.import_labelme(DatasetImport(format='labelme',name='另一子集',image_dir=str(images),annotation_dir=str(labels)))
    entered,release=threading.Event(),threading.Event()

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':1000,'max_model_len':262144})
        entered.set()
        assert release.wait(5)
        return httpx.Response(200,json={'choices':[{'message':{'content':'{}'}}]})

    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        started=runtime.models.consistency_model_batches.start(dict(subjects={'kind':'datasets',
            'dataset_ids':[config.dataset.id,other.dataset.id]},batch_size=3))
        assert entered.wait(5)
        foreign=next(identity for identity in [config.dataset.id,other.dataset.id] if identity!=started['dataset_id'])
        with pytest.raises(ValueError,match='执行'):
            DatasetRegistry(db).delete(foreign)
        runtime.jobs.cancel(started['run_id'],('CONSISTENCY_MODEL_BATCH',))
        release.set()
        runtime.jobs.wait(started['run_id'],5)
        stopped=runtime.jobs.status(started['run_id'])
        assert stopped['status']=='CANCELLED',stopped['errors']
        assert stopped['completed']==stopped['failed']==0
        assert stopped['unprocessed']==6
        assert all(runtime.jobs.status(identity)['status']=='CANCELLED' for identity in stopped['batch_runs'])
    finally:
        release.set()
        runtime.close()


def test_consistency_keeps_all_annotation_crops_when_actual_model_capacity_allows_them(tmp_path):
    images,labels=tmp_path/'dense-images',tmp_path/'dense-labels'
    images.mkdir();labels.mkdir()
    image=Image.new('RGB',(320,240),'#c0c0c0')
    shapes=[]
    for index in range(20):
        x,y=10+(index%5)*50,10+(index//5)*50
        image.putpixel((x+5,y+5),(index*10,30,90))
        shapes.append(dict(label='14',shape_type='rectangle',points=[[x,y],[x+10,y+10]]))
    for name,label in [('left','14'),('right','18')]:
        image.save(images/(name+'.png'))
        (labels/(name+'.json')).write_text(json.dumps(dict(imageWidth=320,imageHeight=240,
            shapes=[dict(shape,label=label) for shape in shapes])))
    from iad_core.storage.database import Database
    db=Database(str(tmp_path/'dense.db'))
    registry=DatasetRegistry(db)
    config=registry.import_labelme(DatasetImport(format='labelme',name='密集标注',image_dir=str(images),annotation_dir=str(labels)))
    counts=[]

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200,json={'count':4000,'max_model_len':262144})
        parts=json.loads(request.content)['messages'][0]['content']
        counts.append(sum(part['type']=='image_url' for part in parts))
        payload=json.JSONDecoder().raw_decode(parts[0]['text'].split('冻结图组：')[1])[0]
        refs=[dict(candidate_id=identity,comparison=dict(result_id=member['comparison']['result_id'],evidence_id=member['comparison']['evidence_id']))
            for identity,member in payload['candidates'].items()]
        result=dict(overall=dict(verdict='MATERIAL',text='类别不一致',references=refs),
            assessments=[dict(candidate_id=ref['candidate_id'],verdict='MATERIAL',categories=['类别不一致'],conclusion='类别不一致',explanation='对应标注类别不同',findings=['类别不同']) for ref in refs],
            conclusions=[dict(text='全部标注位置与裁剪已保留',references=refs)],limitations=[])
        return httpx.Response(200,json={'choices':[{'message':{'content':json.dumps(result)}}]})

    runtime=WorkbenchRuntime(db,VlmClient(httpx.Client(transport=httpx.MockTransport(respond))))
    try:
        job=runtime.models.consistency_model_batches.start(dict(subjects={'kind':'datasets','dataset_ids':[config.dataset.id]},batch_size=2))
        runtime.jobs.wait(job['run_id'],5)
        result=runtime.jobs.status(job['run_id'])
        assert result['status']=='COMPLETED',result['errors']
        assert counts and counts[0]>16
    finally:
        runtime.close()
