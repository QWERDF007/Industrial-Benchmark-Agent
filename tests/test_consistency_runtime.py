import os
from pathlib import Path
import subprocess
import sys

import pytest


def test_knowledge_and_direction_queries_run_without_model_services(dataset):
    import json
    from iad_core.evidence.images import EvidenceImages
    from iad_core.knowledge.models import KnowledgeEvidence
    from iad_core.knowledge.trace import KnowledgeTrace
    from iad_core.storage.repositories import SampleRepository
    from iad_core.workbench.jobs import JobRunner

    db, _, config = dataset
    sample = SampleRepository(db).get(config.dataset.id + ':normal.png')
    image = EvidenceImages(db.db_path).capture(sample, 'normal', 'reference')
    jobs = JobRunner(db, ('NORMAL_KNOWLEDGE',))
    try:
        def prepare(context):
            KnowledgeTrace(context).register([KnowledgeEvidence(sample_id=sample.sample_id, image=image.evidence)])
            context.record(sample.sample_id)

        job = jobs.start('NORMAL_KNOWLEDGE', config.task.task_id,
            dict(dataset_id=config.dataset.id, sample_ids=[sample.sample_id]), prepare, '准备真实图像证据')
        jobs.wait(job['run_id'], 5)
    finally:
        jobs.close()
    requests = [
        ('knowledge_presets', {}),
        ('knowledge_prompt_get', {'dataset_id': config.dataset.id, 'kind': 'normal'}),
        ('knowledge_versions', {'dataset_id': config.dataset.id}),
        ('knowledge_sources', {'dataset_id': config.dataset.id, 'kind': 'normal'}),
        ('direction_exploration_get', {'dataset_id': config.dataset.id}),
        ('direction_exploration_presets', {}),
        ('knowledge_observations', {'run_id': job['run_id']}),
        ('knowledge_evidence', {'run_id': job['run_id'], 'evidence_id': image.evidence.evidence_id}),
    ]
    code = '''
import json,sys
from iad_core.entry import dispatch_request
for operation,arguments in json.loads(sys.argv[2]):
    dispatch_request(dict(operation=operation,arguments=arguments),sys.argv[1],query_only=True)
assert not any(name in sys.modules for name in ['torch','faiss'])
'''
    result = subprocess.run([sys.executable, '-c', code, db.db_path, json.dumps(requests)],
        env={**os.environ, 'PYTHONPATH': str(Path(__file__).resolve().parents[1] / 'python'),
             'CUDA_VISIBLE_DEVICES': '', 'LIVE_VLM_REQUEST_PARAMETERS': 'not-valid-json'},
        capture_output=True, text=True, timeout=20)
    assert result.returncode == 0, result.stderr
    responses = [json.loads(line) for line in result.stdout.splitlines()]
    assert len(responses) == len(requests)
    assert all(response['event'] == 'result' for response in responses), responses
    assert responses[-2]['data']['total'] == 1
    assert responses[-1]['data']['path'] == image.path


def test_cpu_readiness_tools_do_not_load_optional_encoders(tmp_path):
    code = '''
import sys
from iad_core.tools import execute_internal_tool
for name, arguments in [
    ('task_inspect', {'task_id':'missing'}),
    ('evaluation_plan', {'task_id':'missing','build_id':'missing'}),
    ('feature_prepare', {'task_id':'missing'}),
]:
    result=execute_internal_tool(name, arguments, db_path=sys.argv[1])
    assert result['status']=='NOT_READY', result
assert not any(name in sys.modules for name in ['torch','faiss','iad_core.workbench.vision'])
'''
    result = subprocess.run([sys.executable, '-c', code, str(tmp_path / 'tools.db')],
        env={**os.environ, 'PYTHONPATH': str(Path(__file__).resolve().parents[1] / 'python'),
            'CUDA_VISIBLE_DEVICES': '', 'LIVE_VLM_REQUEST_PARAMETERS': 'not-valid-json'},
        capture_output=True, text=True, timeout=30)
    assert result.returncode == 0, result.stderr


def test_cpu_runtime_and_exact_pixels_do_not_construct_or_import_model_services(tmp_path):
    code = '''
import sys
from pathlib import Path
from PIL import Image
from iad_core.storage.database import Database
from iad_core.workbench.runtime import WorkbenchRuntime
from iad_core.duplicate.pixels import PixelContent
root=Path(sys.argv[1]); image=root/'source.png'
Image.new('RGBA',(17,19),(1,2,3,255)).save(image)
runtime=WorkbenchRuntime(Database(str(root/'cpu.db')))
try:
    result=PixelContent.read(image).compare(PixelContent.read(image))
    assert result.exact_equal and result.compared_pixels==323
    assert not any(name in sys.modules for name in ['torch','faiss','iad_core.workbench.vision'])
finally:runtime.close()
'''
    result = subprocess.run([sys.executable, '-c', code, str(tmp_path)],
        env={**os.environ, 'PYTHONPATH': str(Path(__file__).resolve().parents[1] / 'python'),
            'CUDA_VISIBLE_DEVICES': '', 'LIVE_VLM_REQUEST_PARAMETERS': 'not-valid-json'},
        capture_output=True, text=True, timeout=20)
    assert result.returncode == 0, result.stderr


@pytest.mark.parametrize('kind', ['IMAGE_INDEX', 'DATA_CONSISTENCY'])
def test_non_mllm_jobs_use_the_existing_runner_and_have_no_chat_model(dataset, kind):
    from iad_core.workbench.runtime import WorkbenchRuntime

    db, _, config = dataset
    runtime = WorkbenchRuntime(db)
    sample_id = config.dataset.id + ':normal.png'
    try:
        def execute(context):
            context.checkpoint()
            context.record(sample_id)

        started = runtime.jobs.start(kind, config.task.task_id,
            {'dataset_id': config.dataset.id, 'sample_ids': [sample_id]}, execute, 'CPU domain job')
        runtime.jobs.wait(started['run_id'], 5)
        completed = runtime.jobs.status(started['run_id'])
        assert completed['status'] == 'COMPLETED'
        assert completed['model_name'] is None
        assert completed['model_profile'] is None
        assert completed['completed'] + completed['failed'] + completed['unprocessed'] == 1
        assert completed['model_calls'] == []
    finally:
        runtime.close()
