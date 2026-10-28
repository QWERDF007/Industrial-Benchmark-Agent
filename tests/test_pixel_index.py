import json
import sqlite3
from pathlib import Path

import pytest
from PIL import Image, PngImagePlugin

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.dataset.scanner import scan_dataset
from iad_core.duplicate.index import PixelIndex
from iad_core.storage.database import Database
from iad_core.task.config import DatasetConfig
from iad_core.workbench.query import SampleQuery, WorkbenchQuery


def test_scan_groups_all_copies_with_linear_comparisons_and_pages_members(tmp_path):
    images, labels = tmp_path / 'images', tmp_path / 'labels'
    images.mkdir(); labels.mkdir()
    for i in range(80):
        metadata = PngImagePlugin.PngInfo()
        metadata.add_text('copy', str(i))
        Image.new('RGBA', (32, 32), (1, 2, 3, 4)).save(images / f'{i:03}.png', pnginfo=metadata)
    config = DatasetConfig.model_validate({'dataset':{'id':'copies','name':'副本'},
        'root':str(images),'task':{'task_id':'copies','inspection_target':'surface'},
        'annotations':{'root':str(labels)}})
    db = Database(str(tmp_path / 'index.db'))
    result = scan_dataset(config=config, db_path=db.db_path)
    index = PixelIndex(db)
    first = index.get('copies:000.png')
    assert first.content_group_id != first.descriptor.pixel_key
    page1 = index.members(first.content_group_id, page=1, page_size=24)
    page4 = index.members(first.content_group_id, page=4, page_size=24)
    assert page1.total == page4.total == 80
    assert len(page1.items) == 24 and len(page4.items) == 8
    assert all(item.content_group_id == first.content_group_id for item in page4.items)
    assert result.pixel_index.compared_pairs == 79
    assert result.pixel_index.decoded_images == 80
    assert result.pixel_index.coverage.completed == result.pixel_index.coverage.total == 80
    assert first.scan_ref == result.pixel_index.scan_ref


def test_label_changes_reuse_pixels_and_new_members_join_the_existing_group(dataset, tmp_path):
    db, registry, config = dataset
    index = PixelIndex(db)
    before = index.get(config.dataset.id + ':dent.png')
    label_path = Path(config.annotations.root) / 'dent.json'
    label = json.loads(label_path.read_text())
    label['shapes'][0]['label'] = '新类别'
    label_path.write_text(json.dumps(label))
    result = registry.rescan(config.dataset.id)
    after = index.get(before.sample_id)
    assert after.content_group_id == before.content_group_id
    assert after.scan_ref != before.scan_ref
    assert result.pixel_index.reused_samples == 4
    assert result.pixel_index.decoded_images == 0
    Image.open(Path(config.root) / 'dent.png').save(Path(config.root) / 'new.png', compress_level=0)
    registry.rescan(config.dataset.id)
    assert index.get(config.dataset.id + ':new.png').content_group_id == before.content_group_id


def test_corruption_missing_and_unsupported_images_do_not_keep_exact_membership(dataset):
    db, registry, config = dataset
    index = PixelIndex(db)
    previous = index.get(config.dataset.id + ':dent.png')
    (Path(config.root) / 'dent.png').write_bytes(b'broken PNG')
    (Path(config.root) / 'scratch.png').unlink()
    Image.new('F', (32, 32), 1.5).save(Path(config.root) / 'float.tiff')
    registry.rescan(config.dataset.id)
    for name in ('dent.png', 'scratch.png'):
        item = index.get(config.dataset.id + ':' + name)
        assert item.content_group_id is None
        assert item.descriptor.decode_status == 'UNAVAILABLE'
        assert item.descriptor.reason
    unsupported = index.get(config.dataset.id + ':float.tiff')
    assert unsupported.descriptor.decode_status == 'UNSUPPORTED'
    assert unsupported.content_group_id is None
    with pytest.raises(LookupError):
        index.members(previous.content_group_id)


