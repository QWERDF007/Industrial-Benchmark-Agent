import threading
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict

from iad_core.feature.cache import ContentFeatureCache
from iad_core.feature.encoder import ImageEncoderRuntime
from iad_core.feature.profiles import ImageEncoderConfig
from iad_core.storage.database import Database
from iad_core.storage.features import FeatureRepository


def probe_encoder_cancellation(db: Database, sample_ids: list[str], config: ImageEncoderConfig,
                               runtime: ImageEncoderRuntime) -> dict:
    import torch
    entered, cancelled = threading.Event(), threading.Event()
    observed = {}

    def forward_observed(module, inputs, output):
        if not entered.is_set() and isinstance(output, torch.Tensor) and str(output.device) == config.device:
            observed['module'] = type(module).__name__
            entered.set()

    def checkpoint():
        if cancelled.is_set():
            raise InterruptedError('Resource probe cancelled an in-flight image encoder')

    before = runtime.stats()
    hook = torch.nn.modules.module.register_module_forward_hook(forward_observed)
    try:
        with ThreadPoolExecutor(max_workers=1) as worker:
            future = worker.submit(ContentFeatureCache(db, runtime).prepare, sample_ids, config, checkpoint=checkpoint)
            try:
                if not entered.wait(60):
                    raise RuntimeError('No real device forward operation was observed before cancellation')
                requested = time.perf_counter()
                cancelled.set()
                try:
                    future.result(timeout=60)
                except InterruptedError:
                    response_seconds = time.perf_counter() - requested
                else:
                    raise RuntimeError('The encoder did not acknowledge cancellation')
            finally:
                cancelled.set()
    finally:
        hook.remove()
    repository = FeatureRepository(db)
    groups = [row['content_group_id'] for row in repository.sources(sample_ids)]
    records = repository.records(groups, config.profile.profile_id)
    after = runtime.stats()
    return {'observed_device_forward': True, 'observed_module': observed['module'], 'response_seconds': response_seconds,
        'encoder_calls_after_cancel_request': after.encode_calls - before.encode_calls,
        'completed_new_contents': sum(row['status'] == 'COMPLETE' for row in records),
        'failed_new_contents': sum(row['status'] == 'FAILED' for row in records),
        'runtime_before': asdict(before), 'runtime_after': asdict(after)}
