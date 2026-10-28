import hashlib
import json
import resource
import sqlite3
import threading
import time
from contextlib import closing
from pathlib import Path
from typing import Callable

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.duplicate.index import PixelIndex
from iad_core.evaluation.resource_workload import ResourceWorkload
from iad_core.feature.base import FeatureExtractor
from iad_core.feature.cache import ContentFeatureCache
from iad_core.feature.profiles import ImageEncoderConfig
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.workbench.runtime import WorkbenchRuntime


def prepare_resource_index(workload: ResourceWorkload, config: ImageEncoderConfig, output: Path, *,
                           extractor: FeatureExtractor | None = None,
                           progress: Callable[[str, int, int], None] | None = None) -> dict:
    output = Path(output).resolve()
    output.mkdir(parents=True)
    started = time.perf_counter()
    for item in workload.items:
        if hashlib.sha256(item.path.read_bytes()).hexdigest() != item.sha256:
            raise ValueError('Resource input changed after materialization: ' + str(item.path))
    db = Database(str(output / 'initial.db'))
    registry = DatasetRegistry(db)
    datasets, identities = {}, {}
    for kind in ('main', 'stress'):
        declared = [item for item in workload.items if item.kind == kind]
        roots = {item.path.parent for item in declared}
        if len(roots) != 1:
            raise ValueError('Each resource partition requires one frozen image directory')
        root = roots.pop()
        dataset = registry.import_labelme(DatasetImport(format='labelme', name=kind, image_dir=str(root), annotation_dir=str(root)))
        samples = SampleRepository(db).list_by_task(dataset.task.task_id)
        if {sample.image_path for sample in samples} != {str(item.path) for item in declared}:
            raise ValueError('Resource dataset differs from the frozen workload')
        groups = {PixelIndex(db).get(sample.sample_id).content_group_id for sample in samples}
        if len(groups) != len(samples) or None in groups:
            raise ValueError('Resource originals must materialize distinct, decodable full-resolution contents')
        datasets[kind] = dataset.dataset.id
        identities[kind] = [sample.sample_id for sample in samples]
        if progress:
            progress('SCANNED_' + kind.upper(), len(samples), len(declared))
    scan_seconds = time.perf_counter() - started
    last_report, report_lock = [time.monotonic()], threading.Lock()

    def checkpoint():
        if progress:
            with report_lock:
                if time.monotonic() - last_report[0] >= 10:
                    with db.connection() as connection:
                        count = connection.execute("SELECT COUNT(*) FROM feature_records WHERE profile_id=? AND status='COMPLETE'", (config.profile.profile_id,)).fetchone()[0]
                    progress('ENCODING', count, len(workload.items))
                    last_report[0] = time.monotonic()

    with closing(WorkbenchRuntime(db)) as runtime:
        cache = ContentFeatureCache(db, runtime.images)
        subjects = [identity for members in identities.values() for identity in members]
        started = time.perf_counter()
        prepared = cache.prepare(subjects, config, extractor=extractor, checkpoint=checkpoint)
        encoding_seconds = time.perf_counter() - started
        if prepared.completed_samples != len(subjects):
            raise ValueError('Resource feature preparation was incomplete')
        repeated = cache.prepare(subjects, config, extractor=extractor)
        if repeated.encoded_content_count or repeated.encoded_pixels:
            raise ValueError('Unchanged resource inputs unexpectedly encoded again')
        with db.connection() as source, sqlite3.connect(str(output / 'baseline.db')) as baseline:
            source.backup(baseline)
        gpu = None
        if extractor is None and config.device.startswith('cuda:'):
            import torch
            gpu = {'peak_allocated_bytes': torch.cuda.max_memory_allocated(config.device),
                'peak_reserved_bytes': torch.cuda.max_memory_reserved(config.device),
                'name': torch.cuda.get_device_name(config.device), 'torch_version': torch.__version__}
        result = {'initial_db': db.db_path, 'baseline_db': str(output / 'baseline.db'), 'datasets': datasets,
            'sample_ids': identities, 'config': config.model_dump(mode='json'), 'workload': workload.model_dump(mode='json'),
            'encoder_kind': 'external_test_extractor' if extractor else 'real_weights',
            'prepared': prepared.model_dump(mode='json'), 'repeated': repeated.model_dump(mode='json'),
            'seconds': {'scan': scan_seconds, 'encoding': encoding_seconds, 'initial_total': scan_seconds + encoding_seconds},
            'throughput': {'encoded_images_per_second': prepared.encoded_content_count / encoding_seconds,
                'encoded_megapixels_per_second': prepared.encoded_pixels / encoding_seconds / 1_000_000},
            'resources': {'process_peak_rss_bytes_including_model': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024,
                'gpu': gpu, 'decode_workers': config.decode_workers, 'decode_memory_mb': config.decode_memory_mb}}
    (output / 'prepared.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
    return result
