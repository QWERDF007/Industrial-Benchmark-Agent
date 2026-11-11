import hashlib
import json
from uuid import uuid4

import pytest
from PIL import Image

from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.workbench.module_settings import ModuleSettings


@pytest.fixture
def scoped_media(agent_jobs, tmp_path):
    jobs, _, role = agent_jobs

    def create(size, annotation=None, pixels=None, module='exploration'):
        if module == 'knowledge':
            ModuleSettings(jobs.db).save({'module': 'knowledge', 'expected_revision': 0, 'settings': {'model': {'provider_id': 'swift-30003', 'model_id': 'fixture'}, 'whole_image_max_side': 1024}})
        directory = tmp_path / 'evidence-source'
        directory.mkdir()
        (pixels if pixels is not None else Image.new('RGB', size, 'gray')).save(directory / 'sample.png')
        if annotation is not None:
            (directory / 'sample.json').write_text(annotation if isinstance(annotation, str) else json.dumps(annotation))
        config = DatasetRegistry(jobs.db).import_labelme(DatasetImport(format='labelme', name='真实取证',
            image_dir=str(directory), annotation_dir=str(directory)))
        sid = config.dataset.id + ':sample.png'
        from iad_core.knowledge.instructions import default_directions
        request = {'submission_id': str(uuid4()), 'analysis_kind': module, 'dataset_ids': [config.dataset.id],
            **({'normal_images': [sid], 'prompt': {'text': '观察原图和全部标注局部。'}} if module == 'exploration' else
                {'mining_prompt': {'objective': '观察图像。', 'instruction': '观察原图和全部局部。', 'directions': [default_directions()[0].model_dump()]}})}
        job = jobs.start(request, agent=role)
        return job['run_id'], sid, directory

    return jobs, create


@pytest.mark.parametrize('module', ['exploration', 'knowledge'])
def test_thirty_original_rois_are_all_prepared_without_creating_coverage(scoped_media, module):
    jobs, create = scoped_media
    annotation = {'imageWidth': 320, 'imageHeight': 240, 'shapes': [dict(label='scratch', shape_type='rectangle',
        points=[[10 + 9 * index, 40], [15 + 9 * index, 45]]) for index in range(30)]}
    run_id, sid, directory = create((320, 240), annotation, module=module)
    original = (directory / 'sample.json').read_bytes()
    evidence = AnalysisEvidence(jobs)
    page = evidence.read(run_id, {'sample_id': sid})
    assert {item.image.representation for item in page.images} == ({'raw'} if module == 'exploration' else {'raw', 'annotation_mask'})
    rois = [item for item in page.images if item.image.role == 'roi' and item.image.representation == 'raw']
    assert len(rois) == 30
    assert len({item.model_context['annotations'][0]['annotation_id'] for item in rois}) == 30
    assert rois[0].model_context['annotations'][0]['bbox'] == [10, 40, 15, 45]
    assert Image.open(rois[0].path).size == (7, 7)
    if module == 'knowledge':
        last = evidence.read(run_id, {'sample_id': sid, 'offset': page.total - 1, 'limit': 1})
        assert len(last.images) == 1
        assert last.images[0] == page.images[-1]
    else:
        with pytest.raises(ValueError):
            evidence.read(run_id, {'sample_id': sid, 'offset': 1})
    assert jobs.jobs.status(run_id)['completed'] == 0
    assert (directory / 'sample.json').read_bytes() == original


@pytest.mark.parametrize('module', ['exploration', 'knowledge'])
def test_exploration_keeps_original_resolution_while_mining_uses_its_frozen_setting(scoped_media, module):
    jobs, create = scoped_media
    settings = ModuleSettings(jobs.db)
    settings.save({'module': 'exploration', 'expected_revision': 1, 'settings': {'whole_image_max_side': 1024}})
    run_id, sid, directory = create((2048, 1024), module=module)
    before = hashlib.sha256((directory / 'sample.png').read_bytes()).hexdigest()
    settings.save({'module': 'exploration', 'expected_revision': 2, 'settings': {'whole_image_max_side': 1280}})
    whole = AnalysisEvidence(jobs).read(run_id, {'sample_id': sid}).images[0]
    assert whole.image.original_size == [2048, 1024]
    assert whole.image.crop_bbox == [0, 0, 2048, 1024]
    assert whole.image.sent_size == ([2048, 1024] if module == 'exploration' else [1024, 512])
    assert Image.open(whole.path).size == tuple(whole.image.sent_size)
    assert hashlib.sha256((directory / 'sample.png').read_bytes()).hexdigest() == before


def test_unreadable_required_annotation_keeps_real_whole_image_and_its_error(scoped_media):
    jobs, create = scoped_media
    run_id, sid, directory = create((64, 48), '{broken-json')
    page = AnalysisEvidence(jobs).read(run_id, {'sample_id': sid})
    assert page.error == '原图可读，必需标注文件不可读'
    assert len(page.images) == 1
    assert page.images[0].image.sent_size == [64, 48]
    reopened = AnalysisEvidence(jobs).reference(run_id, {'evidence_id': page.images[0].image.evidence_id})
    assert reopened.images == page.images and reopened.error == page.error
    assert Image.open(page.images[0].path).size == (64, 48)
    assert jobs.jobs.status(run_id)['completed'] == 0
    assert (directory / 'sample.json').read_text() == '{broken-json'


@pytest.mark.parametrize('annotation',[None,{'imageWidth':64,'imageHeight':48,'shapes':[]}])
def test_registrations_without_annotation_geometry_use_the_whole_image_once(scoped_media,annotation):
    jobs, create = scoped_media
    run_id, sid, _ = create((64,48),annotation)
    page = AnalysisEvidence(jobs).read(run_id,{'sample_id':sid})
    assert page.error is None
    assert len(page.images) == 1
    assert page.images[0].image.role == 'overview'


