import base64
import io
import json
import os

import pytest
from PIL import Image, ImageDraw

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.storage.database import Database
from iad_core.entry import dataset_import, sample_get


@pytest.fixture(autouse=True)
def configured_test_mllm(monkeypatch):
    if os.environ.get('IAD_RUN_LIVE_MLLM') == '1':
        return
    monkeypatch.setenv('LIVE_VLM_CAPACITY_MODE', 'vllm_tokenize')
    monkeypatch.setenv('LIVE_VLM_MODEL', 'test-mllm')
    monkeypatch.setenv('IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES', '2')


@pytest.fixture
def self_discovery_prompt():
    from iad_core.knowledge.instructions import FrozenMiningPrompt, MiningPromptConfiguration
    return FrozenMiningPrompt.capture(MiningPromptConfiguration(objective='观察实际图组并保留分歧', directions=[]))


@pytest.fixture
def advisory_record():
    from uuid import uuid4
    from iad_core.advisory.analysis import AuditAnalysis, AuditFinding, Coverage, GlobalAnalysis, VlmResult
    from iad_core.advisory.repository import AuditSuggestionRepository
    from iad_core.advisory.schemas import AuditSuggestion, HypothesisItem
    from iad_core.evidence.images import EvidenceImages
    from iad_core.evidence.sources import SampleContent
    from iad_core.storage.repositories import SampleRepository

    def save(db, sample_id, *, label='PASS', knowledge_version_id=None, missing_evidence=(), conflicts=(), finding_count=0, structured=True):
        sample=SampleRepository(db).get(sample_id)
        content=SampleContent.capture(db,sample_id)
        image=EvidenceImages(db.db_path).capture(sample,'overview','global',source_sha256=content.sha256,full_resolution=True)
        observation=dict(description='模型建议中的可见观察。',position_analysis='主体',illumination_analysis='当前视野')
        conclusion=VlmResult(**observation,suggested_label=label,reason_category='shape',confidence=.9,
            evidence_ids=[image.evidence.evidence_id],missing_evidence=list(missing_evidence),conflicts=list(conflicts))
        analysis=AuditAnalysis(knowledge_version_id=knowledge_version_id,overview=image.evidence,
            coverage=Coverage(planned_regions=0,inspected_regions=0,complete=True),global_view=GlobalAnalysis(**observation),regions=[],
            conclusion=conclusion,findings=[AuditFinding(finding_id='F'+str(index),source_step_ids=[],check_ids=[],
                location={'scope':'global','description':'主体'},description='待复核现象'+str(index),hypothesis='需要比较外观',
                normal_explanation='成像变化',review_action='复查原图',priority='medium',evidence_ids=[image.evidence.evidence_id])
                for index in range(finding_count)]) if structured else None
        return AuditSuggestionRepository(db).save(AuditSuggestion(suggestion_id='suggestion_'+uuid4().hex,
            task_id=sample.task_id,sample_id=sample_id,confidence=conclusion.confidence,audit_run_id='advisory_'+uuid4().hex,
            source_fingerprint=content.fingerprint,analysis=analysis,hypotheses=[HypothesisItem(label=label)]))

    return save


@pytest.fixture
def knowledge_dataset(tmp_path, request):
    images, labels = tmp_path / "images", tmp_path / "labels"
    images.mkdir()
    labels.mkdir()
    for index in range(6):
        size = getattr(request, "param", (320, 240))
        image = Image.new("RGB", size, "#cccccc")
        draw = ImageDraw.Draw(image)
        draw.rectangle((40, 60, 280, 180), fill="#333333")
        for x in (100, 220):
            draw.ellipse((x - 15, 105, x + 15, 135), fill="#cccccc")
        if size[0] > 1800:
            image.putpixel((1800, 220), (255, 0, 0))
        image.putpixel((0, 0), (180 + index, 190, 200))
        image.save(images / f"part-{index}.png")
    db = Database(str(tmp_path / "knowledge.db"))
    config = DatasetRegistry(db).import_labelme(DatasetImport(
        format="labelme", name="双孔部件", image_dir=str(images), annotation_dir=str(labels),
    ))
    return db, config


