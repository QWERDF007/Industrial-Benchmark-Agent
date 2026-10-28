import json
import pytest

from PIL import Image

from iad_core.consistency.annotations import AnnotationSet
from iad_core.consistency.annotations import AnnotationMatcher
from iad_core.consistency.policy import AnnotationPolicy
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.storage.database import Database
from iad_core.storage.repositories import AnnotationRepository
from iad_core.storage.models import Annotation, GeometryStatus
from iad_core.consistency.annotation_models import AnnotationMatchingConfig


def side(identity, annotations):
    return AnnotationSet(sample_id=identity, dataset_id=identity, width=40, height=30,
        quality_status='PASS', quality_source='source:OK', annotations=annotations,
        policy=AnnotationPolicy(policy_id='surface', annotation_role='REFERENCE', annotation_coverage='EXHAUSTIVE'))


def test_import_preserves_only_explicit_boolean_ignore_flags_and_rescans_them(tmp_path):
    root = tmp_path / 'images'
    root.mkdir()
    Image.new('RGB', (40, 30), 'blue').save(root / 'part.png')
    label = {'imageWidth': 40, 'imageHeight': 30, 'shapes': [
        {'label': 'border', 'shape_type': 'rectangle', 'points': [[0, 0], [10, 30]], 'flags': {'ignore': True}},
        {'label': 'ignore', 'shape_type': 'rectangle', 'points': [[12, 0], [20, 20]], 'flags': None},
        {'label': 'dent', 'shape_type': 'rectangle', 'points': [[22, 0], [30, 20]], 'flags': {'ignore': False}},
    ]}
    path = root / 'part.json'
    path.write_text(json.dumps(label))
    db = Database(str(tmp_path / 'ignore.db'))
    registry = DatasetRegistry(db)
    config = registry.import_labelme(DatasetImport(format='labelme', name='explicit regions',
        image_dir=str(root), annotation_dir=str(root)))
    sample_id = config.dataset.id + ':part.png'
    annotations = AnnotationRepository(db).list_by_sample(sample_id)
    assert [annotation.is_ignored for annotation in annotations] == [True, False, False]
    assert AnnotationSet.capture(db, sample_id).annotations == annotations
    label['shapes'][0]['flags']['ignore'] = False
    path.write_text(json.dumps(label))
    registry.rescan(config.dataset.id)
    assert not any(annotation.is_ignored for annotation in AnnotationRepository(db).list_by_sample(sample_id))


def test_explicit_ignore_regions_exclude_contained_instances_without_creating_missing_labels():
    ignore = Annotation(annotation_id='left:ignore', sample_id='left', annotation_type='bbox',
        raw_label='not inspected', bbox=[0, 0, 10, 30], is_ignored=True)
    defect = Annotation(annotation_id='right:defect', sample_id='right', annotation_type='bbox',
        raw_label='dent', bbox=[2, 2, 8, 12])
    result = AnnotationMatcher().compare(side('left', [ignore]), side('right', [defect]), relation='EXACT')
    assert result.status == 'COMPLETE' and result.matches == result.differences == []
    assert not result.confirmed_conflict
    assert result.ignore_regions == [ignore]
    assert len(result.masking) == 1
    masking = result.masking[0]
    assert masking.annotation_id == defect.annotation_id
    assert masking.visible_pixels == 0 and masking.total_pixels == 60
    assert masking.ignore_annotation_ids == [ignore.annotation_id]


@pytest.mark.parametrize('opposite_label', ['dent', 'scratch'])
def test_partial_ignore_compares_the_remaining_region_and_preserves_bbox_semantics(opposite_label):
    ignore = Annotation(annotation_id='left:ignore', sample_id='left', annotation_type='bbox',
        raw_label='exclude', bbox=[0, 0, 10, 10], is_ignored=True)
    first = Annotation(annotation_id='left:a', sample_id='left', annotation_type='bbox', raw_label='dent', bbox=[0, 0, 20, 10])
    second = Annotation(annotation_id='right:b', sample_id='right', annotation_type='bbox', raw_label=opposite_label, bbox=[10, 0, 20, 10])
    result = AnnotationMatcher().compare(side('left', [ignore, first]), side('right', [second]), relation='EXACT')
    assert result.status == 'COMPLETE' and len(result.matches) == 1
    assert result.matches[0].geometry_equal
    assert result.matches[0].comparison_kind == 'LOCATION_ONLY' and result.matches[0].segmentation_iou is None
    assert [difference.type for difference in result.differences] == ([] if opposite_label == 'dent' else ['CATEGORY'])
    assert result.masking[0].total_pixels == 200 and result.masking[0].visible_pixels == 100
    assert first.bbox == [0, 0, 20, 10]


