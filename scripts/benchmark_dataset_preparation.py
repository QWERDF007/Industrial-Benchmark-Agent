import argparse
import json
import os
import tempfile
import time
from pathlib import Path
from uuid import uuid4

os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['OMP_NUM_THREADS'] = '8'

from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
from iad_core.consistency.agent_preparation import ConsistencyAgentPreparation
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.duplicate.index import PixelIndex
from iad_core.duplicate.preparation import PixelPreparation
from iad_core.entry import dataset_import
from iad_core.feature.profiles import ImageEncoderConfig, ImageEncoderEdit, ImageEncoders
from iad_core.storage.database import Database
from iad_core.workbench.runtime import WorkbenchRuntime


SOURCES = {
    '11_13': ('/data1/wt/data/领益640-657尺寸外观检测/11_13',
        'ExportImage_ALL_data', 'ExportLabel_ALL_data', 1133, 1575),
    'Train': ('/data1/wt/data/框胶数据集',
        'ExportImage_框胶10x连线蓝色背面厚_0904-Train',
        'ExportLabel_框胶10x连线蓝色背面厚_0904-Train', 4508, 6042),
}


def prepare(runtime: WorkbenchRuntime, dataset_id: str, name: str, phase: str, mode: str):
    checks = ConsistencyAgentJobs(runtime)
    started = time.perf_counter()
    run_id = checks.start({'submission_id': str(uuid4()), 'dataset_ids': [dataset_id], 'mode': mode})['run_id']
    preparation = ConsistencyAgentPreparation(runtime)
    marker = -1
    while True:
        batch = preparation.prepare(run_id)
        if batch.completed // 500 != marker:
            marker = batch.completed // 500
            print(json.dumps({'dataset': name, 'phase': phase, 'completed': batch.completed,
                'total': batch.total, 'elapsed_s': round(time.perf_counter() - started, 3)}), flush=True)
        if batch.status not in ('PENDING', 'RUNNING'):
            break
        for child in batch.children:
            if child.status in ('PENDING', 'RUNNING'):
                runtime.jobs.wait(child.run_id, 1)
    assert batch.status == 'COMPLETED', batch.model_dump(mode='json')
    assert batch.completed == batch.total
    elapsed = time.perf_counter() - started
    checks.cancel(run_id)
    return elapsed


def run(name: str, encoder: ImageEncoderConfig | None):
    root, images, labels, image_count, annotation_count = SOURCES[name]
    with tempfile.TemporaryDirectory(prefix='iad-preparation-benchmark-') as directory:
        db_path = str(Path(directory) / 'benchmark.db')
        imported = dataset_import({'format': 'labelme', 'name': name,
            'image_dir': str(Path(root) / images), 'annotation_dir': str(Path(root) / labels)}, db_path)
        assert imported['total_samples'] == image_count
        assert imported['annotation_count'] == annotation_count
        if encoder:
            ImageEncoders(Database(db_path)).save(ImageEncoderEdit(expected_revision=0, selection=encoder))
        mode = 'combined' if encoder else 'exact'
        runtime = WorkbenchRuntime(Database(db_path))
        try:
            first = prepare(runtime, imported['dataset_id'], name, 'first_preparation', mode)
        finally:
            runtime.close()
        runtime = WorkbenchRuntime(Database(db_path))
        try:
            reused = prepare(runtime, imported['dataset_id'], name, 'cached_preparation', mode)
            source_ids = [sample.sample_id for sample in ConsistencyScopes(runtime.db).resolve(
                {'kind': 'datasets', 'dataset_ids': [imported['dataset_id']]}).samples]
            summary = PixelIndex(runtime.db).prepare(source_ids)
            assert summary.reused_samples == image_count and summary.decoded_images == 0
            print(json.dumps({'dataset': name, 'images': image_count, 'annotations': annotation_count,
                'first_preparation_s': round(first, 3), 'cached_preparation_s': round(reused, 3),
                'cached_images': summary.reused_samples, 'decoded_on_reuse': summary.decoded_images,
                'mode': mode, 'encoder': encoder.profile.profile_id if encoder else None,
                'cache_condition': 'existing OS cache'}), flush=True)
        finally:
            runtime.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--dataset', choices=[*SOURCES, 'all'], default='all')
    parser.add_argument('--encoder-config', type=Path)
    args = parser.parse_args()
    selected = args.dataset
    encoder = ImageEncoderConfig.model_validate_json(args.encoder_config.read_text()) if args.encoder_config else None
    try:
        for source in SOURCES if selected == 'all' else [selected]:
            run(source, encoder)
    finally:
        PixelPreparation.close()
