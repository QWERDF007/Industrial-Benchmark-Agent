from uuid import uuid4
import json

import pytest
import httpx

from PIL import Image

from iad_core.consistency.annotations import AnnotationSet
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.evidence.sources import SampleContent
from iad_core.storage.database import Database


@pytest.mark.parametrize('broken', ['{', '{}', '{"shapes": null}'])
def test_scan_distinguishes_valid_empty_missing_unreadable_and_conventional_empty(tmp_path, broken):
    images, labels = tmp_path / 'images', tmp_path / 'labels'
    images.mkdir()
    labels.mkdir()
    for name in ('empty', 'missing', 'broken', 'provided'):
        Image.new('RGB', (40, 30), 'blue').save(images / f'{name}.png')
    (labels / 'empty.json').write_text(json.dumps({'shapes': []}))
    (labels / 'broken.json').write_text(broken)
    (labels / 'provided.json').write_text(json.dumps({'shapes': [
        {'label': 'scratch', 'shape_type': 'rectangle', 'points': [[2, 3], [12, 9]]}]}))
    db = Database(str(tmp_path / 'scan.db'))
    registry = DatasetRegistry(db)
    config = registry.import_labelme(DatasetImport(format='labelme', name='来源状态',
        image_dir=str(images), annotation_dir=str(labels), unannotated_is_normal=False))

    def capture(name):
        return AnnotationSet.capture(db, config.dataset.id + ':' + name + '.png')

    assert capture('empty').availability.status == 'VALID_EMPTY'
    assert capture('empty').availability.source == str(labels / 'empty.json')
    assert capture('provided').availability.status == 'VALID_NONEMPTY'
    assert capture('missing').availability.status == 'NOT_PROVIDED'
    assert capture('broken').availability.status == 'UNREADABLE'

    assert capture('broken').errors
    before = SampleContent.capture(db, config.dataset.id + ':missing.png')
    config.dataset.unannotated_is_normal = True
    registry.save(config)
    registry.rescan(config.dataset.id)
    conventional = capture('missing')
    assert conventional.annotations == []
    assert conventional.availability.status == 'VALID_EMPTY'
    assert conventional.availability.origin == 'DATASET_CONVENTION'
    assert conventional.availability.source == 'dataset.unannotated_is_normal'
    assert SampleContent.capture(db, config.dataset.id + ':missing.png').fingerprint != before.fingerprint
    assert capture('broken').availability.status == 'UNREADABLE'


def test_old_samples_without_availability_remain_unknown_when_schema_is_upgraded(dataset):
    from iad_core.storage.repositories import SampleRepository

    db, _, config = dataset
    with db.connection() as connection:
        connection.execute('ALTER TABLE samples DROP COLUMN annotation_availability_json')
    upgraded = Database(db.db_path)
    sample = SampleRepository(upgraded).get(config.dataset.id + ':normal.png')
    assert sample.annotation_availability.status == 'UNKNOWN'
    assert sample.annotation_availability.source is None