def test_agent_crop_uses_frozen_raw_pixels_and_keeps_optional_evidence_out_of_required_coverage(scoped_media):
    from iad_core.analysis.commits import AnalysisCommits
    from iad_core.analysis.coverage import AnalysisCoverageReader
    from iad_core.workbench.calls import ModelCalls, NativeModelCallStart, NativeModelCallEnd

    jobs, create = scoped_media
    pixels=Image.new('RGB',(320,240),'gray')
    pixels.putpixel((20,30),(240,12,34))
    run_id,sid,_=create(pixels.size,pixels=pixels)
    evidence=AnalysisEvidence(jobs)
    whole=evidence.read(run_id,{'sample_id':sid}).images[0]
    page=evidence.crop(run_id,{'sample_id':sid,'bbox':[-10,30,40,500]})
    assert page.total == 1 and page.error is None
    crop=page.images[0]
    assert crop.image.crop_bbox == [0,30,40,240]
    assert crop.image.sent_size == [40,210]
    assert crop.image.source == 'model' and crop.image.representation == 'raw'
    assert crop.required is False
    assert crop.image.source_sha256 == whole.image.source_sha256
    with Image.open(crop.path) as actual:
        assert actual.getpixel((20,0)) == (240,12,34)
    assert evidence.crop(run_id,{'sample_id':sid,'bbox':[-10,30,40,500]}) == page
    assert len(evidence.prepare(run_id,sid).images) == 2
    submission=dict(commit_key='crop',base_revision=0,round_id=1,summary='局部观察。',directions=[],limitations=[],unresolved_questions=[],
        observations=[dict(sample_id=sid,dataset_id=whole.dataset_id,description='红色局部。',evidence_ids=[crop.image.evidence_id])])
    commits=AnalysisCommits(jobs)
    with pytest.raises(ValueError,match='实际模型请求'):
        commits.accept(run_id,submission)
    for index,item in enumerate([crop,whole]):
        call=NativeModelCallStart(call_id='call_'+uuid4().hex,started_at='2026-11-09T12:00:00Z',request={'fixture':'crop pixels'})
        ModelCalls(jobs.db).start_native(run_id,call,sample_id=None,session_id=jobs.state(run_id).session_id,attempt=1)
        evidence.delivered(run_id,call.call_id,[item.image.evidence_id])
        ModelCalls(jobs.db).finish_native(run_id,None,NativeModelCallEnd(call_id=call.call_id,
            finished_at='2026-11-09T12:00:01Z',elapsed_ms=1000,finish_reason='tool-calls'))
        accepted=commits.accept(run_id,{**submission,'commit_key':str(index),'base_revision':index,
            'observations':[{**submission['observations'][0],'evidence_ids':[item.image.evidence_id]}]})
        assert accepted.completed_delta == index
    coverage=AnalysisCoverageReader(jobs.db).read(run_id)
    assert len(coverage.records[0].required_media) == 1
    assert (coverage.completed,coverage.prepared_visuals,coverage.observed_visuals) == (1,2,2)


@pytest.mark.parametrize('bbox',[[330,0,350,50],[-20,-20,-1,-1],[0,0,0,2],[20,20,10,30],[0,0,10.5,20],[0,False,10,20]])
def test_crop_rejects_invalid_or_outside_windows_without_preparing_padding(scoped_media,bbox):
    jobs,create=scoped_media
    run_id,sid,_=create((320,240))
    evidence=AnalysisEvidence(jobs)
    evidence.read(run_id,{'sample_id':sid})
    with pytest.raises(ValueError):
        evidence.crop(run_id,{'sample_id':sid,'bbox':bbox})
    assert len(evidence.prepare(run_id,sid).images) == 1


def test_mining_large_crop_tiles_the_complete_source_window_and_supports_media_paging(scoped_media):
    from PIL import ImageDraw

    jobs,create=scoped_media
    run_id,sid,_=create((1600,1300), module='knowledge')
    evidence=AnalysisEvidence(jobs)
    first=evidence.crop(run_id,{'sample_id':sid,'bbox':[0,0,1600,1300],'limit':2})
    second=evidence.crop(run_id,{'sample_id':sid,'bbox':[0,0,1600,1300],'offset':2,'limit':2})
    assert first.total == second.total == 4
    assert second.offset == 2
    assert len(first.images) == len(second.images) == 2
    mask=Image.new('1',(1600,1300))
    draw=ImageDraw.Draw(mask)
    for item in [*first.images,*second.images]:
        assert max(item.image.sent_size) <= 1024
        x0,y0,x1,y1=item.image.crop_bbox
        draw.rectangle([x0,y0,x1-1,y1-1],fill=1)
    assert mask.getextrema() == (1,1)
    assert len(evidence.prepare(run_id,sid).images) == 5


def test_crop_does_not_read_other_registrations_or_changed_source_pixels(scoped_media):
    jobs,create=scoped_media
    run_id,sid,directory=create((64,48))
    evidence=AnalysisEvidence(jobs)
    evidence.read(run_id,{'sample_id':sid})
    with pytest.raises(ValueError,match='当前轮目标'):
        evidence.crop(run_id,{'sample_id':'other:sample.png','bbox':[0,0,20,20]})
    Image.new('RGB',(64,48),'black').save(directory/'sample.png')
    with pytest.raises(ValueError,match='冻结清单'):
        evidence.crop(run_id,{'sample_id':sid,'bbox':[0,0,20,20]})
    assert len(evidence.prepare(run_id,sid).images) == 1
