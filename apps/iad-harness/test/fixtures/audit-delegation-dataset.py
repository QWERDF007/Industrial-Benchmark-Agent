import json
import sys
from pathlib import Path
from uuid import uuid4

from PIL import Image

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.dataset.folder_preview import preview_folder_dataset
from iad_core.task.config import FolderRule
from iad_core.storage.database import Database
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.workbench.runtime import WorkbenchRuntime

root = Path(sys.argv[1])
images = root/'images'
images.mkdir()
classification=len(sys.argv)>4 and sys.argv[4]=='folder_classification'
for index in range(int(sys.argv[3])):
    directory=images/('a_normal' if index<2 else 'b_anomaly') if classification else images
    directory.mkdir(exist_ok=True)
    Image.new('RGB',(40,30),(20+index,30,80)).save(directory/f'{index:03}.png')
    if not classification:
        (directory/f'{index:03}.json').write_text(json.dumps(dict(imageWidth=40,imageHeight=30,shapes=[
        dict(label='13',shape_type='rectangle',points=[[4,3],[11,12]]),
        dict(label='15',shape_type='rectangle',points=[[20,10],[35,25]])])))
db = Database(sys.argv[2])
if classification:
    rules=[FolderRule(path='a_normal',role='normal'),FolderRule(path='b_anomaly',role='anomaly')]
    preview=preview_folder_dataset(str(images),rules=rules)
    config=DatasetRegistry(db).import_dataset(dict(format='folder_classification',name='图像级联合审计',root_dir=str(images),
        rules=[rule.model_dump() for rule in rules],preview_fingerprint=preview.preview_fingerprint))
else:
    config = DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name='原图联合审计',
        image_dir=str(images),annotation_dir=str(images)))
runtime = WorkbenchRuntime(db)
try:
    checks=ConsistencyAgentJobs(runtime)
    upstream=checks.start(dict(submission_id=str(uuid4()),dataset_ids=[config.dataset.id],mode='exact'))
    for anchor in checks.anchors(upstream['run_id']):
        checks.session_created(upstream['run_id'],anchor.anchor_id)
        assert not checks.retrieve(upstream['run_id'],anchor.anchor_id).candidates
        checks.submit_empty(upstream['run_id'],anchor.anchor_id)
    runtime.jobs.finish_external(upstream['run_id'])
    ModuleSettings(db).save(dict(module='audit',expected_revision=0,
        settings=dict(model=dict(provider_id='fixture',model_id='native-audit'))))
    print(json.dumps(dict(dataset_id=config.dataset.id,consistency_job_id=upstream['run_id'])))
finally:
    runtime.close()