def test_unreadable_frozen_annotation_is_an_execution_error_with_no_verdict(dataset, tmp_path):
    from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
    from iad_core.consistency.errors import ConsistencyError
    from iad_core.workbench.runtime import WorkbenchRuntime

    db, registry, config = dataset
    (tmp_path / 'labels/scratch.json').write_text('{')
    registry.rescan(config.dataset.id)
    anchor = config.dataset.id + ':dent.png'
    runtime = WorkbenchRuntime(db)
    try:
        checks = ConsistencyAgentJobs(runtime)
        run = checks.start({'submission_id': str(uuid4()), 'mode': 'exact', 'dataset_ids': [config.dataset.id],
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
        checks.session_created(run, anchor)
        checks.retrieve(run, anchor)
        with pytest.raises(ConsistencyError) as failure:
            ConsistencyAgentEvidence(runtime).freeze(run, anchor, checkpoint=lambda: None)
        assert failure.value.code == 'ANNOTATION_UNREADABLE'
        assert checks.anchor(run, anchor).result is None
    finally:
        runtime.close()


@pytest.mark.parametrize('provided', [False, True])
def test_original_matching_never_confirms_missing_annotations_from_unprovided_sources(dataset, tmp_path, provided):
    from iad_core.consistency.annotations import AnnotationMatcher

    db, registry, config = dataset
    config.dataset.unannotated_is_normal = False
    config.annotations.annotation_coverage = 'EXHAUSTIVE'
    config.annotations.annotation_role = 'REFERENCE'
    config.annotations.policy_id = 'shared-rule'
    registry.save(config)
    path = tmp_path / 'labels/scratch.json'
    if provided:
        path.write_text(json.dumps({'shapes': []}))
    else:
        path.unlink()
    registry.rescan(config.dataset.id)
    sides = [AnnotationSet.capture(db, config.dataset.id + ':' + name + '.png') for name in ('dent', 'scratch')]
    comparison = AnnotationMatcher().compare(*sides, relation='EXACT')
    missing = next(item for item in comparison.differences if item.type == 'ONE_SIDED_REGION')
    assert missing.confirmed_conflict is provided
    assert missing.suspected_missing == ('right' if provided else None)


@pytest.mark.parametrize('case', ['partial', 'unknown', 'not_provided', 'ignored', 'exhaustive', 'main_partial'])
def test_direct_review_preserves_raw_annotations_without_policy_based_verdict_gates(dataset, tmp_path, case):
    from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
    from iad_core.consistency.agent_review import ConsistencyAgentReview
    from iad_core.consistency.annotation_inventory import AnnotationInventory
    from iad_core.workbench.runtime import WorkbenchRuntime
    from iad_core.workbench.vision import VlmClient

    db, registry, config = dataset
    config.dataset.unannotated_is_normal = False
    config.annotations.annotation_coverage = {'partial': 'PARTIAL', 'main_partial': 'PARTIAL', 'unknown': 'UNKNOWN'}.get(case, 'EXHAUSTIVE')
    registry.save(config)
    if case != 'not_provided':
        shapes = ([{'label': 'ignore', 'shape_type': 'rectangle', 'points': [[0, 0], [40, 40]],
            'flags': {'ignore': True}}] if case == 'ignored' else [])
        (tmp_path / 'labels/scratch.json').write_text(json.dumps({'shapes': shapes}))
    else:
        (tmp_path / 'labels/scratch.json').unlink()
    registry.rescan(config.dataset.id)
    anchor, candidate = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch')]
    dataset_ids = [config.dataset.id]
    if case == 'main_partial':
        root = tmp_path / 'exhaustive'
        root.mkdir()
        Image.new('RGB', (320, 240), 'blue').save(root / 'reference.png')
        (root / 'reference.json').write_text(json.dumps({'shapes': []}))
        reference_config = registry.import_labelme(DatasetImport(format='labelme', name='穷尽空标侧',
            image_dir=str(root), annotation_dir=str(root), annotation_policy={'annotation_coverage': 'EXHAUSTIVE'}))
        candidate = reference_config.dataset.id + ':reference.png'
        dataset_ids.append(reference_config.dataset.id)
    runtime = WorkbenchRuntime(db)
    requests = []

    def respond(request):
        if request.url.path.endswith('/tokenize'):
            return httpx.Response(200, json={'count': 1000, 'max_model_len': 32768})
        content = json.loads(request.content)['messages'][0]['content']
        requests.append(content)
        media = [json.loads(item['text'].removeprefix('视觉证据：'))['evidence_id'] for item in content
            if item['type'] == 'text' and item['text'].startswith('视觉证据：')]
        return httpx.Response(200, json={'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps({
            'observations': [{'candidate_id': candidate, 'description': '依据原始像素和两侧原始标注进行比较',
                'media_ids': media, 'limitations': []}]
        })}}]})

    client = VlmClient(httpx.Client(transport=httpx.MockTransport(respond)))
    try:
        checks = ConsistencyAgentJobs(runtime)
        run = checks.start({'submission_id': str(uuid4()), 'mode': 'exact', 'dataset_ids': dataset_ids,
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]},
            'corpus_scope': {'kind': 'datasets', 'dataset_ids': [candidate.split(':')[0]]}})['run_id']
        checks.session_created(run, anchor)
        candidates = checks.retrieve(run, anchor)
        evidence = ConsistencyAgentEvidence(runtime)
        review = ConsistencyAgentReview(runtime, client)
        observed = review.observe(run, anchor, {'request_id': 'applicability', 'fingerprint': candidates.fingerprint,
            'candidate_ids': [candidate], 'question': '比较两侧原始标注'})
        for verdict in ('EQUIVALENT', 'MATERIAL'):
            record = review.assess(run, anchor, {'fingerprint': candidates.fingerprint,
                'assessment': {'candidate_id': candidate, 'verdict': verdict,
                    'categories': ['多类别'] if verdict == 'MATERIAL' else [],
                    'explanation': '直接比较主图相对候选图的原始标注', 'findings': []},
                'observation_ids': [observed.observation_id]})
        result = review.finalize(run, anchor, {'fingerprint': candidates.fingerprint,
            'assessment_ids': [record.assessment_id]})
        assert result.overall.verdict == 'MATERIAL'
        raw = AnnotationInventory.compare(AnnotationSet.capture(db, anchor), AnnotationSet.capture(db, candidate))
        assert raw.left == {'dent': 1}
        assert raw.right == {}
        prepared = evidence.prepare(run, anchor, [candidate])
        assert all('annotation_availability' in source for source in prepared.facts['sources'].values())
        assert requests and all('annotation_applicability' not in item for item in prepared.facts['evidence'])
        assert all('policy' not in source for source in prepared.facts['sources'].values())
    finally:
        client.close()
        runtime.close()
