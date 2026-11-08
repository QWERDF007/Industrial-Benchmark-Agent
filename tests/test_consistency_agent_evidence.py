import json
import shutil
import pytest
from uuid import uuid4
from PIL import Image

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.workbench.review import HumanReview, ReviewSubmission
from iad_core.workbench.runtime import WorkbenchRuntime


def test_zero_area_annotation_is_an_execution_error_before_model_review(dataset, tmp_path):
    from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
    from iad_core.consistency.errors import ConsistencyError
    from iad_core.consistency.agent_results import ConsistencyAgentResults

    database, registry, config = dataset
    (tmp_path / 'labels/dent.json').write_text(json.dumps({'shapes': [
        {'label': 'dent', 'shape_type': 'rectangle', 'points': [[10, 10], [10, 20]]}]}))
    registry.rescan(config.dataset.id)
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':dent.png'
        run = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
        checks.session_created(run, anchor)
        checks.retrieve(run, anchor)
        with pytest.raises(ConsistencyError, match='Imported annotation geometry is invalid') as failure:
            ConsistencyAgentEvidence(runtime).freeze(run, anchor, checkpoint=lambda: None)
        assert failure.value.code == 'ANNOTATION_UNREADABLE'
        assert checks.anchor(run, anchor).result is None
        detail = ConsistencyAgentResults(database).detail(run, anchor)
        assert len(detail.evidence) == 1
        retained = runtime.consistency_service.evidence(detail.evidence[0].evidence_id)
        assert retained.sources.left.sample.sample_id == anchor
        assert retained.result.annotation.invalid_left == 1
        assert detail.evidence[0].detail_ref.endswith(detail.evidence[0].evidence_id)
        from iad_core.workbench.analysis_job_views import AnalysisJobViews
        assert AnalysisJobViews(database).view(run)['model_calls'] == []
    finally:
        runtime.close()


@pytest.mark.parametrize('shape_type,points', [
    ('rectangle', [[-5, 10], [330, 30]]),
    ('polygon', [[-5, 10], [330, 10], [330, 30], [-5, 30]]),
])
def test_out_of_frame_annotations_keep_original_coordinates_and_clip_only_visual_crops(dataset, tmp_path, shape_type, points):
    from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
    from iad_core.storage.repositories import AnnotationRepository

    database, registry, config = dataset
    label = tmp_path / 'labels/dent.json'
    original = json.dumps({'imageWidth': 320, 'imageHeight': 240, 'shapes': [
        {'label': 'dent', 'shape_type': shape_type, 'points': points}]})
    label.write_text(original)
    registry.rescan(config.dataset.id)
    anchor = config.dataset.id + ':dent.png'
    annotation, = AnnotationRepository(database).list_by_sample(anchor)
    assert annotation.bbox == [-5, 10, 330, 30]
    assert annotation.geometry_status == 'VALID'
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        run = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
        checks.session_created(run, anchor)
        candidates = checks.retrieve(run, anchor)
        prepared = ConsistencyAgentEvidence(runtime).prepare(run, anchor, [candidates.candidates[0].sample_id])
        source = next(value for value in prepared.facts['sources'].values() if value['sample_id'] == anchor)
        assert source['annotations'][0]['bbox'] == [-5, 10, 330, 30]
        if shape_type == 'polygon':
            assert source['annotations'][0]['polygon'] == points
        crops = [item for item in source['visual_inputs'] if item['window_source'] == 'annotation']
        assert len(crops) == 1
        assert crops[0]['crop_bbox'] == [0, 6, 320, 34]
        image = next(item for item in prepared.images if item.evidence.evidence_id == crops[0]['evidence_id'])
        with Image.open(image.path) as pixels:
            assert pixels.size == (320, 28)
            assert pixels.getpixel((0, 0)) == (0, 0, 255)
        assert AnnotationRepository(database).list_by_sample(anchor) == [annotation]
        assert label.read_text() == original
    finally:
        runtime.close()


