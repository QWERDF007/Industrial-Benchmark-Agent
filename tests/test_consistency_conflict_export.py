import zipfile
from uuid import uuid4

import pytest
from PIL import Image

from iad_core.consistency.conflict_export import ConsistencyConflictExport
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_preparation import ConsistencyAgentPreparation
from iad_core.consistency.agent_review import ConsistencyAgentReview
from iad_core.dataset.registry import DatasetRegistry
from iad_core.dataset.folder_preview import preview_folder_dataset
from tests.test_consistency_agent_preparation import wait_for_preparation


def test_export_only_problems_includes_originals_and_absolute_paths(native_audit, tmp_path):
    jobs, _, _, _ = native_audit
    root = tmp_path/'pairs'
    rules = [dict(path='ok', role='normal'), dict(path='ng', role='anomaly')]
    for folder in ('ok', 'ng'):
        (root/folder).mkdir(parents=True)
        Image.new('RGB', (32, 32), 'red').save(root/folder/'same.png')
    from iad_core.task.config import FolderRule
    preview = preview_folder_dataset(str(root), rules=[FolderRule(**r) for r in rules])
    config = DatasetRegistry(jobs.db).import_dataset(dict(format='folder_classification', name='配对集',
        root_dir=str(root), rules=rules, preview_fingerprint=preview.preview_fingerprint))
    checks = ConsistencyAgentJobs(jobs.runtime)
    run_id = checks.start(dict(submission_id=str(uuid4()), dataset_ids=[config.dataset.id], mode='exact'))['run_id']
    wait_for_preparation(ConsistencyAgentPreparation(jobs.runtime), run_id)
    review = ConsistencyAgentReview(jobs.runtime)
    for anchor in checks.anchors(run_id):
        checks.session_created(run_id, anchor.anchor_id)
        checks.retrieve(run_id, anchor.anchor_id)
        review.verify(run_id, anchor.anchor_id)
        review.finish_rules(run_id, anchor.anchor_id)
    checks.finish(run_id)
    result = ConsistencyConflictExport(jobs.db).build(run_id)
    with zipfile.ZipFile(result['path']) as archive:
        names = archive.namelist()
        markdown = [n for n in names if n.endswith('.md')]
        assert len(markdown) == 2
        assert all(n.startswith('类别不一致/配对集/') for n in markdown)
        assert len([n for n in names if n.endswith('.png')]) == 2
        text = archive.read(markdown[0]).decode()
        assert str(root/'ok'/'same.png') in text and str(root/'ng'/'same.png') in text
        assert all(n.split('/')[0] not in ('无候选','无有效候选','一致') for n in names)
    Image.new('RGB', (32, 32), 'blue').save(root/'ok'/'same.png')
    with pytest.raises(ValueError, match='变化'):
        ConsistencyConflictExport(jobs.db).build(run_id)
