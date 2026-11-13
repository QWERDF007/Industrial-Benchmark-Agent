from collections.abc import Iterable, Mapping
import threading

import numpy as np

from iad_core.consistency.errors import ConsistencyError
from iad_core.feature.index_models import GroupHit, IndexLimits


class GpuDevice:
    def __init__(self, device: int, temporary_bytes: int = 64 * 1024**2):
        try:
            import faiss
            if not hasattr(faiss, 'GpuIndexFlatIP') or not 0 <= device < faiss.get_num_gpus():
                raise ValueError('FAISS GPU 设备不可用')
            self.library, self.device = faiss, device
            self.lock = threading.RLock()
            self.resources = faiss.StandardGpuResources()
            self.resources.setTempMemory(temporary_bytes)
        except (ImportError, ValueError, RuntimeError) as error:
            raise ConsistencyError('INDEX_NOT_READY', f'FAISS GPU: {error}') from error


class GpuFlatIndex:
    """Immutable FP16 GPU flat index with bounded Top-K output."""

    storage_dtype = 'float16'

    def __init__(self, index, group_ids: tuple[str, ...], members: Mapping[str, tuple[str, ...]],
                 limits: IndexLimits, gpu: GpuDevice):
        self._index, self._gpu = index, gpu
        self.group_ids, self.members, self.limits = group_ids, members, limits
        self.device = gpu.device

    @classmethod
    def build(cls, rows: Iterable[dict], group_ids: tuple[str, ...], members, dim: int,
              limits: IndexLimits, *, gpu: GpuDevice):
        matrix = np.empty((len(group_ids), dim), dtype=np.float16)
        seen = []
        for row in rows:
            vector = np.frombuffer(row['embedding_blob'], dtype=row['dtype'])
            if (vector.shape != (dim,) or not np.isfinite(vector).all()
                    or not np.isclose(np.linalg.norm(vector.astype(np.float32)), 1, atol=1e-3)):
                raise ConsistencyError('INDEX_NOT_READY', 'Cached content vector is invalid; regenerate its features')
            if len(seen) >= len(group_ids):
                raise ConsistencyError('SOURCE_UNAVAILABLE', 'Unexpected content vector during index construction')
            matrix[len(seen)] = vector
            seen.append(row['content_group_id'])
        if tuple(seen) != group_ids:
            raise ConsistencyError('SOURCE_UNAVAILABLE', 'Content vectors changed during index construction')
        with gpu.lock:
            config = gpu.library.GpuIndexFlatConfig()
            config.device, config.useFloat16 = gpu.device, True
            index = gpu.library.GpuIndexFlatIP(gpu.resources, dim, config)
            index.add(matrix)
        return cls(index, group_ids, members, limits, gpu)

    def search(self, vectors: np.ndarray, top_k: int, *,
               min_similarity: float | None = None) -> tuple[tuple[GroupHit, ...], ...]:
        if isinstance(top_k, bool) or not isinstance(top_k, int) or top_k < 1:
            raise ValueError('Neighbor count must be a positive integer')
        if min_similarity is not None and (isinstance(min_similarity, bool) or not 0 <= min_similarity <= 1):
            raise ValueError('Minimum similarity must be finite and between zero and one')
        if top_k > self.limits.max_neighbors:
            raise ConsistencyError('RESOURCE_LIMIT', 'Neighbor count exceeds the configured output budget')
        queries = np.asarray(vectors)
        if queries.ndim != 2 or queries.shape[1] != self._index.d:
            raise ValueError('Query dimensions must match the embedding profile')
        if len(queries) > self.limits.query_batch_size:
            raise ConsistencyError('RESOURCE_LIMIT', 'Query batch exceeds the configured limit')
        norms = np.linalg.norm(queries.astype(np.float32), axis=1)
        if not np.isfinite(queries).all() or np.any(norms <= 1e-12):
            raise ValueError('Query vectors must be finite and nonzero')
        if not self.group_ids or not len(queries):
            return tuple(() for _ in queries)
        queries = np.ascontiguousarray(queries / norms[:, None], dtype=np.float16)
        with self._gpu.lock:
            scores, indices = self._index.search(queries, min(top_k, len(self.group_ids)))
        threshold = np.float32(min_similarity) if min_similarity is not None else -np.inf
        return tuple(tuple(GroupHit(self.group_ids[int(index)], float(np.clip(score, -1, 1)), rank)
            for rank, (index, score) in enumerate(sorted(
                ((index, score) for index, score in zip(row_indices, row_scores) if index >= 0 and score >= threshold),
                key=lambda hit: (-hit[1], self.group_ids[int(hit[0])])), 1))
            for row_indices, row_scores in zip(indices, scores))

    def vectors(self, start: int, count: int) -> np.ndarray:
        if not 0 <= start <= len(self.group_ids) or not 0 <= count <= self.limits.query_batch_size or start + count > len(self.group_ids):
            raise ValueError('Invalid vector batch')
        with self._gpu.lock:
            vectors = self._index.reconstruct_n(start, count)
        vectors.setflags(write=False)
        return vectors

    def serialize(self) -> np.ndarray:
        with self._gpu.lock:
            return self._gpu.library.serialize_index(self._gpu.library.index_gpu_to_cpu(self._index))

    @classmethod
    def deserialize(cls, payload: bytes, group_ids, members, dim: int, limits: IndexLimits, *, gpu: GpuDevice):
        faiss = gpu.library
        stored = faiss.deserialize_index(np.frombuffer(payload, dtype=np.uint8))
        if not isinstance(stored, faiss.IndexFlat) or stored.metric_type != faiss.METRIC_INNER_PRODUCT or stored.d != dim or stored.ntotal != len(group_ids):
            raise ValueError('Stored index does not match its corpus and embedding profile')
        with gpu.lock:
            options = faiss.GpuClonerOptions()
            options.useFloat16 = True
            index = faiss.index_cpu_to_gpu(gpu.resources, gpu.device, stored, options)
        return cls(index, group_ids, members, limits, gpu)