@pytest.fixture
def defect_dataset(tmp_path):
    images, labels = tmp_path / 'images', tmp_path / 'labels'
    images.mkdir()
    labels.mkdir()
    for index in range(4):
        image = Image.new('RGB', (320, 240), (200 + index, 200 + index, 200 + index))
        draw = ImageDraw.Draw(image)
        draw.rectangle((40, 60, 280, 180), fill='#333333')
        draw.ellipse((85, 105, 115, 135), fill='#cccccc')
        if index == 3:
            draw.rectangle((90, 110, 110, 130), fill='red')
        image.save(images / f'part-{index}.png')
    mask = Image.new('L', (41, 61), 0)
    ImageDraw.Draw(mask).rectangle((10, 20, 30, 40), fill=255)
    buffer = io.BytesIO()
    mask.save(buffer, 'PNG')
    (labels / 'part-3.json').write_text(json.dumps({'imageWidth': 320, 'imageHeight': 240, 'shapes': [{
        'shape_type': 'mask', 'label': '待核实遮挡', 'points': [[80, 90], [120, 150]],
        'mask': base64.b64encode(buffer.getvalue()).decode(),
    }]}))
    db_path = str(tmp_path / 'workbench.db')
    dataset = dataset_import({'format': 'labelme', 'name': '孔板', 'image_dir': str(images), 'annotation_dir': str(labels)}, db_path)
    target_id = dataset['dataset_id'] + ':part-3.png'
    original = sample_get({'sample_id': target_id}, db_path)
    return Database(db_path), dataset, original, images


@pytest.fixture
def dataset(tmp_path):
    images = tmp_path / "images"
    labels = tmp_path / "labels"
    images.mkdir()
    labels.mkdir()
    for name in ["normal", "normal2", "dent", "scratch"]:
        Image.new("RGB", (320, 240), (0, 0, 200) if name == "normal" else (0, 0, 220) if name == "normal2" else "blue").save(images / f"{name}.png")
    for name in ["dent", "scratch"]:
        (labels / f"{name}.json").write_text(json.dumps({
            "imageWidth": 320, "imageHeight": 240,
            "shapes": [{"label": name, "shape_type": "rectangle", "points": [[10, 10], [30, 30]]}],
        }))
    db = Database(str(tmp_path / "test.db"))
    registry = DatasetRegistry(db)
    config = registry.import_labelme(DatasetImport(format="labelme", name="生产线 A", image_dir=str(images), annotation_dir=str(labels)))
    return db, registry, config


@pytest.fixture
def agent_jobs(dataset):
    from iad_core.analysis.jobs import AnalysisAgentJobs
    from iad_core.workbench.runtime import WorkbenchRuntime
    db, _, config = dataset
    runtime = WorkbenchRuntime(db)
    jobs = AnalysisAgentJobs(runtime)
    from iad_core.workbench.module_settings import ModuleSettings
    ModuleSettings(db).save({'module': 'exploration', 'expected_revision': 0, 'settings': {
        'model': {'provider_id': 'swift-30003', 'model_id': 'fixture'}, 'batch_size': 2}})
    role = {'profile': {'endpoint': 'http://127.0.0.1:30003/v1/chat/completions',
        'provider_id': 'swift-30003', 'model_id': 'fixture', 'context_tokens': 262144, 'max_output_tokens': 4096},
        'native_profile': {'api': 'openai-completions', 'baseURL': 'http://127.0.0.1:30003/v1'},
        'input_modalities': ['text', 'image']}
    try:
        yield jobs, config.dataset.id, role
    finally:
        runtime.close()


