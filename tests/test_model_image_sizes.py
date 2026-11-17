import base64
import io
import json
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

import httpx
import pytest
from PIL import Image

from iad_core.evidence.images import EvidenceImages, PreparedImageBundle
from iad_core.exploration.models import DirectionDraft
from iad_core.storage.models import Annotation, AnnotationType
from iad_core.storage.repositories import SampleRepository
from iad_core.workbench.vision import VlmClient


@pytest.mark.parametrize('module', ['consistency', 'audit'])
def test_image_size_settings_are_optional_independent_and_strict(dataset, module):
    from iad_core.workbench.module_settings import ModuleSettings
    db, _, _ = dataset
    settings = ModuleSettings(db)
    assert settings.read(module).settings.whole_image_max_side is None
    saved = settings.save(dict(module=module, expected_revision=0, settings={'whole_image_max_side':512}))
    assert settings.read(module) == saved
    other = 'audit' if module == 'consistency' else 'consistency'
    assert settings.read(other).settings.whole_image_max_side is None
    for invalid in (0, -1, 1.5, True, '512'):
        with pytest.raises(ValueError):
            settings.save(dict(module=module, expected_revision=1, settings={'whole_image_max_side':invalid}))
    assert settings.save(dict(module=module, expected_revision=1, settings={'whole_image_max_side':None})).settings.whole_image_max_side is None


@pytest.mark.parametrize('bundled', [False, True])
def test_sent_pixels_annotations_and_crop_coordinates_agree(dataset, bundled):
    from iad_core.evidence.model_inputs import ModelImageInputs
    db, _, config = dataset
    sample = SampleRepository(db).get(config.dataset.id + ':dent.png')
    pixels = Image.new('RGB', (4000,2000), 'white')
    pixels.paste('red', (400,200,1200,600))
    pixels.save(sample.image_path)
    sample = sample.model_copy(update={'width':4000, 'height':2000})
    annotation = Annotation(annotation_id='box',sample_id=sample.sample_id,annotation_type=AnnotationType.BBOX,
        raw_label='dent',bbox=[400,200,1200,600])
    whole = EvidenceImages(db.db_path).capture(sample, 'overview', 'global', full_resolution=True).with_source(sample,'labelme',[annotation])
    limited = whole.for_model(ModelImageInputs(db.db_path),1000)
    assert whole.model_input is None
    assert limited.evidence == whole.evidence
    assert limited.model_input.sent_size == (1000,500)
    inputs = [PreparedImageBundle(whole.evidence.evidence_id, {}, (limited,))] if bundled else [limited]
    with httpx.Client(transport=httpx.MockTransport(lambda request:httpx.Response(200,json={'count':100,'max_model_len':65536}))) as http:
        plan = VlmClient(http_client=http).plan(DirectionDraft,'观察标注。',inputs,'fixture-model')
    parts = plan.body['messages'][0]['content']
    metadata = next(json.loads(p['text'].split('：',1)[1]) for p in parts if p['type']=='text' and p['text'].startswith(('图像视图：','视觉证据：')))
    assert metadata['sent_size'] == [1000,500]
    assert limited.annotations[0].bbox == [400,200,1200,600]
    if not bundled:
        assert metadata['annotations'][0]['bbox'] == [400,200,1200,600]
    assert metadata['view_annotations'][0]['bbox'] == [100,50,300,150]
    data = base64.b64decode(next(p['image_url']['url'] for p in parts if p['type']=='image_url').split(',',1)[1])
    with Image.open(io.BytesIO(data)) as sent:
        assert sent.size == (1000,500)
        assert sent.getpixel((200,100)) == (255,0,0)
    crop = EvidenceImages(db.db_path).capture(sample,'roi','model',[300,100,2300,1100],full_resolution=True).with_source(sample,'labelme',[annotation])
    crop = crop.for_model(ModelImageInputs(db.db_path),1000)
    assert crop.model_context()['view_annotations'][0]['bbox'] == [50,50,450,250]
    assert crop.model_context()['original_to_sent'] == [0.5,0,-150,0,0.5,-50]


