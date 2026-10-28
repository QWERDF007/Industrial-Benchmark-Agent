from collections.abc import Iterable, Mapping

import numpy as np

from iad_core.consistency.errors import ConsistencyError
from iad_core.feature.index_models import GroupHit, IndexLimits


def cpu_library():
    try:
        import faiss
    except ImportError as error:
        raise ConsistencyError('INDEX_NOT_READY','Install the retrieval optional dependency to use CPU visual indexes') from error
    return faiss


class CpuFlatIndex:
    """An immutable CPU index. Mutation is confined to its construction."""

    def __init__(self, index, group_ids: tuple[str,...], members: Mapping[str,tuple[str,...]], limits: IndexLimits):
        self._index=index
        self.group_ids=group_ids
        self.members=members
        self.limits=limits

    @classmethod
    def build(cls, rows: Iterable[dict], group_ids: tuple[str,...], members, dim: int, limits: IndexLimits):
        faiss=cpu_library()
        faiss.omp_set_num_threads(limits.cpu_threads)
        index=faiss.IndexFlatIP(dim)
        matrix=np.empty((len(group_ids),dim),dtype=np.float32)
        seen=[]
        for row in rows:
            vector=np.frombuffer(row['embedding_blob'],dtype=row['dtype']).astype(np.float32)
            if vector.shape!=(dim,) or not np.isfinite(vector).all() or not np.isclose(np.linalg.norm(vector),1,atol=1e-3):
                raise ConsistencyError('INDEX_NOT_READY','Cached content vector is invalid; regenerate its features')
            if len(seen)>=len(group_ids):
                raise ConsistencyError('SOURCE_UNAVAILABLE','Unexpected content vector during index construction')
            matrix[len(seen)]=vector
            seen.append(row['content_group_id'])
        if tuple(seen)!=group_ids:
            raise ConsistencyError('SOURCE_UNAVAILABLE','Content vectors changed during index construction')
        faiss.normalize_L2(matrix)
        index.add(matrix)
        return cls(index,group_ids,members,limits)

    def search(self, vectors: np.ndarray, top_k: int) -> tuple[tuple[GroupHit,...],...]:
        faiss=cpu_library()
        if isinstance(top_k,bool) or not isinstance(top_k,int) or top_k<1:
            raise ValueError('Neighbor count must be a positive integer')
        if top_k>self.limits.max_neighbors:
            raise ConsistencyError('RESOURCE_LIMIT','Neighbor count exceeds the configured output budget')
        queries=np.asarray(vectors,dtype=np.float32)
        if queries.ndim!=2 or queries.shape[1]!=self._index.d:
            raise ValueError('Query dimensions must match the embedding profile')
        if len(queries)>self.limits.query_batch_size:
            raise ConsistencyError('RESOURCE_LIMIT','Query batch exceeds the configured limit')
        norms=np.linalg.norm(queries,axis=1)
        if not np.isfinite(queries).all() or np.any(norms<=1e-12):
            raise ValueError('Query vectors must be finite and nonzero')
        if not self.group_ids:
            return tuple(() for _ in queries)
        queries=np.ascontiguousarray(queries.copy())
        faiss.normalize_L2(queries)
        faiss.omp_set_num_threads(self.limits.cpu_threads)
        scores,indices=self._index.search(queries,min(top_k,len(self.group_ids)))
        return tuple(tuple(GroupHit(self.group_ids[int(index)],float(np.clip(score,-1,1)),rank)
            for rank,(index,score) in enumerate(zip(row_indices,row_scores),1) if index>=0)
            for row_indices,row_scores in zip(indices,scores))

    def vectors(self, start: int, count: int) -> np.ndarray:
        if not 0<=start<=len(self.group_ids) or not 0<=count<=self.limits.query_batch_size or start+count>len(self.group_ids):
            raise ValueError('Invalid vector batch')
        vectors=self._index.reconstruct_n(start,count)
        vectors.setflags(write=False)
        return vectors

    def serialize(self) -> np.ndarray:
        faiss=cpu_library()
        return faiss.serialize_index(self._index)

    @classmethod
    def deserialize(cls, payload: bytes, group_ids, members, dim: int, limits: IndexLimits):
        faiss=cpu_library()
        index=faiss.deserialize_index(np.frombuffer(payload,dtype=np.uint8))
        if not isinstance(index,faiss.IndexFlat) or index.metric_type!=faiss.METRIC_INNER_PRODUCT or index.d!=dim or index.ntotal!=len(group_ids):
            raise ValueError('Stored index does not match its corpus and embedding profile')
        return cls(index,group_ids,members,limits)