def test_mask_with_matching_hash_but_wrong_canvas_is_an_execution_error(defect_dataset):
    from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
    from iad_core.consistency.errors import ConsistencyError
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.evidence.masks import MaskImages
    from iad_core.storage.repositories import AnnotationRepository

    database, row, _, images = defect_dataset
    anchor = row['dataset_id'] + ':part-3.png'
    shutil.copyfile(images / 'part-3.png', images / 'part-2.png')
    DatasetRegistry(database).rescan(row['dataset_id'])
    annotations = AnnotationRepository(database)
    original = annotations.list_by_sample(anchor)[0]
    path, digest = MaskImages(database.db_path).store(MaskImages.encode(Image.new('L', (20, 20), 255)))
    annotations.upsert(original.model_copy(update={'mask_path': path, 'mask_sha256': digest}))
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        run = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [row['dataset_id']], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
        checks.session_created(run, anchor)
        checks.retrieve(run, anchor)
        with pytest.raises(ConsistencyError, match='Mask pixels do not match the sample dimensions') as failure:
            ConsistencyAgentEvidence(runtime).freeze(run, anchor, checkpoint=lambda: None)
        assert failure.value.code == 'ANNOTATION_UNREADABLE'
        assert checks.anchor(run, anchor).result is None
    finally:
        runtime.close()


def test_annotation_matching_capacity_remains_a_resource_error(dataset, tmp_path):
    from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
    from iad_core.consistency.errors import ConsistencyError

    database, registry, config = dataset
    (tmp_path / 'labels/dent.json').write_text(json.dumps({'shapes': [
        {'label': 'dent', 'shape_type': 'rectangle', 'points': [[10, 10], [20, 20]]} for _ in range(501)]}))
    registry.rescan(config.dataset.id)
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':dent.png'
        run = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
        checks.session_created(run, anchor)
        checks.retrieve(run, anchor)
        with pytest.raises(ConsistencyError, match='instance count exceeds matching budget') as failure:
            ConsistencyAgentEvidence(runtime).freeze(run, anchor, checkpoint=lambda: None)
        assert failure.value.code == 'RESOURCE_LIMIT'
        assert checks.anchor(run, anchor).result is None
    finally:
        runtime.close()


def test_resume_reuses_captured_candidate_when_its_original_file_is_unavailable(dataset, tmp_path):
    from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
    from iad_core.consistency.agent_results import ConsistencyAgentResults
    from iad_core.consistency.errors import ConsistencyError

    database, registry, config = dataset
    for name in ('A', 'Z'):
        shutil.copyfile(tmp_path / 'images/dent.png', tmp_path / f'images/{name}.png')
    registry.rescan(config.dataset.id)
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':dent.png'
        run = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
        checks.session_created(run, anchor)
        checks.retrieve(run, anchor)
        image = tmp_path / 'images/Z.png'
        original = image.read_bytes()
        image.write_bytes(b'broken original')
        evidence = ConsistencyAgentEvidence(runtime)
        with pytest.raises(ConsistencyError) as failure:
            evidence.freeze(run, anchor, checkpoint=lambda: None)
        assert failure.value.code == 'SOURCE_UNAVAILABLE'
        checks.fail(run, anchor, str(failure.value), failure.value.code)
        runtime.jobs.finish_external(run)
        before = ConsistencyAgentResults(database).detail(run, anchor)
        assert [item.candidate_id for item in before.evidence] == [config.dataset.id + ':A.png']
        assert before.result is None
        image.write_bytes(original)
        (tmp_path / 'images/A.png').unlink()
        checks.resume(run)
        group = evidence.freeze(run, anchor, checkpoint=lambda: None)
        assert len(group.members) == 3
        after = ConsistencyAgentResults(database).detail(run, anchor)
        assert after.session_id == before.session_id and after.attempt == 2
        assert len(after.evidence) == 3 and after.evidence[0] == before.evidence[0]
        prepared = evidence.prepare(run, anchor, [config.dataset.id + ':A.png'])
        assert prepared.images
        for item in prepared.images:
            with Image.open(item.path) as pixels:
                assert pixels.width > 0
    finally:
        runtime.close()


