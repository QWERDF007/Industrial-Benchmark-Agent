import json
import sys
from pathlib import Path
from uuid import uuid4

from PIL import Image

from iad_core.analysis.jobs import AnalysisAgentJobs
from iad_core.audit.jobs import AuditAgentJobs
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.knowledge.instructions import default_directions
from iad_core.storage.database import Database
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.workbench.runtime import WorkbenchRuntime

root = Path(sys.argv[1])
images = root / 'images'
images.mkdir()
Image.new('RGB', (80, 60), 'blue').save(images / 'part.png')
db = Database(sys.argv[2])
registry = DatasetRegistry(db)
config = registry.import_labelme(DatasetImport(format='labelme', name='布局子集', image_dir=str(images), annotation_dir=str(images)))
registry.save(config, group_id=registry.create_group('布局数据集')['group_id'])
role = dict(profile=dict(provider_id='fixture', model_id='layout', endpoint='http://127.0.0.1:1/v1/chat/completions',
    context_tokens=65536, max_output_tokens=4096), native_profile=dict(api='openai-completions', baseURL='http://127.0.0.1:1/v1'), input_modalities=['text', 'image'])
for module in ['exploration', 'knowledge', 'audit']:
    ModuleSettings(db).save(dict(module=module, expected_revision=0, settings=dict(model=dict(provider_id='fixture', model_id='layout'))))
runtime = WorkbenchRuntime(db)
try:
    analysis, consistency, audit = AnalysisAgentJobs(runtime), ConsistencyAgentJobs(runtime), AuditAgentJobs(runtime)
    for index in range(10):
        for module in ['exploration', 'knowledge']:
            request = dict(submission_id=str(uuid4()), analysis_kind=module, dataset_ids=[config.dataset.id])
            if module == 'exploration':
                request.update(normal_images=[config.dataset.id + ':part.png'], prompt=dict(text='检查边缘。'))
            else:
                request['mining_prompt'] = dict(objective='检查边缘' + str(index), instruction='检查边缘。', directions=[default_directions()[0].model_dump(mode='json')])
            analysis.cancel(analysis.start(request, agent=role)['run_id'])
        upstream = consistency.start(dict(submission_id=str(uuid4()), dataset_ids=[config.dataset.id], mode='exact'))
        for anchor in consistency.anchors(upstream['run_id']):
            consistency.session_created(upstream['run_id'], anchor.anchor_id)
            assert consistency.retrieve(upstream['run_id'], anchor.anchor_id).candidates == []
            consistency.submit_empty(upstream['run_id'], anchor.anchor_id)
        runtime.jobs.finish_external(upstream['run_id'])
        audit.cancel(audit.start(dict(submission_id=str(uuid4()), subset_ids=[config.dataset.id], consistency_job_id=upstream['run_id']), agent=role)['run_id'])
    consistency.cancel(consistency.start(dict(submission_id=str(uuid4()), dataset_ids=[config.dataset.id], mode='exact'))['run_id'])
    print(json.dumps(dict(dataset_id=config.dataset.id)))
finally:
    runtime.close()
