import json
import os
import resource
import sys
import time
import zipfile
from contextlib import closing
from pathlib import Path
from typing import Callable

import numpy as np

from iad_core.consistency.models import ImageRetrieve
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.feature.flat_index import cpu_library
from iad_core.evaluation.resource_models import ResourceChecks
from iad_core.feature.profiles import ImageEncoderConfig
from iad_core.storage.database import Database
from iad_core.storage.features import FeatureRepository
from iad_core.storage.repositories import SampleRepository
from iad_core.workbench.runtime import WorkbenchRuntime


def measure_resource_index(prepared: dict, output: Path, *, queries: int = 30, candidates: int = 20,
                           progress: Callable[[str, int, int], None] | None = None) -> dict:
    if queries < 1 or candidates < 1:
        raise ValueError('Resource measurements require positive query and candidate counts')
    output = Path(output)
    journal = output / 'verification-measurements.jsonl'
    if (output / 'resources.json').exists() or journal.exists():
        raise ValueError('Existing resource measurements are retained; choose a fresh run')
    config = ImageEncoderConfig.model_validate(prepared['config'])
    db = Database(prepared['baseline_db'])
    cpu_library()
    baseline_rss = int(Path('/proc/self/statm').read_text().split()[1]) * os.sysconf('SC_PAGE_SIZE')
    reports = {}
    with closing(WorkbenchRuntime(db)) as runtime:
        for kind in ('main', 'stress'):
            subjects = prepared['sample_ids'][kind]
            if len(subjects) <= candidates:
                raise ValueError('Resource corpus must contain a query plus all requested candidates')
            scope = ConsistencyScopes(db).resolve({'kind': 'datasets', 'dataset_ids': [prepared['datasets'][kind]]})
            if scope.sample_count != len(subjects):
                raise ValueError('Resource corpus changed after preparation')
            started = time.perf_counter()
            info = runtime.indexes.prepare(scope, config.profile.profile_id)
            cold_index_seconds = time.perf_counter() - started
            started = time.perf_counter()
            repeated = runtime.indexes.prepare(scope, config.profile.profile_id)
            hot_index_seconds = time.perf_counter() - started
            if info.generation != repeated.generation:
                raise ValueError('Unchanged resource index rebuilt unexpectedly')
            repository = FeatureRepository(db)
            query_ids = subjects[:min(100, len(subjects))]
            vectors = [np.frombuffer(repository.get_for_sample(identity, config.profile.profile_id)['embedding_blob'],
                dtype=config.profile.storage_dtype).astype(np.float32).reshape(1, -1) for identity in query_ids]
            vector_measurements, cold_times, hot_times, verified_counts = [], [], [], []
            cache_advice = 'POSIX_FADV_DONTNEED after per-file fsync; advisory'
            with runtime.indexes.acquire(scope, config.profile.profile_id) as index:
                for identity, vector in zip(query_ids, vectors):
                    started = time.perf_counter()
                    index.search(vector, top_k=candidates + 1)
                    vector_measurements.append({'query_id': identity, 'seconds': time.perf_counter() - started})
                count = min(queries, len(query_ids))
                for position, (identity, vector) in enumerate(zip(query_ids[:count], vectors[:count]), 1):
                    neighbors = index.search(vector, top_k=candidates + 1)[0]
                    chosen = [member for hit in neighbors for member in index.members(hit.group_id) if member != identity][:candidates]
                    for sample in SampleRepository(db).get_many([identity, *chosen]):
                        with open(sample.image_path, 'rb') as source:
                            os.fsync(source.fileno())
                            os.posix_fadvise(source.fileno(), 0, 0, os.POSIX_FADV_DONTNEED)
                    request = ImageRetrieve(query={'kind': 'sample', 'sample_id': identity}, corpus_scope=scope.selector,
                        profile_id=config.profile.profile_id, top_k=candidates)
                    for times in (cold_times, hot_times):
                        started = time.perf_counter()
                        result = runtime.consistency_service.retrieve_full(request, frozen_scope=scope,
                            encoder=config, prepare_query=False)
                        times.append(time.perf_counter() - started)
                        if result.coverage.verification.completed != candidates or result.member_count != candidates:
                            raise ValueError('A resource measurement did not actually verify the requested originals')
                        verified_counts.append(result.coverage.verification.completed)
                        with journal.open('a') as stream:
                            stream.write(json.dumps({'partition': kind, 'query_id': identity,
                                'cache': 'cold_advised' if times is cold_times else 'warm',
                                'seconds': times[-1], 'verified_members': result.coverage.verification.completed,
                                'scope_id': result.scope_id}) + '\n')
                            stream.flush()
                    if progress:
                        progress('VERIFIED_' + kind.upper(), position, count)
            with zipfile.ZipFile(info.index_path) as archive:
                mapping_bytes = archive.getinfo('manifest.json').file_size
                serialized_index_bytes = archive.getinfo('index.faiss').file_size
            dimensions = {(sample.width, sample.height) for sample in SampleRepository(db).get_many(subjects)}
            reports[kind] = {'index': info.model_dump(mode='json'), 'resolutions': sorted(dimensions),
                'vector_queries': len(vector_measurements), 'vector_measurements': vector_measurements,
                'vector_query_p95_ms': float(np.percentile([item['seconds'] for item in vector_measurements], 95)) * 1000,
                'index_cold_seconds': cold_index_seconds, 'index_hot_seconds': hot_index_seconds,
                'verification_queries': len(cold_times), 'candidates_per_query': candidates,
                'cold_advised_p95_seconds': float(np.percentile(cold_times, 95)),
                'warm_p95_seconds': float(np.percentile(hot_times, 95)), 'file_cache_control': cache_advice,
                'cold_advised_seconds': cold_times, 'warm_seconds': hot_times, 'verified_member_counts': verified_counts,
                'storage': {'vector_bytes': info.vector_bytes, 'serialized_index_bytes': serialized_index_bytes,
                    'mapping_bytes': mapping_bytes, 'archive_bytes': Path(info.index_path).stat().st_size}}
        peak_rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024
        no_encoder = 'torch' not in sys.modules
        main = reports['main']
        gates = ResourceChecks.model_validate({'real_encoder': prepared['encoder_kind'] == 'real_weights',
            'five_thousand_2048': main['index']['member_count'] >= 5000 and main['resolutions'] == [(2048, 2048)],
            'fp32_768': config.profile.storage_dtype == 'float32' and config.profile.dim == 768,
            'one_hundred_distinct_vector_queries': main['vector_queries'] >= 100,
            'vector_p95': main['vector_query_p95_ms'] <= 100,
            'twenty_originals_p95': candidates == 20 and max(main['cold_advised_p95_seconds'], main['warm_p95_seconds']) <= 3,
            'additional_rss': no_encoder and peak_rss - baseline_rss <= 2 * 1024**3,
            'stress_4096': reports['stress']['resolutions'] == [(4096, 4096)],
            'two_default_decode_workers': config.decode_workers == 2,
            'repeat_encoding_zero': prepared['repeated']['encoded_content_count'] == 0})
        report = {'profile_id': config.profile.profile_id, 'main': main, 'stress': reports['stress'], 'no_encoder_import': no_encoder,
            'resources': {'baseline_rss_bytes': baseline_rss, 'process_peak_rss_bytes': peak_rss,
                'additional_rss_upper_bound_bytes': max(0, peak_rss - baseline_rss), 'peak_method': 'kernel ru_maxrss in a separate model-free process',
                'decode_workers': config.decode_workers, 'decode_memory_mb': config.decode_memory_mb,
                'faiss_threads': runtime.indexes.limits.cpu_threads, 'query_concurrency': 1},
            'gates': gates.model_dump(), 'measured_checks_passed': gates.passed, 'publication_ready': False}
    report['storage'] = {'database_bytes': sum(path.stat().st_size for path in output.glob('baseline.db*') if path.is_file()),
        'evidence_bytes': sum(path.stat().st_size for path in (output / 'evidence').rglob('*') if path.is_file())}
    (output / 'resources.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    return report