@pytest.fixture
def native_knowledge_versions(agent_jobs):
    from uuid import uuid4
    from iad_core.analysis.commits import AnalysisCommits
    from iad_core.analysis.evidence import AnalysisEvidence
    from iad_core.analysis.publications import AnalysisPublications
    from iad_core.knowledge.instructions import default_directions
    from iad_core.workbench.calls import ModelCalls, NativeModelCallStart, NativeModelCallEnd
    from iad_core.workbench.module_settings import ModuleSettings
    jobs, dataset_id, role = agent_jobs
    ModuleSettings(jobs.db).save({'module':'knowledge', 'expected_revision':0,
        'settings':{'model':{'provider_id':'swift-30003','model_id':'fixture'},'batch_size':4}})
    publications = []
    for _ in range(2):
        started = jobs.start(dict(submission_id=str(uuid4()),analysis_kind='knowledge',dataset_ids=[dataset_id],
            mining_prompt=dict(objective='逐登记核对边缘。',instruction='保留整图、局部与反例。',
                directions=[default_directions()[0].model_dump(mode='json')])),agent=role)
        run_id = started['run_id']
        context = jobs.context(run_id)
        pages = [AnalysisEvidence(jobs).read(run_id,{'sample_id':target.sample_id}) for target in context.round.targets]
        call = NativeModelCallStart(call_id='call_'+uuid4().hex,started_at='2026-11-09T12:00:00Z',
            request={'fixture':'knowledge review and evidence projection'})
        ModelCalls(jobs.db).start_native(run_id,call,sample_id=None,session_id=context.session_id,attempt=1)
        AnalysisEvidence(jobs).delivered(run_id,call.call_id,[item.image.evidence_id for page in pages for item in page.images])
        ModelCalls(jobs.db).finish_native(run_id,None,NativeModelCallEnd(call_id=call.call_id,
            finished_at='2026-11-09T12:00:01Z',elapsed_ms=1000,finish_reason='tool-calls'))
        support = [page.images[0].image.evidence_id for page in pages[:3]]
        counter = [pages[-1].images[0].image.evidence_id]
        named = {page.sample_id.split(':',1)[1]:page.images[0].image.evidence_id for page in pages}
        check = dict(check_id='C1',title='孔位关系',subject='主体',location='边缘',criterion='可见连续外轮廓。',
            allowed_variations=[],limitations=['当前视角。'],status='conflicted',support_evidence_ids=support,
            counter_evidence_ids=counter,direction_refs=['D1'],dataset_ids=[dataset_id],
            key_evidence=[dict(evidence_id=named['normal.png'],role='support',reason='展示主体轮廓。'),
                dict(evidence_id=named['normal2.png'],role='support',reason='展示另一亮度下的轮廓。'),
                dict(evidence_id=counter[0],role='counter',reason='展示反例位置。')])
        AnalysisCommits(jobs).accept(run_id,dict(commit_key='observed',base_revision=0,round_id=1,
            observations=[dict(sample_id=page.sample_id,dataset_id=dataset_id,description='本登记可见边缘。',
                evidence_ids=[item.image.evidence_id for item in page.images],
                directions=[dict(direction_ref='D1',status='applicable',reason='边缘可观察。')]) for page in pages],
            checks=[check],summary='保留支持与反例。',limitations=['当前视角。'],unresolved_questions=[]))
        jobs.jobs.finish_external(run_id)
        publications.append(AnalysisPublications(jobs.db).publish(run_id))
    return jobs.db, dataset_id, publications