def test_resume_recaptures_restored_mask_and_keeps_failed_evidence(defect_dataset):
    from pathlib import Path
    from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
    from iad_core.consistency.agent_results import ConsistencyAgentResults
    from iad_core.consistency.errors import ConsistencyError
    from iad_core.dataset.registry import DatasetRegistry
    from iad_core.storage.repositories import AnnotationRepository

    database, row, _, images = defect_dataset
    anchor = row['dataset_id'] + ':part-3.png'
    shutil.copyfile(images / 'part-3.png', images / 'part-2.png')
    DatasetRegistry(database).rescan(row['dataset_id'])
    mask = Path(AnnotationRepository(database).list_by_sample(anchor)[0].mask_path)
    original = mask.read_bytes()
    mask.unlink()
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        run = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [row['dataset_id']], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
        checks.session_created(run, anchor)
        checks.retrieve(run, anchor)
        evidence = ConsistencyAgentEvidence(runtime)
        with pytest.raises(ConsistencyError) as failure:
            evidence.freeze(run, anchor, checkpoint=lambda: None)
        checks.fail(run, anchor, str(failure.value), failure.value.code)
        runtime.jobs.finish_external(run)
        before = ConsistencyAgentResults(database).detail(run, anchor)
        assert len(before.evidence) == 1
        mask.write_bytes(original)
        checks.resume(run)
        group = evidence.freeze(run, anchor, checkpoint=lambda: None)
        after = ConsistencyAgentResults(database).detail(run, anchor)
        assert len(after.evidence) == 2
        assert after.evidence[0] == before.evidence[0]
        assert after.evidence[1].evidence_id != before.evidence[0].evidence_id
        assert group.members[0].comparison.evidence_id == after.evidence[1].evidence_id
        assert runtime.consistency_service.evidence(before.evidence[0].evidence_id).sources.left.issues
        assert runtime.consistency_service.evidence(after.evidence[1].evidence_id).sources.left.issues == []
        assert after.result is None and after.attempt == 2
    finally:
        runtime.close()


def test_existing_frozen_group_keeps_its_evidence_references_after_database_upgrade(dataset, tmp_path):
    from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
    from iad_core.consistency.agent_results import ConsistencyAgentResults
    from iad_core.storage.database import Database

    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor = config.dataset.id + ':dent.png'
        run = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor]}})['run_id']
        checks.session_created(run, anchor)
        checks.retrieve(run, anchor)
        group = ConsistencyAgentEvidence(runtime).freeze(run, anchor, checkpoint=lambda: None)
        before = ConsistencyAgentResults(database).detail(run, anchor)
        assert len(before.evidence) == len(group.members) == 1
        with database.connection() as connection:
            connection.execute('DROP TABLE consistency_anchor_evidence')
        for path in (tmp_path / 'images').iterdir():
            path.unlink()
        upgraded = Database(database.db_path)
        after = ConsistencyAgentResults(upgraded).detail(run, anchor)
        assert after == before
    finally:
        runtime.close()


