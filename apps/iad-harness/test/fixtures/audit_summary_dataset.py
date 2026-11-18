import json
import sys
from pathlib import Path
from uuid import uuid4

from PIL import Image
from iad_core.storage.database import Database
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.dataset.registry import DatasetRegistry
from iad_core.dataset.folder_preview import preview_folder_dataset
from iad_core.task.config import FolderRule
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_preparation import ConsistencyAgentPreparation
from iad_core.consistency.agent_review import ConsistencyAgentReview

if __name__ == '__main__':
    root = Path(sys.argv[1]) / 'images'
    for name, color in [('normal', 'blue'), ('defect', 'blue'), ('uncompared', 'green')]:
        (root / name).mkdir(parents=True)
        Image.new('RGB', (40, 40), color).save(root / name / 'part.png')
    rules = [FolderRule(path=name, role='anomaly' if name == 'defect' else 'normal') for name in ('normal','defect','uncompared')]
    runtime = WorkbenchRuntime(Database(sys.argv[2]))
    try:
        preview = preview_folder_dataset(str(root), rules=rules)
        config = DatasetRegistry(runtime.db).import_dataset(dict(format='folder_classification', name='纯文本审计验收',
            root_dir=str(root), rules=[r.model_dump() for r in rules], preview_fingerprint=preview.preview_fingerprint))
        checks = ConsistencyAgentJobs(runtime)
        upstream = checks.start(dict(submission_id=str(uuid4()), dataset_ids=[config.dataset.id], mode='exact'))['run_id']
        preparation = ConsistencyAgentPreparation(runtime)
        batch = preparation.prepare(upstream)
        while batch.status in ('PENDING', 'RUNNING'):
            for child in batch.children:
                if child.status in ('PENDING', 'RUNNING'):
                    runtime.jobs.wait(child.run_id, 5)
            batch = preparation.prepare(upstream)
        review = ConsistencyAgentReview(runtime)
        for anchor in checks.anchors(upstream):
            checks.session_created(upstream, anchor.anchor_id)
            retrieved = checks.retrieve(upstream, anchor.anchor_id)
            if not retrieved.candidates:
                checks.submit_empty(upstream, anchor.anchor_id)
            else:
                review.verify(upstream, anchor.anchor_id)
                review.finish_rules(upstream, anchor.anchor_id)
        checks.finish(upstream)
        ModuleSettings(runtime.db).save(dict(module='audit', expected_revision=0, settings=dict(
            audit_scope='consistency', model=dict(provider_id='fixture', model_id='native-audit'))))
        print(json.dumps(dict(dataset_id=config.dataset.id, consistency_job_id=upstream)))
    finally:
        runtime.close()