@pytest.fixture
def native_audit(knowledge_dataset):
    from uuid import uuid4
    from iad_core.audit.jobs import AuditAgentJobs
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
    from iad_core.workbench.module_settings import ModuleSettings
    from iad_core.workbench.runtime import WorkbenchRuntime
    db, config = knowledge_dataset
    runtime = WorkbenchRuntime(db)
    checks = ConsistencyAgentJobs(runtime)
    upstream = checks.start({'submission_id':str(uuid4()), 'dataset_ids':[config.dataset.id], 'mode':'exact'})
    for anchor in checks.anchors(upstream['run_id']):
        checks.session_created(upstream['run_id'], anchor.anchor_id)
        assert checks.retrieve(upstream['run_id'], anchor.anchor_id).candidates == []
        checks.submit_empty(upstream['run_id'], anchor.anchor_id)
    runtime.jobs.finish_external(upstream['run_id'])
    ModuleSettings(db).save({'module':'audit', 'expected_revision':0,
        'settings':{'model':{'provider_id':'swift-30003', 'model_id':'fixture'}, 'concurrency':2}})
    role = {'profile':{'endpoint':'http://127.0.0.1:30003/v1/chat/completions', 'capacity_mode':'vllm_tokenize',
        'provider_id':'swift-30003', 'model_id':'fixture', 'context_tokens':262144, 'max_output_tokens':4096},
        'native_profile':{'api':'openai-completions', 'baseURL':'http://127.0.0.1:30003/v1'}, 'input_modalities':['text','image']}
    try:
        yield AuditAgentJobs(runtime), config.dataset.id, upstream['run_id'], role
    finally:
        runtime.close()


@pytest.fixture
def observed_claim(agent_jobs, request):
    from iad_core.analysis.commits import AnalysisCommits
    from iad_core.analysis.evidence import AnalysisEvidence
    from iad_core.knowledge.instructions import default_directions
    from iad_core.workbench.calls import ModelCalls, NativeModelCallStart, NativeModelCallEnd
    from iad_core.workbench.module_settings import ModuleSettings
    from uuid import uuid4
    jobs, dataset_id, role = agent_jobs
    ModuleSettings(jobs.db).save(dict(module='knowledge', expected_revision=0,
        settings=dict(model=dict(provider_id='swift-30003', model_id='fixture'), batch_size=1)))
    started = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='knowledge', dataset_ids=[dataset_id],
        mining_prompt=dict(objective='核对主体边界。', instruction='逐登记核对相同主张。',
            directions=[default_directions()[0].model_dump(mode='json')])), agent=role)
    run_id = started['run_id']
    evidence, commits = AnalysisEvidence(jobs), AnalysisCommits(jobs)
    whole_ids = []
    case = getattr(request, 'param', 4)
    for index in range(4 if case == 'empty' else case):
        context = jobs.context(run_id)
        target = context.round.targets[0]
        page = evidence.read(run_id, dict(sample_id=target.sample_id))
        ids = [image.image.evidence_id for image in page.images]
        whole_ids.append(next(image.image.evidence_id for image in page.images if image.image.is_whole_image))
        call = NativeModelCallStart(call_id='call_'+uuid4().hex, started_at='2026-11-09T12:00:00Z',
            request={'fixture':'actual full image and required annotations'})
        ModelCalls(jobs.db).start_native(run_id, call, sample_id=None, session_id=context.session_id, attempt=1)
        evidence.delivered(run_id, call.call_id, ids)
        ModelCalls(jobs.db).finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id,
            finished_at='2026-11-09T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
        check = dict(check_id='edge', title='主体边界连续性', subject='主体', location='外缘',
            criterion='主体外缘可辨时，沿外缘复核轮廓是否连续。', allowed_variations=[], limitations=[],
            status='supported', support_evidence_ids=list(whole_ids), counter_evidence_ids=[],
            direction_refs=['D1'], dataset_ids=[dataset_id])
        submission = dict(commit_key='observed-'+str(index), base_revision=context.revision,
            round_id=context.round.round_id, summary='主体边界可沿原图复核。', limitations=[], unresolved_questions=[],
            observations=[dict(sample_id=page.sample_id, dataset_id=dataset_id, description='主体外缘在原图中可辨。',
                evidence_ids=ids, directions=[dict(direction_ref='D1', status='applicable', reason='主体外缘可见。')])],
            checks=[] if case == 'empty' else [check])
        commits.accept(run_id, submission)
    return jobs, run_id, submission, whole_ids