def test_instances_outside_ignore_still_report_missing_and_invalid_ignore_never_hides_them():
    ignore = Annotation(annotation_id='left:ignore', sample_id='left', annotation_type='bbox',
        raw_label='exclude', bbox=[0, 0, 10, 30], is_ignored=True)
    defect = Annotation(annotation_id='right:b', sample_id='right', annotation_type='bbox', raw_label='dent', bbox=[12, 2, 20, 12])
    matcher = AnnotationMatcher()
    result = matcher.compare(side('left', [ignore]), side('right', [defect]), relation='EXACT')
    assert [difference.type for difference in result.differences] == ['ONE_SIDED_REGION']
    assert result.confirmed_conflict and result.differences[0].suspected_missing == 'left'
    ignore.geometry_status = GeometryStatus.INVALID
    incomplete = matcher.compare(side('left', [ignore]), side('right', [defect]), relation='EXACT')
    assert incomplete.status == 'UNAVAILABLE' and incomplete.invalid_left == 1
    assert not incomplete.confirmed_conflict
    assert not any(difference.type == 'ONE_SIDED_REGION' for difference in incomplete.differences)
    assert any(difference.type == 'ANNOTATION_UNREADABLE' for difference in incomplete.differences)


def test_masked_bbox_preparation_respects_the_shared_prepared_pixel_budget():
    ignore = Annotation(annotation_id='left:ignore', sample_id='left', annotation_type='bbox',
        raw_label='exclude', bbox=[0, 0, 10, 10], is_ignored=True)
    defect = Annotation(annotation_id='right:b', sample_id='right', annotation_type='bbox', raw_label='dent', bbox=[0, 0, 20, 10])
    result = AnnotationMatcher(AnnotationMatchingConfig(max_cached_pixels=20)).compare(
        side('left', [ignore]), side('right', [defect]), relation='EXACT')
    assert result.status == 'PARTIAL' and result.invalid_right == 1
    assert not result.confirmed_conflict
    assert any(difference.type == 'ANNOTATION_UNREADABLE' and 'RESOURCE_LIMIT' in difference.facts['reason'] for difference in result.differences)


@pytest.mark.parametrize('kind', ['polygon', 'mask'])
def test_nonrectangular_ignore_does_not_hide_a_defect_in_its_bounding_box_hole(tmp_path, kind):
    from PIL import ImageDraw
    from iad_core.evidence.masks import MaskImages

    polygon = [[0, 0], [4, 0], [4, 14], [19, 14], [19, 19], [0, 19]]
    fields = {'polygon': polygon}
    if kind == 'mask':
        mask = Image.new('L', (40, 30))
        ImageDraw.Draw(mask).polygon(polygon, fill=255)
        path, sha = MaskImages(str(tmp_path / 'masks.db')).store(MaskImages.encode(mask))
        fields = {'mask_path': path, 'mask_sha256': sha}
    ignore = Annotation(annotation_id='left:ignore', sample_id='left', annotation_type=kind,
        raw_label='exclude', bbox=[0, 0, 20, 20], is_ignored=True, **fields)
    contained = Annotation(annotation_id='right:inside', sample_id='right', annotation_type='bbox', raw_label='dent', bbox=[0, 5, 5, 10])
    in_hole = Annotation(annotation_id='right:hole', sample_id='right', annotation_type='bbox', raw_label='dent', bbox=[10, 0, 15, 5])
    result = AnnotationMatcher().compare(side('left', [ignore]), side('right', [contained, in_hole]), relation='EXACT')
    assert result.status == 'COMPLETE' and result.confirmed_conflict
    assert [difference.right[0].annotation_id for difference in result.differences] == [in_hole.annotation_id]
    assert result.masking[0].annotation_id == contained.annotation_id and result.masking[0].visible_pixels == 0


def test_overlapping_ignore_sources_form_a_union_and_do_not_double_count_pixels():
    ignores = [Annotation(annotation_id='left:ignore', sample_id='left', annotation_type='bbox',
        raw_label='exclude', bbox=[0, 0, 8, 10], is_ignored=True),
        Annotation(annotation_id='right:ignore', sample_id='right', annotation_type='bbox',
        raw_label='exclude', bbox=[5, 0, 10, 10], is_ignored=True)]
    defect = Annotation(annotation_id='left:a', sample_id='left', annotation_type='bbox', raw_label='dent', bbox=[0, 0, 20, 10])
    result = AnnotationMatcher().compare(side('left', [ignores[0], defect]), side('right', [ignores[1]]), relation='EXACT')
    assert len(result.masking) == 1
    assert result.masking[0].total_pixels == 200 and result.masking[0].visible_pixels == 100
    assert set(result.masking[0].ignore_annotation_ids) == {ignore.annotation_id for ignore in ignores}
    assert result.differences[0].region == [10, 0, 20, 10]


