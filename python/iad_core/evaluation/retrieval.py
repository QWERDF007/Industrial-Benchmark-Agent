import hashlib
import json
import platform
import resource
import time
from contextlib import closing
from pathlib import Path
from typing import Callable

import numpy as np

from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.models import ImageRetrieve
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.duplicate.index import PixelIndex
from iad_core.evaluation.retrieval_models import RetrievalBenchmark
from iad_core.feature.base import FeatureExtractor
from iad_core.feature.cache import ContentFeatureCache
from iad_core.feature.profiles import ImageEncoderConfig
from iad_core.storage.database import Database
from iad_core.storage.features import FeatureRepository
from iad_core.storage.repositories import SampleRepository
from iad_core.workbench.runtime import WorkbenchRuntime


def evaluate_retrieval(manifest: RetrievalBenchmark, config: ImageEncoderConfig, output: Path, *,
                       top_k: int = 50, extractor: FeatureExtractor | None = None,
                       progress: Callable[[str, int, int], None] | None = None) -> dict:
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    if (output / 'benchmark.db').exists():
        raise ValueError('Evaluation requires a fresh output directory for a cold database and index')
    items = {item.item_id: item for item in manifest.items}
    for item in items.values():
        path = manifest.datasets[item.dataset] / item.relative_path
        if hashlib.sha256(path.read_bytes()).hexdigest() != item.sha256:
            raise ValueError('Benchmark source changed: ' + item.item_id)
    (output / 'manifest.json').write_text(manifest.model_dump_json(indent=2))
    (output / 'config.json').write_text(config.model_dump_json(indent=2))
    db = Database(str(output / 'benchmark.db'))
    registry = DatasetRegistry(db)
    datasets, identities = {}, {}
    scan_started = time.perf_counter()
    for name, root in manifest.datasets.items():
        dataset = registry.import_labelme(DatasetImport(format='labelme', name=name,
            image_dir=str(root), annotation_dir=str(root), annotation_policy={
                'policy_id': 'retrieval-benchmark', 'annotation_role': 'REFERENCE', 'annotation_coverage': 'EXHAUSTIVE'}))
        datasets[name] = dataset.dataset.id
        expected = {item.relative_path: item.item_id for item in items.values() if item.dataset == name}
        samples = SampleRepository(db).list_by_task(dataset.task.task_id)
        if {sample.relative_path for sample in samples} != set(expected):
            raise ValueError('Dataset membership differs from the frozen manifest: ' + name)
        identities.update({expected[sample.relative_path]: sample.sample_id for sample in samples})
    scan_seconds = time.perf_counter() - scan_started
    ancestry = {}
    for query in manifest.queries:
        group = PixelIndex(db).get(identities[query.query_id]).content_group_id
        declared = items[query.query_id].source_group
        if group and ancestry.setdefault(group, declared) != declared:
            raise ValueError('Identical query pixels cannot belong to different source groups or evaluation splits')
    if progress:
        progress('SCANNED', len(items), len(items))
    reverse = {value: key for key, value in identities.items()}
    scope = ConsistencyScopes(db).resolve({'kind': 'datasets', 'dataset_ids': [datasets[name] for name in manifest.corpus]})
    queries = [query for query in manifest.queries if items[query.query_id].split == 'acceptance']
    if not queries:
        raise ValueError('Evaluation requires acceptance queries')
    with closing(WorkbenchRuntime(db)) as runtime:
        cache = ContentFeatureCache(db, runtime.images)
        started = time.perf_counter()
        prepared = cache.prepare(list(identities.values()), config, extractor=extractor)
        encoding_seconds = time.perf_counter() - started
        if progress:
            progress('ENCODED', prepared.encoded_content_count, prepared.total_content)
        if prepared.completed_samples != len(identities):
            raise ValueError('Benchmark features are incomplete')
        started = time.perf_counter()
        info = runtime.indexes.prepare(scope, config.profile.profile_id)
        index_cold_seconds = time.perf_counter() - started
        started = time.perf_counter()
        warm = runtime.indexes.prepare(scope, config.profile.profile_id)
        index_hot_seconds = time.perf_counter() - started
        if info.generation != warm.generation:
            raise ValueError('Repeated index preparation unexpectedly rebuilt the corpus')
        repeated = cache.prepare(list(identities.values()), config, extractor=extractor)
        feature_repository = FeatureRepository(db)
        vectors = np.stack([np.frombuffer(feature_repository.get_for_sample(identities[query.query_id], config.profile.profile_id)
            ['embedding_blob'], dtype=config.profile.storage_dtype).astype(np.float32) for query in queries])
        vector_times, hits_by_query = [], []
        with runtime.indexes.acquire(scope, config.profile.profile_id) as index:
            for vector in vectors:
                started = time.perf_counter()
                index.search(vector.reshape(1, -1), top_k=top_k)
                vector_times.append(time.perf_counter() - started)
            started = time.perf_counter()
            for offset in range(0, len(vectors), runtime.indexes.limits.query_batch_size):
                hits_by_query.extend(index.search(vectors[offset:offset + runtime.indexes.limits.query_batch_size], top_k=top_k))
            vector_batch_seconds = time.perf_counter() - started
            matches = [{reverse[identity] for hit in hits for identity in index.members(hit.group_id)} for hits in hits_by_query]
        visual_any = visual_all = visual_members = visual_expected = strict_recalled = strict_expected = 0
        non_geometric_queries = non_geometric_any = 0
        strata = {}
        retrieval_times, outcomes, negative_checks = [], [], []
        for query, found in zip(queries, matches):
            expected = set(query.relevant_ids)
            visual_any += bool(found & expected)
            visual_all += expected.issubset(found)
            visual_members += len(found & expected)
            visual_expected += len(expected)
            non_geometric = {identity for identity in expected if items[identity].stratum in ('jpeg', 'resize', 'brightness')}
            if non_geometric:
                non_geometric_queries += 1
                non_geometric_any += bool(found & non_geometric)
            for identity in expected:
                stratum = items[identity].stratum
                count = strata.setdefault(stratum, {'expected_members': 0, 'recalled_members': 0})
                count['expected_members'] += 1
                count['recalled_members'] += identity in found
            started = time.perf_counter()
            page = runtime.consistency_service.retrieve_full(ImageRetrieve(query={'kind': 'sample', 'sample_id': identities[query.query_id]},
                corpus_scope=scope.selector, profile_id=config.profile.profile_id, top_k=top_k),
                frozen_scope=scope, encoder=config, prepare_query=False)
            retrieval_times.append(time.perf_counter() - started)
            strict_found = {reverse[member.sample_id] for group in page.exact.groups for member in group.members if member.relation == 'EXACT'}
            strict_expected += len(query.strict_ids)
            strict_recalled += len(set(query.strict_ids) & strict_found)
            for identity in query.hard_negative_ids:
                result = runtime.consistency_service.compare(ConsistencyCompare(sample_a=identities[query.query_id], sample_b=identities[identity]))
                negative_checks.append({'query_id': query.query_id, 'reference_id': identity,
                    'relation': result.verification.relation, 'evidence_id': result.evidence_id,
                    'result_id': result.result_id, 'stratum': items[identity].stratum, 'verification': query.verification})
            outcomes.append({'query_id': query.query_id, 'source_group': items[query.query_id].source_group,
                'scope_id': page.scope_id, 'visual_found': sorted(found), 'missed_visual': sorted(expected - found),
                'missed_strict': sorted(set(query.strict_ids) - strict_found), 'completeness': page.retrieval_completeness,
                'verification': page.coverage.verification.model_dump()})
            if progress:
                progress('QUERIED', len(outcomes), len(queries))
        for counts in strata.values():
            counts['member_recall'] = counts['recalled_members'] / counts['expected_members']
        sources = len({items[query.query_id].source_group for query in queries})
        gpu = None
        if extractor is None and config.device.startswith('cuda:'):
            import torch
            properties = torch.cuda.get_device_properties(config.device)
            gpu = {'name': properties.name, 'total_bytes': properties.total_memory,
                'peak_allocated_bytes': torch.cuda.max_memory_allocated(config.device),
                'peak_reserved_bytes': torch.cuda.max_memory_reserved(config.device), 'torch_version': torch.__version__}
        false_exact = sum(check['relation'] == 'EXACT' for check in negative_checks)
        unverified_negatives = sum(check['relation'] == 'UNCHECKED' for check in negative_checks)
        ready = {'industrial_200_sources': manifest.origin == 'industrial' and sources >= 200
                and {items[query.query_id].source_group for query in queries}.issubset(manifest.sources),
            'real_encoder': extractor is None,
            'verified_copy_relationships': all(query.verification != 'unverified' for query in queries),
            'strict_member_recall': strict_expected > 0 and strict_expected == strict_recalled,
            'non_geometric_recall': non_geometric_queries > 0 and non_geometric_any / non_geometric_queries >= .99,
            'negative_exact_proofs': bool(negative_checks) and false_exact == unverified_negatives == 0,
            'real_defect_and_instance_negatives': {'real_micro_defect', 'other_instance', 'repeated_texture'}.issubset(
                {check['stratum'] for check in negative_checks if check['verification'] == 'human_confirmed'}),
            'scale_and_resource_acceptance': False}
        metrics = {'status': 'EVALUATED', 'manifest_sha256': hashlib.sha256(manifest.model_dump_json().encode()).hexdigest(),
            'profile_id': config.profile.profile_id, 'encoder_kind': 'external_test_extractor' if extractor else 'real_weights',
            'acceptance_sources': sources, 'acceptance_queries': len(queries), 'top_k_groups': top_k,
            'visual': {'any_copy_recall': visual_any / len(queries), 'all_copies_recall': visual_all / len(queries),
                'member_recall': visual_members / visual_expected, 'expected_members': visual_expected, 'recalled_members': visual_members,
                'non_geometric_queries': non_geometric_queries,
                'non_geometric_any_copy_recall': non_geometric_any / non_geometric_queries if non_geometric_queries else None,
                'strata': strata},
            'strict': {'expected_members': strict_expected, 'recalled_members': strict_recalled,
                'member_recall': strict_recalled / strict_expected if strict_expected else None,
                'negative_pairs': len(negative_checks), 'false_exact': false_exact, 'unchecked_negatives': unverified_negatives},
            'seconds': {'scan': scan_seconds, 'encoding': encoding_seconds, 'index_cold': index_cold_seconds,
                'index_hot': index_hot_seconds, 'vector_single_p95': float(np.percentile(vector_times, 95)),
                'vector_single_samples': len(vector_times), 'vector_batch_total': vector_batch_seconds,
                'end_to_end_p95': float(np.percentile(retrieval_times, 95)), 'end_to_end_samples': len(retrieval_times),
                'file_cache_control': 'uncontrolled'},
            'cache': {'initial_encoded_content': prepared.encoded_content_count,
                'initial_cache_hits': prepared.cache_hit_count, 'repeat_encoded_content': repeated.encoded_content_count},
            'index': info.model_dump(mode='json'), 'index_stats': runtime.indexes.stats().model_dump(),
            'resources': {'process_peak_rss_bytes_including_model': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024,
                'machine': platform.machine(), 'cpu': platform.processor(), 'device': config.device,
                'gpu': gpu, 'rss_measurement_scope': 'process_lifetime_including_model',
                'cpu_threads': runtime.indexes.limits.cpu_threads, 'gpu_memory_budget_mb': config.gpu_memory_mb},
            'gates': ready, 'publication_ready': all(ready.values())}
        (output / 'metrics.json').write_text(json.dumps(metrics, ensure_ascii=False, indent=2))
        (output / 'outcomes.json').write_text(json.dumps(outcomes, ensure_ascii=False, indent=2))
        (output / 'negative-checks.json').write_text(json.dumps(negative_checks, ensure_ascii=False, indent=2))
        return metrics