def test_real_pixels_reject_a_corrupted_candidate_key(tmp_path):
    from iad_core.duplicate.pixels import PixelContent
    db = Database(str(tmp_path / 'collision.db'))
    registry = DatasetRegistry(db)
    left, right, labels = tmp_path / 'left', tmp_path / 'right', tmp_path / 'labels'
    left.mkdir(); right.mkdir(); labels.mkdir()
    Image.new('RGB', (32, 32), 'red').save(left / 'one.png')
    Image.new('RGB', (32, 32), 'blue').save(right / 'two.png')
    config = registry.import_labelme(DatasetImport(format='labelme', name='红',
        image_dir=str(left), annotation_dir=str(labels)))
    index = PixelIndex(db)
    normal = index.get(config.dataset.id + ':one.png')
    key = PixelContent.read(right / 'two.png').descriptor.pixel_key
    # Storage fault: a candidate-key collision must not become equality evidence.
    with db.connection() as connection:
        connection.execute('UPDATE sample_pixel_index SET pixel_key=? WHERE content_group_id=?',
            (key, normal.content_group_id))
    other = registry.import_labelme(DatasetImport(format='labelme', name='蓝',
        image_dir=str(right), annotation_dir=str(labels)))
    assert index.get(other.dataset.id + ':two.png').content_group_id != normal.content_group_id


def test_failed_scan_keeps_the_published_samples_and_pixel_index(dataset):
    db, registry, config = dataset
    index = PixelIndex(db)
    sample_id = config.dataset.id + ':normal.png'
    previous = index.get(sample_id)
    samples = WorkbenchQuery(db).samples(SampleQuery(dataset_id=config.dataset.id))
    Image.new('RGB', (32, 32), 'red').save(Path(config.root) / 'new.png')
    with db.connection() as connection:
        connection.execute("""CREATE TRIGGER reject_pixel_publish BEFORE INSERT ON sample_pixel_index
            BEGIN SELECT RAISE(ABORT,'pixel publication fault'); END""")
    with pytest.raises(sqlite3.IntegrityError, match='pixel publication fault'):
        registry.rescan(config.dataset.id)
    assert index.get(sample_id) == previous
    assert WorkbenchQuery(db).samples(SampleQuery(dataset_id=config.dataset.id)) == samples
    assert index.get(config.dataset.id + ':new.png') is None


def test_dataset_delete_preserves_other_members_and_removes_the_last_group(dataset, tmp_path):
    db, registry, config = dataset
    index = PixelIndex(db)
    member = index.get(config.dataset.id + ':normal.png')
    images, labels = tmp_path / 'other-images', tmp_path / 'other-labels'
    images.mkdir(); labels.mkdir()
    Image.open(Path(config.root) / 'normal.png').save(images / 'copy.png')
    other = registry.import_labelme(DatasetImport(format='labelme', name='副本数据集',
        image_dir=str(images), annotation_dir=str(labels)))
    copy = index.get(other.dataset.id + ':copy.png')
    assert copy.content_group_id == member.content_group_id
    registry.delete(config.dataset.id)
    assert index.get(member.sample_id) is None
    assert index.members(copy.content_group_id).total == 1
    registry.delete(other.dataset.id)
    with pytest.raises(LookupError):
        index.members(copy.content_group_id)
    with db.connection() as connection:
        assert connection.execute('PRAGMA foreign_key_check').fetchall() == []


def test_forced_public_rescan_refreshes_pixels_and_preserves_groups(dataset):
    from iad_core.entry import dataset_scan
    from iad_core.consistency.scopes import ConsistencyScopes
    db, _, config = dataset
    index = PixelIndex(db)
    before = index.get(config.dataset.id + ':normal.png')
    result = dataset_scan({'dataset_id':config.dataset.id, 'force_pixels':True}, db.db_path)
    after = index.get(before.sample_id)
    assert result['pixel_index']['reused_samples'] == 0
    assert result['pixel_index']['decoded_images'] >= 4
    assert after.scan_ref != before.scan_ref
    assert after.content_group_id == before.content_group_id
    scope = ConsistencyScopes(db).resolve({'kind':'datasets','dataset_ids':[config.dataset.id]})
    assert scope.scans[0].scan_ref == after.scan_ref