def test_agent_evidence_uses_original_sources_without_historical_review_judgments(dataset, tmp_path):
    from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence

    database, registry, config = dataset
    shutil.copyfile(tmp_path / 'images/dent.png', tmp_path / 'images/empty.png')
    registry.rescan(config.dataset.id)
    anchor_id = config.dataset.id + ':dent.png'
    candidate_id = config.dataset.id + ':empty.png'
    HumanReview(database).submit(ReviewSubmission(submission_id=str(uuid4()), dataset_id=config.dataset.id,
        sample_id=anchor_id, reviewer='reviewer-identity', decision='PASS', comment='historical-review-judgment'))
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        job = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor_id]}})
        checks.session_created(job['run_id'], anchor_id)
        checks.retrieve(job['run_id'], anchor_id)
        prepared = ConsistencyAgentEvidence(runtime).prepare(job['run_id'], anchor_id, [candidate_id])
        assert set(prepared.facts['candidates']) == {candidate_id}
        assert {item['sample_id'] for item in prepared.facts['sources'].values()} == {anchor_id, candidate_id}
        assert 'historical-review-judgment' not in json.dumps(prepared.facts)
        assert all('review' not in item for item in prepared.facts['evidence'])
        assert prepared.images and all(image.evidence.representation == 'raw' for image in prepared.images)
        candidate_source = next(item for item in prepared.facts['sources'].values() if item['sample_id'] == candidate_id)
        assert candidate_source['annotations'] == []
        mapped = [item for item in candidate_source['visual_inputs'] if item.get('window_source') == 'mapped_window']
        assert len(mapped) == 1
        assert mapped[0]['window_from'] == anchor_id
        assert mapped[0]['annotation_origins'] == []
        assert mapped[0]['crop_bbox'] == [6, 6, 34, 34]
        image = next(item for item in prepared.images if item.evidence.evidence_id == mapped[0]['evidence_id'])
        with Image.open(image.path) as pixels:
            assert pixels.size == (28, 28)
            assert pixels.convert('RGB').getextrema() == ((0, 0), (0, 0), (255, 255))
        next_page = ConsistencyAgentEvidence(runtime).prepare(job['run_id'], anchor_id, [config.dataset.id + ':scratch.png'])
        assert {item['sample_id'] for item in next_page.facts['sources'].values()} == {anchor_id, config.dataset.id + ':scratch.png'}
    finally:
        runtime.close()


def test_visual_windows_capture_original_pixels_with_clipped_padding_only_from_the_current_page(dataset):
    from iad_core.consistency.agent_evidence import ConsistencyAgentEvidence
    from iad_core.consistency.group_models import VisualWindow

    database, _, config = dataset
    runtime = WorkbenchRuntime(database)
    try:
        checks = ConsistencyAgentJobs(runtime)
        anchor_id, candidate_id = [config.dataset.id + ':' + name + '.png' for name in ('dent', 'scratch')]
        job_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [config.dataset.id], 'mode': 'exact',
            'subjects': {'kind': 'samples', 'sample_ids': [anchor_id]}})['run_id']
        checks.session_created(job_id, anchor_id)
        checks.retrieve(job_id, anchor_id)
        window = VisualWindow(sample_id=candidate_id, bbox=(2, 3, 12, 9), padding=5, reason='确认无叠加局部的原始像素')
        service = ConsistencyAgentEvidence(runtime)
        prepared = service.prepare(job_id, anchor_id, [candidate_id], windows=[window])
        source = next(item for item in prepared.facts['sources'].values() if item['sample_id'] == candidate_id)
        captured = [item for item in source['visual_inputs'] if item.get('window_source') == 'visual_window']
        assert len(captured) == 1
        assert captured[0]['requested_bbox'] == [2, 3, 12, 9]
        assert captured[0]['padding'] == 5
        assert captured[0]['crop_bbox'] == [0, 0, 17, 14]
        assert captured[0]['annotation_origins'] == []
        image = next(item for item in prepared.images if item.evidence.evidence_id == captured[0]['evidence_id'])
        assert image.evidence.representation == 'raw' and image.evidence.source == 'model'
        with Image.open(image.path) as pixels:
            assert pixels.size == (17, 14)
            assert pixels.convert('RGB').getextrema() == ((0, 0), (0, 0), (255, 255))
        with pytest.raises(ValueError, match='本页'):
            service.prepare(job_id, anchor_id, [candidate_id], windows=[window.model_copy(update={'sample_id': config.dataset.id + ':normal.png'})])
        clipped = service.prepare(job_id, anchor_id, [candidate_id],
            windows=[window.model_copy(update={'bbox': (310, 230, 330, 245)})])
        source = next(item for item in clipped.facts['sources'].values() if item['sample_id'] == candidate_id)
        captured = [item for item in source['visual_inputs'] if item['window_source'] == 'visual_window']
        assert captured[0]['requested_bbox'] == [310, 230, 330, 245]
        assert captured[0]['crop_bbox'] == [305, 225, 320, 240]
    finally:
        runtime.close()
