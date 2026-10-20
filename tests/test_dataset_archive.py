import stat
from pathlib import Path
from zipfile import ZIP_STORED, ZipFile, ZipInfo

import pytest
from PIL import Image

from iad_core.entry import dataset_archive_inspect, dataset_import, dataset_list, sample_get


def test_uploaded_labelme_archive_preserves_images_annotations_and_mask_pixels(defect_dataset, tmp_path):
    db, _, original, images = defect_dataset
    archive_path = tmp_path / '产品.zip'
    with ZipFile(archive_path, 'w') as archive:
        for directory in [images, images.parent / 'labels']:
            for item in directory.rglob('*'):
                if item.is_file():
                    archive.write(item, '产品/' + item.relative_to(images.parent).as_posix())
    inspected = dataset_archive_inspect({'archive_path': str(archive_path)}, db.db_path)
    assert len(inspected['sha256']) == 64
    assert inspected['file_count'] == 5
    assert next(d for d in inspected['directories'] if d['path'] == '产品/images')['image_count'] == 4
    assert next(d for d in inspected['directories'] if d['path'] == '产品/labels')['annotation_count'] == 1
    imported = dataset_import({'name': '附件孔板', 'archive_path': str(archive_path),
        'image_dir': '产品/images', 'annotation_dir': '产品/labels'}, db.db_path)
    assert imported['total_samples'] == 4
    assert len(dataset_list({}, db.db_path)['datasets']) == 2
    target = sample_get({'sample_id': imported['dataset_id'] + ':part-3.png'}, db.db_path)
    assert target['annotations'][0]['annotation_type'] == 'mask'
    assert target['annotations'][0]['bbox'] == [80, 90, 121, 151]
    assert target['review_decision'] is None
    assert Path(target['sample']['image_path']).read_bytes() == (images / 'part-3.png').read_bytes()
    assert (Path(imported['annotation_dir']) / 'part-3.json').read_bytes() == (images.parent / 'labels/part-3.json').read_bytes()
    with Image.open(target['annotations'][0]['mask_path']) as mask:
        assert mask.size == (320, 240)
        assert mask.getpixel((90, 110)) == 255
        assert mask.getpixel((80, 90)) == 0
    with pytest.raises(ValueError, match='already been imported'):
        dataset_import({'name': '重复附件', 'archive_path': str(archive_path),
            'image_dir': '产品/images', 'annotation_dir': '产品/labels'}, db.db_path)
    assert sample_get({'sample_id': original['sample']['sample_id']}, db.db_path) == original


@pytest.mark.parametrize('filename', ['../outside.png', '/outside.png', 'C:/outside.png', r'images\outside.png'])
def test_archive_paths_are_rejected_before_any_extraction_or_registration(tmp_path, filename):
    archive_path = tmp_path / 'invalid.zip'
    with ZipFile(archive_path, 'w') as archive:
        archive.writestr(filename, b'not image data')
    db_path = str(tmp_path / 'db' / 'workbench.db')
    with pytest.raises(ValueError, match='relative'):
        dataset_import({'name': '无效包', 'archive_path': str(archive_path),
            'image_dir': '.', 'annotation_dir': '.'}, db_path)
    assert dataset_list({}, db_path)['datasets'] == []
    assert not (tmp_path / 'db' / 'datasets').exists()


def test_archive_symlink_and_conflicting_entries_are_not_extracted(tmp_path):
    archive_path = tmp_path / 'invalid.zip'
    link = ZipInfo('images/link')
    link.create_system = 3
    link.external_attr = (stat.S_IFLNK | 0o777) << 16
    with ZipFile(archive_path, 'w') as archive:
        archive.writestr(link, '../outside')
    with pytest.raises(ValueError, match='regular files'):
        dataset_archive_inspect({'archive_path': str(archive_path)}, str(tmp_path / 'workbench.db'))
    with ZipFile(archive_path, 'w') as archive:
        archive.writestr('images', b'file')
        archive.writestr('images/part.png', b'image')
    with pytest.raises(ValueError, match='conflict'):
        dataset_archive_inspect({'archive_path': str(archive_path)}, str(tmp_path / 'workbench.db'))


def test_damaged_archive_never_publishes_partial_extraction_or_dataset(tmp_path):
    archive_path = tmp_path / 'damaged.zip'
    with ZipFile(archive_path, 'w', ZIP_STORED) as archive:
        archive.writestr('images/part.png', b'deliberate unique payload')
        archive.writestr('labels/', b'')
    archive_path.write_bytes(archive_path.read_bytes().replace(b'deliberate unique payload', b'corrupted!unique payload!'))
    db_path = str(tmp_path / 'workbench.db')
    with pytest.raises(ValueError, match='damaged'):
        dataset_import({'name': '损坏包', 'archive_path': str(archive_path),
            'image_dir': 'images', 'annotation_dir': 'labels'}, db_path)
    assert dataset_list({}, db_path)['datasets'] == []
    assert not any(path.is_dir() for path in (tmp_path / 'datasets').iterdir())
