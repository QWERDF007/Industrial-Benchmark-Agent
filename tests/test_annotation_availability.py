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
def test_frozen_comparison_uses_annotation_applicability_without_erasing_raw_counts(dataset, tmp_path, case):
    from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
    from iad_core.consistency.group_analysis_models import GroupAnalysisDraft
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
            'observations': [{'candidate_id': candidate, 'description': '原始像素相同，依据实际覆盖范围核对标注',
                'phenomena_comparable': True, 'appearance_explains_annotation_difference': False,
                'media_ids': media, 'limitations': ['覆盖限制来自冻结标注规范']}]
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
        group = evidence.freeze(run, anchor, checkpoint=lambda: None)
        reference = group.members[0].comparison
        citation = {'candidate_id': candidate, 'comparison': reference.model_dump(exclude={'anchor_side'})}

        def draft(verdict):
            return GroupAnalysisDraft.model_validate({'assessments': [{'candidate_id': candidate,
                'verdict': verdict, 'categories': ['多类别'] if verdict == 'MATERIAL' else [],
                'conclusion': '多类别' if verdict == 'MATERIAL' else '一致' if verdict == 'EQUIVALENT' else None,
                'explanation': '比较主图已标区域与候选可比域，并保留标注覆盖限制', 'findings': []}],
                'overall': {'verdict': verdict, 'text': '多类别' if verdict == 'MATERIAL' else '一致' if verdict == 'EQUIVALENT' else None,
                    'references': [citation]},
                'conclusions': [{'text': '标注覆盖与忽略区域限制缺标推断', 'references': [citation]}],
                'limitations': ['候选可比域的标注覆盖限制']})

        review = ConsistencyAgentReview(runtime, client)
        observed = review.observe(run, anchor, {'request_id': 'applicability', 'fingerprint': candidates.fingerprint,
            'candidate_ids': [candidate], 'question': '核实标注覆盖与共同可比域'})

        def submit(verdict):
            proposal = draft(verdict)
            record = review.assess(run, anchor, {'fingerprint': candidates.fingerprint,
                'assessment': proposal.assessments[0].model_dump(exclude={'conclusion'}),
                'observation_ids': [observed.observation_id]})
            return review.finalize(run, anchor, {'fingerprint': candidates.fingerprint,
                'assessment_ids': [record.assessment_id], 'overall': {'assessment_id': record.assessment_id},
                'conclusions': [item.text for item in proposal.conclusions], 'limitations': proposal.limitations})

        if case in ('exhaustive', 'main_partial'):
            with pytest.raises(ValueError):
                submit('UNCERTAIN')
            assert submit('MATERIAL').overall.verdict == 'MATERIAL'
        elif case == 'ignored':
            with pytest.raises(ValueError, match='适用|忽略|可比域'):
                submit('MATERIAL')
            assert submit('EQUIVALENT').overall.verdict == 'EQUIVALENT'
        else:
            for verdict in ('MATERIAL', 'EQUIVALENT'):
                with pytest.raises(ValueError, match='适用|覆盖|未提供'):
                    submit(verdict)
            result = submit('UNCERTAIN')
            assert result.overall.verdict == 'UNCERTAIN'
            assert result.overall.text is None
            assert result.assessments[0].conclusion is None
        raw = AnnotationInventory.compare(AnnotationSet.capture(db, anchor), AnnotationSet.capture(db, candidate))
        assert raw.left == {'dent': 1}
        assert raw.right == {}
        prepared = evidence.prepare(run, anchor, [candidate])
        assert all('annotation_availability' in source for source in prepared.facts['sources'].values())
        assert requests and all('annotation_applicability' in item for item in prepared.facts['evidence'])
    finally:
        client.close()
        runtime.close()
