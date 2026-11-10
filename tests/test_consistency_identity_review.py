import json
from uuid import uuid4

import httpx
import pytest
from PIL import Image

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


@pytest.mark.parametrize('points,crop', [
    ([[100,100],[1100,1000]], (0,10,1200,1090)),
    ([[100.4,100.4],[108.6,108.6]], (99,99,110,110)),
    ([[-4.5,1190.5],[10.5,1202.5]], (0,1189,12,1200)),
    (None,None)])
def test_bbox_observation_sends_original_pixels_and_only_complete_annotation_crops(dataset, tmp_path, points, crop):
    import base64
    import io
    import numpy as np

    database, registry, config = dataset
    pixels = np.full((1200, 1600), 40000, dtype=np.uint16)
    pixels[1100, 1500] = 65535
    for name in ('dent', 'scratch'):
        Image.fromarray(pixels).save(tmp_path / 'images' / (name + '.png'))
        (tmp_path / 'labels' / (name + '.json')).write_text(json.dumps({
            'imageWidth':1600, 'imageHeight':1200,
            'shapes': ([{'shape_type':'rectangle', 'label':'defect',
                'points':points}] if points else [])}))
    registry.rescan(config.dataset.id)
    runtime = WorkbenchRuntime(database)
    sent = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count':1000,'max_model_len':32768})
        content = json.loads(request.content)['messages'][-1]['content']
        facts = json.loads(content[1]['text'])['facts']
        image_parts = [part for part in content if part['type']=='image_url']
        expected = [(1600,1200),(crop[2]-crop[0],crop[3]-crop[1])] * 2 if crop else [(1600,1200)] * 2
        assert len(image_parts) == len(expected)
        for part, size in zip(image_parts, expected):
            with Image.open(io.BytesIO(base64.b64decode(part['image_url']['url'].split(',')[1]))) as image:
                assert image.size == size
                np.testing.assert_array_equal(np.asarray(image), pixels if size==(1600,1200) else pixels[crop[1]:crop[3],crop[0]:crop[2]])
        for source in facts['sources'].values():
            crops = [view for view in source['visual_inputs'] if view['crop_bbox'] != [0,0,1600,1200]]
            assert {tuple(view['crop_bbox']) for view in crops} == ({crop} if crop else set())
            assert all(view['representation']=='raw' for view in source['visual_inputs'])
        candidate = next(iter(facts['candidates']))
        sent.append(content)
        return httpx.Response(200, json={'choices':[{'finish_reason':'stop','message':{'content':json.dumps({
            'observations':[{'candidate_id':candidate,'description':'按原始像素核对完整原图和标注局部。',
                'media_ids':facts['required_image_ids'][candidate],'limitations':[]}]})}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor, candidate = [config.dataset.id + ':' + name + '.png' for name in ('dent','scratch')]
        run = checks.start({'submission_id':str(uuid4()),'dataset_ids':[config.dataset.id],'mode':'exact',
            'subjects':{'kind':'samples','sample_ids':[anchor]}})['run_id']
        checks.session_created(run, anchor)
        selected = checks.retrieve(run, anchor)
        ConsistencyAgentReview(runtime, client).observe(run, anchor, {'request_id':'original-inputs',
            'fingerprint':selected.fingerprint,'candidate_ids':[candidate],'question':'核对原始标注。'})
        assert len(sent)==1
    finally:
        client.close()
        runtime.close()


@pytest.mark.parametrize(('main_role', 'candidate_role', 'expected'), [
    ('normal', 'normal', 'passed'), ('anomaly', 'anomaly', 'passed'),
    ('normal', 'anomaly', 'discrepancy'), ('anomaly', 'normal', 'discrepancy')])
def test_imported_directory_labels_are_compared_without_model_calls(tmp_path, main_role, candidate_role, expected):
    from iad_core.dataset.folder_preview import preview_folder_dataset
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.storage.database import Database
    from iad_core.task.config import FolderRule
    from iad_core.workbench.calls import ModelCalls

    root = tmp_path / 'classified'
    for side in ('main', 'candidate'):
        (root / side).mkdir(parents=True)
        Image.new('RGB', (40, 40), 'blue').save(root / side / 'part.png')
    rules = [FolderRule(path='main', role=main_role), FolderRule(path='candidate', role=candidate_role)]
    preview = preview_folder_dataset(str(root), rules=rules)
    database = Database(str(tmp_path / 'classification.db'))
    config = DatasetRegistry(database).import_dataset({'format': 'folder_classification', 'name': '目录分类',
        'root_dir': str(root), 'rules': [rule.model_dump() for rule in rules], 'preview_fingerprint': preview.preview_fingerprint})
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':main/part.png'
        run_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
        snapshot = checks.snapshot(run_id)
        assert snapshot.task_type == 'anomaly_detection'
        assert 'OK/NG' in snapshot.system_prompt
        assert not any(term in snapshot.system_prompt + snapshot.instruction for term in ('矩形', '拆分', '框'))
        checks.session_created(run_id, anchor)
        checks.retrieve(run_id, anchor)
        review = ConsistencyAgentReview(runtime)
        review.verify(run_id, anchor)
        result = review.finish_rules(run_id, anchor)
        assert result.result == expected
        assert result.candidate_stats.assessed == 1
        from iad_core.consistency.agent_results import ConsistencyAgentResults
        assert ConsistencyAgentResults(database).detail(run_id, anchor).program_conclusion == ('类别不一致' if expected == 'discrepancy' else '一致')
        assert [issue.type for issue in result.issues] == (['image_label_mismatch'] if expected == 'discrepancy' else [])
        assert ModelCalls(database).list(run_id) == []
    finally:
        runtime.close()


def test_bbox_review_retains_multiple_independent_issues_with_real_ids(dataset):
    from pathlib import Path
    from iad_core.storage.repositories import SampleRepository

    database, registry, config = dataset
    sample = SampleRepository(database).get(config.dataset.id + ':scratch.png')
    labels = Path(config.annotations.root) / 'scratch.json'
    raw = json.loads(labels.read_text())
    raw['shapes'][0]['points'] = [[8, 8], [30, 30]]
    labels.write_text(json.dumps(raw))
    registry.rescan(config.dataset.id)
    runtime = WorkbenchRuntime(database)

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        parts = json.loads(request.content)['messages'][-1]['content']
        facts = json.loads(parts[1]['text'])['facts']
        identity = next(iter(facts['candidates']))
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps({
            'observations': [{'candidate_id': identity, 'description': '同一对象的类别与覆盖范围不同。',
                'media_ids': facts['required_image_ids'][identity], 'limitations': []}]})}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':dent.png'
        run_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
        checks.session_created(run_id, anchor)
        selected = checks.retrieve(run_id, anchor)
        review = ConsistencyAgentReview(runtime, client)
        observed = review.observe(run_id, anchor, {'request_id': 'actual-view', 'fingerprint': selected.fingerprint,
            'candidate_ids': [sample.sample_id], 'question': '比较同一对象的原始标注。'})
        evidence_id = observed.request.facts['candidates'][sample.sample_id]['comparison']['evidence_id']
        frozen = runtime.consistency_service.evidence(evidence_id)
        issue = dict(main_annotation_ids=[frozen.sources.left.annotations.annotations[0].annotation_id],
            candidate_annotation_ids=[frozen.sources.right.annotations.annotations[0].annotation_id],
            media_ids=observed.result.observations[0].media_ids)
        record = review.assess(run_id, anchor, {'fingerprint': selected.fingerprint,
            'observation_ids': [observed.observation_id], 'assessment': {'candidate_id': sample.sample_id,
                'verdict': 'MATERIAL', 'explanation': '类别不同，且框覆盖不同。', 'limitations': ['另一处反光区域无法确定。'], 'issues': [
                    dict(issue, type='category_mismatch', description='同一对象的原始类别不同。'),
                    dict(issue, type='position_difference', description='候选只覆盖对象的一部分。', coverage_effect='material_change', coverage_reason='实际对象的右侧区域没有被候选框覆盖。')]}})
        result = review.finalize(run_id, anchor, {'fingerprint': selected.fingerprint, 'assessment_ids': [record.assessment_id]})
        assert result.result == 'discrepancy'
        assert [item.type for item in result.issues] == ['category_mismatch', 'position_difference']
        assert all(item.supporting_assessment_ids == [record.assessment_id] for item in result.issues)
        assert result.candidate_stats.assessed == 1
        assert result.limitations == ['另一处反光区域无法确定。']
        assert checks.anchor(run_id, anchor).result == result
    finally:
        client.close()
        runtime.close()