def test_spatial_ignore_does_not_turn_image_level_labels_into_segmentations():
    ignore = Annotation(annotation_id='left:ignore', sample_id='left', annotation_type='bbox',
        raw_label='exclude', bbox=[0, 0, 10, 30], is_ignored=True)
    first = Annotation(annotation_id='left:class', sample_id='left', annotation_type='image', raw_label='dent')
    second = Annotation(annotation_id='right:class', sample_id='right', annotation_type='image', raw_label='scratch')
    result = AnnotationMatcher().compare(side('left', [ignore, first]), side('right', [second]), relation='EXACT')
    assert len(result.matches) == 1 and result.matches[0].comparison_kind == 'IMAGE_LABEL'
    assert result.masking == []
    assert [difference.type for difference in result.differences] == ['CATEGORY']
    assert result.confirmed_conflict


def test_split_merge_uses_visible_coverage_when_ignore_removes_the_middle_of_a_bbox():
    ignore = Annotation(annotation_id='left:ignore', sample_id='left', annotation_type='bbox',
        raw_label='exclude', bbox=[8, 0, 12, 10], is_ignored=True)
    whole = Annotation(annotation_id='left:whole', sample_id='left', annotation_type='bbox', raw_label='dent', bbox=[0, 0, 20, 10])
    pieces = [Annotation(annotation_id='right:a', sample_id='right', annotation_type='bbox', raw_label='dent', bbox=[0, 0, 8, 10]),
        Annotation(annotation_id='right:b', sample_id='right', annotation_type='bbox', raw_label='dent', bbox=[12, 0, 20, 10])]
    result = AnnotationMatcher().compare(side('left', [ignore, whole]), side('right', pieces), relation='EXACT')
    assert [difference.type for difference in result.differences] == ['SPLIT_MERGE']
    assert result.differences[0].facts['combined_coverage'] == 1
    assert result.differences[0].facts['coverage_basis'] == 'visible_pixels'
    assert result.masking[0].visible_pixels == 160
    assert not result.confirmed_conflict


def test_subpixel_instances_with_no_pixel_centres_remain_finite_next_to_masked_regions():
    ignore = Annotation(annotation_id='left:ignore', sample_id='left', annotation_type='bbox',
        raw_label='exclude', bbox=[0, 0, 1, 3], is_ignored=True)
    first = Annotation(annotation_id='left:a', sample_id='left', annotation_type='bbox', raw_label='dent', bbox=[0, 0, 3, 3])
    tiny = Annotation(annotation_id='right:tiny', sample_id='right', annotation_type='bbox', raw_label='dent', bbox=[1.1, .1, 1.2, .2])
    result = AnnotationMatcher().compare(side('left', [ignore, first]), side('right', [tiny]), relation='EXACT')
    assert result.status == 'COMPLETE'
    assert not any(difference.type == 'SPLIT_MERGE' for difference in result.differences)
    assert len(result.differences) == 2
    small = next(difference for difference in result.differences if difference.right)
    assert small.type == 'AMBIGUOUS_MATCH' and not small.confirmed_conflict


@pytest.mark.parametrize('value', ['true', 1, None])
def test_invalid_ignore_values_are_unreadable_annotations_instead_of_silent_exclusions(tmp_path, value):
    root = tmp_path / 'invalid'
    root.mkdir()
    Image.new('RGB', (40, 30), 'blue').save(root / 'part.png')
    (root / 'part.json').write_text(json.dumps({'imageWidth': 40, 'imageHeight': 30, 'shapes': [
        {'label': 'dent', 'shape_type': 'rectangle', 'points': [[0, 0], [10, 20]], 'flags': {'ignore': value}}]}))
    db = Database(str(tmp_path / 'invalid.db'))
    config = DatasetRegistry(db).import_labelme(DatasetImport(format='labelme', name='invalid flags',
        image_dir=str(root), annotation_dir=str(root)))
    captured = AnnotationSet.capture(db, config.dataset.id + ':part.png')
    assert captured.errors and captured.annotations == []


def test_existing_annotations_survive_the_additive_ignore_migration(dataset):
    db, _, config = dataset
    sample_id = config.dataset.id + ':dent.png'
    before = AnnotationRepository(db).list_by_sample(sample_id)
    with db.connection() as connection:
        connection.execute('ALTER TABLE annotations DROP COLUMN is_ignored')
    Database(db.db_path)
    Database(db.db_path)
    after = AnnotationRepository(db).list_by_sample(sample_id)
    assert after == before and not any(annotation.is_ignored for annotation in after)
    with db.connection() as connection:
        assert connection.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