def test_resize_cache_reuses_pixels_across_workers_and_restarts(dataset):
    from iad_core.evidence.model_inputs import ModelImageInputs
    db, _, config = dataset
    sample = SampleRepository(db).get(config.dataset.id + ':dent.png')
    original = EvidenceImages(db.db_path).capture(sample,'overview','global',full_resolution=True)
    with patch('PIL.Image.open', wraps=Image.open) as opened:
        assert original.for_model(ModelImageInputs(db.db_path),None) is original
        small = original.for_model(ModelImageInputs(db.db_path),1000)
        assert small.model_input.path == original.path
        assert opened.call_count == 0
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(lambda _:original.for_model(ModelImageInputs(db.db_path),64),range(8)))
        assert opened.call_count == 1
        again = original.for_model(ModelImageInputs(db.db_path),64)
        assert again.model_input == results[0].model_input
        assert opened.call_count == 1
    with Image.open(again.model_input.path) as sent:
        assert sent.size == (64,48)
    changed = original.for_model(ModelImageInputs(db.db_path),32)
    assert changed.model_input.sent_size == (32,24)
    assert changed.model_input.sha256 != again.model_input.sha256


def test_audit_tools_limit_all_views_without_changing_frozen_sources(native_audit):
    from uuid import uuid4
    from iad_core.audit.evidence import AuditEvidence
    from iad_core.audit.reports import AuditReports
    from iad_core.workbench.module_settings import ModuleSettings
    jobs, dataset_id, upstream, role = native_audit
    ModuleSettings(jobs.db).save(dict(module='audit',expected_revision=1,settings={'whole_image_max_side':64}))
    run = jobs.start(dict(submission_id=str(uuid4()),subset_ids=[dataset_id],consistency_job_id=upstream),agent=role)['run_id']
    sample = jobs.samples(run)[0]
    ModuleSettings(jobs.db).save(dict(module='audit',expected_revision=2,settings={'whole_image_max_side':128}))
    evidence = AuditEvidence(jobs)
    raw = evidence.prepare(run,sample.sample_id,sample.sample_id)
    page = evidence.read(run,sample.sample_id,dict(sample_id=sample.sample_id,view='all'))
    assert all(max(item.model_input.sent_size) <= 64 for item in page.images)
    assert all(item.image.sent_size == [320,240] for item in raw.images)
    crop = evidence.crop(run,sample.sample_id,dict(sample_id=sample.sample_id,bbox=[10,20,310,220]))
    assert crop.images[0].image.crop_bbox == [10,20,310,220]
    assert max(crop.images[0].model_input.sent_size) == 64
    master = AuditReports(jobs.db).evidence(run,sample.sample_id,raw.evidence_id)
    assert max(master.images[0].model_input.sent_size) == 64
    assert evidence.prepare(run,sample.sample_id,sample.sample_id) == raw


def test_consistency_input_limit_is_frozen_for_all_group_views(dataset):
    from uuid import uuid4
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
    from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
    from iad_core.consistency.agent_review import ConsistencyAgentReview
    from iad_core.consistency.agent_preparation import ConsistencyAgentPreparation
    from iad_core.workbench.module_settings import ModuleSettings
    from iad_core.workbench.runtime import WorkbenchRuntime
    from tests.test_consistency_agent_preparation import wait_for_preparation
    db, _, config = dataset
    settings = ModuleSettings(db)
    settings.save(dict(module='consistency',expected_revision=0,settings={'whole_image_max_side':64}))
    runtime = WorkbenchRuntime(db)
    try:
        jobs = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':dent.png'
        run = jobs.start(dict(submission_id=str(uuid4()),dataset_ids=[config.dataset.id],mode='exact',subjects={'kind':'samples','sample_ids':[anchor]}))['run_id']
        wait_for_preparation(ConsistencyAgentPreparation(runtime),run)
        settings.save(dict(module='consistency',expected_revision=1,settings={'whole_image_max_side':128}))
        assert jobs.snapshot(run).whole_image_max_side == 64
        jobs.session_created(run,anchor)
        candidates = jobs.retrieve(run,anchor)
        ConsistencyAgentReview(runtime).verify(run,anchor)
        prepared = ConsistencyAgentEvidence(runtime).prepare(run,anchor,[candidates.candidates[0].sample_id])
        assert len(prepared.images) > 2
        for view in prepared.images:
            assert max(view.model_input.sent_size) <= 64
            assert view.evidence.original_size == [320,240]
            assert view.model_context()['annotation_coordinates'] == 'ORIGINAL'
    finally:
        runtime.close()
