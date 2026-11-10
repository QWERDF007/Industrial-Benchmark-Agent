import shutil
from pathlib import Path
from uuid import uuid4

import pytest
from PIL import Image

from iad_core.entry import dataset_get, dataset_scan, knowledge_evidence, knowledge_get, sample_get
from iad_core.workbench.review import HumanReview, ReviewSubmission


def test_explicit_directory_change_rescans_atomically_and_preserves_history(dataset, native_knowledge_versions, tmp_path):
    db, _, config = dataset
    target = config.dataset.id + ':dent.png'
    HumanReview(db).submit(ReviewSubmission(submission_id=str(uuid4()), dataset_id=config.dataset.id,
        sample_id=target, reviewer='operator', decision='FAIL', comment='已核实'))
    before = sample_get({'sample_id': target}, db.db_path)
    version_id = native_knowledge_versions[2][0].version_id
    publication = knowledge_get({'version_id':version_id}, db.db_path)
    evidence = knowledge_evidence({'version_id': publication['version_id'],
        'evidence_id': publication['evidence'][0]['image']['evidence_id']}, db.db_path)
    original_bytes = Path(evidence['path']).read_bytes()
    images, labels = tmp_path / 'moved-images', tmp_path / 'moved-labels'
    shutil.copytree(config.root, images)
    shutil.copytree(config.annotations.root, labels)
    Image.new('RGB', (320, 240), 'red').save(images / 'dent.png')
    result = dataset_scan({'dataset_id': config.dataset.id, 'image_dir': str(images),
        'annotation_dir': str(labels)}, db.db_path)
    assert result['image_count'] == 4
    current = dataset_get({'dataset_id': config.dataset.id}, db.db_path)
    assert current['image_dir'] == str(images)
    assert current['annotation_dir'] == str(labels)
    after = sample_get({'sample_id': target}, db.db_path)
    assert after['sample']['sample_uuid'] == before['sample']['sample_uuid']
    assert after['sample']['image_path'] == str(images / 'dent.png')
    assert after['review_history'] == before['review_history']
    assert knowledge_get({'version_id':publication['version_id']}, db.db_path) == publication
    assert Path(evidence['path']).read_bytes() == original_bytes
    with pytest.raises((ValueError, FileNotFoundError)):
        dataset_scan({'dataset_id': config.dataset.id, 'image_dir': str(tmp_path / 'missing'),
            'annotation_dir': str(labels)}, db.db_path)
    assert dataset_get({'dataset_id': config.dataset.id}, db.db_path)['image_dir'] == str(images)
    assert sample_get({'sample_id': target}, db.db_path) == after
