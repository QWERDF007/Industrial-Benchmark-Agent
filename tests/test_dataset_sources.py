import shutil
from pathlib import Path
from uuid import uuid4

import pytest
from PIL import Image

from iad_core.entry import dataset_get, dataset_scan, knowledge_evidence, knowledge_get, sample_get
from iad_core.workbench.review import HumanReview, ReviewSubmission
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.vision import VlmClient


def test_explicit_directory_change_rescans_atomically_and_preserves_history(dataset, mllm_api, tmp_path):
    db, registry, config = dataset
    external, _, _ = mllm_api
    runtime = WorkbenchRuntime(db, VlmClient(external))
    target = config.dataset.id + ':dent.png'
    try:
        first = runtime.audit.start(dataset_id=config.dataset.id, sample_ids=[target])
        runtime.audit.wait(first['run_id'], 5)
        assert runtime.audit.status(first['run_id'])['status'] == 'COMPLETED'
        HumanReview(db).submit(ReviewSubmission(submission_id=str(uuid4()), dataset_id=config.dataset.id,
            sample_id=target, reviewer='operator', decision='FAIL', comment='已核实'))
        before = sample_get({'sample_id': target}, db.db_path)
        normal = knowledge_get({'dataset_id': config.dataset.id, 'kind': 'normal'}, db.db_path)['knowledge']
        evidence = knowledge_evidence({'version_id': normal['version_id'],
            'evidence_id': normal['evidence'][0]['image']['evidence_id']}, db.db_path)
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
        assert after['suggestion'] == before['suggestion']
        assert knowledge_get({'version_id': normal['version_id']}, db.db_path)['knowledge'] == normal
        assert Path(evidence['path']).read_bytes() == original_bytes
        with pytest.raises((ValueError, FileNotFoundError)):
            dataset_scan({'dataset_id': config.dataset.id, 'image_dir': str(tmp_path / 'missing'),
                'annotation_dir': str(labels)}, db.db_path)
        assert dataset_get({'dataset_id': config.dataset.id}, db.db_path)['image_dir'] == str(images)
        assert sample_get({'sample_id': target}, db.db_path) == after
    finally:
        runtime.close()
