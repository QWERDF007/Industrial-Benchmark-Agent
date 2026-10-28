import json
import time
from contextlib import closing
from dataclasses import asdict
from pathlib import Path

from PIL import Image

from iad_core.dataset.registry import DatasetRegistry
from iad_core.evaluation.resource_cancellation import probe_encoder_cancellation
from iad_core.evaluation.resource_workload import materialize_resource_image
from iad_core.feature.base import FeatureExtractor
from iad_core.feature.cache import ContentFeatureCache
from iad_core.feature.encoder import ImageEncoderRuntime
from iad_core.evaluation.resource_models import IncrementalChecks
from iad_core.feature.profiles import ImageEncoderConfig
from iad_core.storage.database import Database
from iad_core.storage.features import FeatureRepository
from iad_core.storage.repositories import SampleRepository


def evaluate_resource_incremental(prepared: dict, output: Path, *, count: int = 100,
                                  extractor: FeatureExtractor | None = None) -> dict:
    output = Path(output)
    if count < 1 or (output / 'incremental.json').exists():
        raise ValueError('Incremental measurements require a positive count and a fresh result')
    config = ImageEncoderConfig.model_validate(prepared['config'])
    db = Database(prepared['initial_db'])
    registry, samples = DatasetRegistry(db), SampleRepository(db)
    original_ids = prepared['sample_ids']['main']
    original = samples.get(original_ids[0])
    root = Path(original.image_path).parent
    if any((root / f'incremental-{position:05}.jpg').exists() for position in range(count)):
        raise ValueError('Incremental image paths already exist')
    for position in range(count):
        carrier = samples.get(original_ids[position % len(original_ids)])
        with Image.open(carrier.image_path) as opened:
            image = opened.convert('RGB')
        materialize_resource_image(image, root / f'incremental-{position:05}.jpg', 100000 + position, (100000 + count).bit_length())
        image.close()
    registry.rescan(original.dataset_id)
    current = samples.list_by_task(original.task_id)
    new = [sample.sample_id for sample in current if sample.sample_id not in set(original_ids)]
    if len(new) != count:
        raise ValueError('Incremental scan did not discover the requested new originals')
    subjects = [sample.sample_id for sample in current] + prepared['sample_ids']['stress']
    before_attempt = FeatureRepository(db).get_for_sample(original_ids[0], config.profile.profile_id)['attempt_count']
    with closing(ImageEncoderRuntime()) as runtime:
        cancellation = None
        if extractor is None:
            warm_config = config.model_copy(update={'batch_size': 1, 'decode_workers': 1})
            with Image.new('RGB', (config.profile.input_size, config.profile.input_size), (127, 127, 127)) as warm_image:
                runtime.encode(warm_config, [warm_image])
            if config.device.startswith('cuda:'):
                cancellation = probe_encoder_cancellation(db, new, config, runtime)
        started = time.perf_counter()
        incremental = ContentFeatureCache(db, runtime).prepare(subjects, config, extractor=extractor)
        incremental_seconds = time.perf_counter() - started
        if incremental.encoded_content_count != count:
            raise ValueError('Incremental preparation did not encode exactly the newly added contents')
        path = Path(original.image_path).with_suffix('.json')
        if path.exists():
            raise ValueError('Annotation-only probe will not overwrite an existing annotation')
        path.write_text(json.dumps({'imageWidth': original.width, 'imageHeight': original.height,
            'shapes': [{'label': 'resource-probe', 'shape_type': 'rectangle', 'points': [[1, 1], [4, 4]]}]}))
        registry.rescan(original.dataset_id)
        annotation_only = ContentFeatureCache(db, runtime).prepare(subjects, config, extractor=extractor)
        after_attempt = FeatureRepository(db).get_for_sample(original_ids[0], config.profile.profile_id)['attempt_count']
        stats = runtime.stats()
        gates = IncrementalChecks.model_validate({'one_hundred_new_contents': count == 100 and incremental.encoded_content_count == 100,
            'old_vectors_not_reencoded': incremental.cache_hit_count == len(prepared['workload']['items']) and before_attempt == after_attempt,
            'annotation_only_zero_encoding': annotation_only.encoded_content_count == annotation_only.encoded_pixels == 0,
            'same_model_reused_across_resource_changes': extractor is None and stats.instances_created == 1,
            'real_cancel_observed': cancellation is not None and cancellation['observed_device_forward']
                and cancellation['encoder_calls_after_cancel_request'] == 1 and cancellation['failed_new_contents'] == 0})
        result = {'profile_id': config.profile.profile_id, 'new_contents': len(new),
            'incremental': incremental.model_dump(mode='json'), 'incremental_seconds': incremental_seconds,
            'annotation_only': annotation_only.model_dump(mode='json'), 'cancellation': cancellation,
            'runtime_stats': asdict(stats), 'gates': gates.model_dump(), 'incremental_checks_passed': gates.passed}
    (output / 'incremental.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
    return result