def test_scan_bounded_cache_and_16_bit_tiff_content(tmp_path):
    images, labels = tmp_path / 'images', tmp_path / 'labels'
    images.mkdir(); labels.mkdir()
    Image.new('I;16', (32, 32), 258).save(images / 'one.tif')
    Image.new('I;16', (32, 32), 258).save(images / 'two.tiff')
    Image.new('I;16', (32, 32), 259).save(images / 'low-bit.tiff')
    config = DatasetConfig.model_validate({'dataset':{'id':'sixteen','name':'16位'},
        'root':str(images),'task':{'task_id':'sixteen','inspection_target':'surface'},
        'annotations':{'root':str(labels)}})
    db = Database(str(tmp_path / 'index.db'))
    result = scan_dataset(config=config, db_path=db.db_path, pixel_cache_bytes=2048)
    index = PixelIndex(db)
    one, two, low = [index.get('sixteen:' + name) for name in ['one.tif','two.tiff','low-bit.tiff']]
    assert one.content_group_id == two.content_group_id != low.content_group_id
    assert one.descriptor.bit_depth == 16
    assert result.pixel_index.cache_peak_bytes <= 2048
    assert result.pixel_index.coverage.completed == 3


def test_changed_image_leaves_its_previous_group(dataset):
    db, registry, config = dataset
    index = PixelIndex(db)
    previous = index.get(config.dataset.id + ':normal.png')
    path = Path(config.root) / 'normal.png'
    with Image.open(path) as original:
        changed = original.copy()
    changed.putpixel((319, 239), (255, 0, 0))
    changed.save(path)
    result = registry.rescan(config.dataset.id)
    current = index.get(previous.sample_id)
    assert current.content_group_id != previous.content_group_id
    assert current.descriptor.pixel_key != previous.descriptor.pixel_key
    assert result.pixel_index.reused_samples == 3
    assert result.pixel_index.decoded_images == 1
    with pytest.raises(LookupError):
        index.members(previous.content_group_id)


def test_migration_preserves_current_samples_and_human_review(dataset):
    from uuid import uuid4
    from iad_core.workbench.review import HumanReview, ReviewHistoryQuery, ReviewSubmission
    db, registry, config = dataset
    review = HumanReview(db)
    review.submit(ReviewSubmission(submission_id=uuid4(), dataset_id=config.dataset.id,
        sample_id=config.dataset.id + ':normal.png', reviewer='人工确认', decision='HARD_NORMAL'))
    samples = WorkbenchQuery(db).samples(SampleQuery(dataset_id=config.dataset.id))
    history_query = ReviewHistoryQuery(dataset_id=config.dataset.id)
    history = review.history(history_query)
    with db.connection() as connection:
        connection.execute('DROP VIEW sample_features')
        connection.execute('DROP TABLE feature_records')
        connection.execute('CREATE TABLE feature_records(sample_id TEXT,model_id TEXT,preprocess_key TEXT,embedding_blob BLOB)')
        connection.execute('INSERT INTO feature_records VALUES(?,?,?,?)',(config.dataset.id+':normal.png','legacy','legacy',b'old-derived-vector'))
        connection.execute('DROP TABLE sample_pixel_index')
        connection.execute('DROP TABLE image_content_groups')
        connection.execute('ALTER TABLE datasets DROP COLUMN scan_ref')
    migrated = Database(db.db_path)
    with migrated.connection() as connection:
        assert 'sample_id' not in {row[1] for row in connection.execute('PRAGMA table_info(feature_records)')}
        assert connection.execute('SELECT count(*) FROM feature_records').fetchone()[0]==0
    assert WorkbenchQuery(migrated).samples(SampleQuery(dataset_id=config.dataset.id)) == samples
    assert HumanReview(migrated).history(history_query) == history
    assert PixelIndex(migrated).get(config.dataset.id + ':normal.png') is None
    registry.rescan(config.dataset.id)
    assert PixelIndex(migrated).get(config.dataset.id + ':normal.png').content_group_id
    assert HumanReview(migrated).history(history_query) == history
