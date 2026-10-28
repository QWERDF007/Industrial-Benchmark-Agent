import os
from pathlib import Path
import subprocess
import sys

import pytest


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
