import json
import sys
from pathlib import Path
from uuid import uuid4

from PIL import Image

from iad_core.audit.jobs import AuditAgentJobs
from iad_core.audit.reports import AuditReports
from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.gallery import GalleryQueries, GalleryQuery
from iad_core.consistency.result_models import ConsistencyQuery
from iad_core.consistency.result_queries import ResultQueries
from iad_core.consistency.service import ConsistencyService
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.storage.database import Database
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.workbench.runtime import WorkbenchRuntime


root = Path(sys.argv[1])
runtime = WorkbenchRuntime(Database(str(root / 'charts.db')))
registry = DatasetRegistry(runtime.db)
ids = []
try:
    for subset in range(2):
        directory = root / f'subset-{subset}'
        directory.mkdir()
        for index in range(4 if subset == 0 else 2):
            width, height = 160 + 32 * index, 120 + 16 * index
            image = Image.new('RGB', (width, height), (40 + subset * 60, 70 + index * 25, 130))
            image.save(directory / f'part-{index}.png')
            labels = [('edge', 20 + index * 4, 10 + index * 2)] if index < 2 else []
            if subset == 0 and index == 0:
                labels.extend([('edge', 40, 20), ('hole', 12, 16)])
            if subset == 0 and index == 2:
                labels = [('hole', 18, 24)]
            (directory / f'part-{index}.json').write_text(json.dumps(dict(imageWidth=width, imageHeight=height,
                shapes=[dict(shape_type='rectangle', label=label, points=[[10, 12], [10 + w, 12 + h]]) for label, w, h in labels])))
        config = registry.import_labelme(DatasetImport(format='labelme', name=f'分布样本 {subset + 1}',
            image_dir=str(directory), annotation_dir=str(directory)))
        ids.append(config.dataset.id)
    checks = ConsistencyAgentJobs(runtime)
    upstream = checks.start(dict(submission_id=str(uuid4()), dataset_ids=ids, mode='exact'))['run_id']
    for anchor in checks.anchors(upstream):
        checks.session_created(upstream, anchor.anchor_id)
        assert not checks.retrieve(upstream, anchor.anchor_id).candidates
        checks.submit_empty(upstream, anchor.anchor_id)
    checks.finish(upstream)
    ModuleSettings(runtime.db).save(dict(module='audit', expected_revision=0,
        settings=dict(model=dict(provider_id='fixture', model_id='charts'))))
    role = dict(profile=dict(provider_id='fixture', model_id='charts', endpoint='http://127.0.0.1:9/v1/chat/completions',
        context_tokens=65536, max_output_tokens=4096), native_profile=dict(api='openai-completions', baseURL='http://127.0.0.1:9/v1'), input_modalities=['text', 'image'])
    jobs = AuditAgentJobs(runtime)
    run_id = jobs.start(dict(submission_id=str(uuid4()), subset_ids=ids, consistency_job_id=upstream), agent=role)['run_id']
    jobs.cancel(run_id)
    AuditReports(runtime.db).finalize(run_id)

    directory = root / 'comparison'
    directory.mkdir()
    Image.open(root / 'subset-0' / 'part-0.png').save(directory / 'reference.png')
    (directory / 'reference.json').write_text(json.dumps(dict(imageWidth=160, imageHeight=120,
        shapes=[dict(shape_type='rectangle', label='different', points=[[10, 12], [30, 22]])])))
    reference = registry.import_labelme(DatasetImport(format='labelme', name='对照样本', image_dir=str(directory), annotation_dir=str(directory)))
    ConsistencyService(runtime.db).compare(ConsistencyCompare(sample_a=ids[0] + ':part-0.png', sample_b=reference.dataset.id + ':reference.png'))
    query = ResultQueries(runtime.db).query(ConsistencyQuery(selection={'kind': 'scope', 'subjects': {'kind': 'all_registered'}}))
    statistics = GalleryQueries(runtime.db).query(GalleryQuery(query_id=query.query_id, kind='conflicts')).statistics
    print(json.dumps(dict(run_id=run_id, dataset_ids=ids, query_id=query.query_id, statistics=statistics.model_dump(mode='json'))))
finally:
    runtime.close()
