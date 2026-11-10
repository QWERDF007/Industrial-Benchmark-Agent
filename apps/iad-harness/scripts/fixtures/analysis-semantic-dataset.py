"""Copy frozen real registrations into an isolated, reorderable comparison scope."""

import hashlib
import json
import shutil
import sqlite3
import sys
from pathlib import Path

from iad_core.dataset.folder_preview import preview_folder_dataset
from iad_core.dataset.registry import DatasetRegistry
from iad_core.consistency.policy import AnnotationPolicy
from iad_core.evidence.images import file_sha256, image_pixel_sha256
from iad_core.knowledge.instructions import default_directions
from iad_core.storage.database import Database
from iad_core.task.config import FolderRule
from iad_core.workbench.analysis_manifest import AnalysisManifests


source_db, run_id, root = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
root.mkdir()
with sqlite3.connect(f'file:{source_db}?mode=ro',uri=True) as source:
    snapshot = json.loads(source.execute('SELECT snapshot_json FROM analysis_workflow_runs WHERE job_id=?', (run_id,)).fetchone()[0])
    config = json.loads(source.execute('SELECT config_json FROM datasets WHERE dataset_id=?',
        (snapshot['manifest']['dataset_ids'][0],)).fetchone()[0])
records = snapshot['manifest']['records']
selected = [target['sample_id'] for target in snapshot['plan']['rounds'][0]['targets']]
roles = {target['sample_id']:target['candidate_role'] for target in snapshot['plan']['rounds'][0]['targets']}
first = [next(record for record in records if record['sample']['sample_id'] == identity) for identity in selected]
assert len(first) == 2 and set(roles.values()) == {'normal','defect'}
batches = [first,[],[]]
seen = {image_pixel_sha256(record['sample']['image_path'],file_sha256(record['sample']['image_path'])) for record in first}
folder = first[0]['dataset_format'] == 'folder_classification'
for group in ['normal','abnormal'] if folder else [False,True]:
    candidates = [record for record in records if (
        record['sampling_group'] == group and Path(record['sample']['relative_path']).parts[0].startswith('公头')
        if folder else bool(record['annotations']) == group)]
    added = 0
    for record in candidates:
        filename = record['sample']['image_path']
        pixel_hash = image_pixel_sha256(filename,file_sha256(filename))
        if pixel_hash in seen:
            continue
        seen.add(pixel_hash)
        batches[added+1].append(record)
        added += 1
        if added == 2:
            break
    assert added == 2, '对照需要另外两组不同像素的良品与异常原图'
database = root/'seed.db'
db = Database(str(database))
registry = DatasetRegistry(db)
dataset_ids, provenance = [], []
for index,batch in enumerate(batches):
    images, labels = root/f'images-{index}', root/f'labels-{index}'
    images.mkdir();labels.mkdir()
    copied = []
    for record in batch:
        sample = record['sample']
        relative = sample['relative_path']
        target = images/relative
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(sample['image_path'],target)
        item = dict(source_sample_id=sample['sample_id'],relative_path=relative,
            file_sha256=file_sha256(target),pixel_sha256=image_pixel_sha256(target,file_sha256(target)),
            sampling_group=record['sampling_group'],candidate_role=roles.get(sample['sample_id']),source_annotations=record['annotations'])
        if record['dataset_format'] == 'labelme':
            annotation = Path(config['annotations']['root'])/Path(relative).with_suffix('.json')
            if annotation.is_file():
                destination = labels/Path(relative).with_suffix('.json')
                destination.parent.mkdir(parents=True,exist_ok=True)
                shutil.copy2(annotation,destination)
                item['annotation_sha256'] = hashlib.sha256(destination.read_bytes()).hexdigest()
        copied.append(item)
    if batch[0]['dataset_format'] == 'folder_classification':
        rules = [FolderRule(path=str(Path(record['sample']['relative_path']).parent),
            role='normal' if record['sampling_group'] == 'normal' else 'anomaly') for record in batch]
        preview = preview_folder_dataset(str(images),rules)
        request = dict(format='folder_classification',name=f'语义对照{index+1}',root_dir=str(images),
            rules=[rule.model_dump() for rule in rules],preview_fingerprint=preview.preview_fingerprint)
    else:
        request = dict(format='labelme',name=f'语义对照{index+1}',image_dir=str(images),annotation_dir=str(labels),
            unannotated_is_normal=config['dataset']['unannotated_is_normal'],
            annotation_policy={key:config['annotations'][key] for key in AnnotationPolicy.model_fields})
    imported = registry.import_dataset(request)
    dataset_ids.append(imported.dataset.id)
    imported_records = {record.sample.relative_path:record for record in AnalysisManifests(db).freeze([imported.dataset.id]).records}
    for item in copied:
        actual = imported_records[item['relative_path']]
        item['sample_id'] = actual.sample.sample_id
        assert actual.sampling_group == item['sampling_group'], '导入不得改变原图的图级身份'
        original = [{key:value for key,value in row.items() if key not in {'annotation_id','sample_id','task_id'}}
            for row in item['source_annotations']]
        received = [{key:value for key,value in row.model_dump(mode='json').items() if key not in {'annotation_id','sample_id','task_id'}}
            for row in actual.annotations]
        assert original == received, '导入不得改变人工区域或类别'
        provenance.append(item)
plans = {}
for module in ['exploration','knowledge']:
    plans[module] = {}
    for order,scope in [('forward',dataset_ids),('reverse',[dataset_ids[0],dataset_ids[2],dataset_ids[1]])]:
        manifest = AnalysisManifests(db).freeze(scope)
        plan = manifest.plan(module,batch_size=2,
            normal_images=[item['sample_id'] for item in provenance[:2] if item['candidate_role'] == 'normal'] if module == 'exploration' else [],
            defect_images=[item['sample_id'] for item in provenance[:2] if item['candidate_role'] == 'defect'] if module == 'exploration' else [])
        plans[module][order] = plan.model_dump(mode='json')
    forward,reverse = ([round['targets'] for round in plans[module][order]['rounds']] for order in ['forward','reverse'])
    assert forward[0] == reverse[0] and forward[1] == reverse[2] and forward[2] == reverse[1]
result = dict(database=str(database),dataset_ids=dataset_ids,source_run_id=run_id,source_images=provenance,plans=plans,
    first_images=[item['sample_id'] for item in provenance[:2]],native_profile=snapshot['agent']['native_profile'],
    direction=default_directions()[0].model_dump(mode='json'))
(root/'inputs.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False))
