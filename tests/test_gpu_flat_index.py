from concurrent.futures import ThreadPoolExecutor

import numpy as np
import pytest

from iad_core.consistency.errors import ConsistencyError
from iad_core.feature.flat_index import GpuDevice, GpuFlatIndex
from iad_core.feature.index_models import IndexLimits


def test_gpu_fp16_top_k_filters_threshold_and_round_trips_with_shared_resources():
    groups = ('a', 'b', 'c')
    matrix = np.zeros((3, 16), dtype=np.float16)
    matrix[:, :2] = ((1, 0), (.8, .6), (0, 1))
    rows = [dict(content_group_id=group, dtype='float16', embedding_blob=vector.tobytes())
        for group, vector in zip(groups, matrix)]
    members = {group: (group + '.png',) for group in groups}
    gpu = GpuDevice(0)
    index = GpuFlatIndex.build(rows, groups, members, 16, IndexLimits(), gpu=gpu)
    query = matrix[:1]
    assert index.device == 0 and index.storage_dtype == 'float16'
    assert [hit.group_id for hit in index.search(query, 1, min_similarity=0)[0]] == ['a']
    hits = index.search(query, 3, min_similarity=.75)[0]
    assert [hit.group_id for hit in hits] == ['a', 'b']
    assert [hit.score for hit in hits] == pytest.approx([1, .8], abs=.001)
    assert [hit.group_id for hit in index.search(query, 3, min_similarity=1)[0]] == ['a']
    assert index.search(matrix[2:], 1, min_similarity=1)[0][0].group_id == 'c'
    assert index.search(np.full((1, 16), .25, dtype=np.float16), 2, min_similarity=.99) == ((),)
    restored = GpuFlatIndex.deserialize(index.serialize().tobytes(), groups, members, 16, IndexLimits(), gpu=gpu)
    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(lambda _: restored.search(query, 3, min_similarity=.75), range(8)))
    assert all(result == (hits,) for result in results)
    assert restored.vectors(0, 3).shape == (3, 16)


def test_gpu_index_rejects_an_unavailable_device_without_cpu_fallback():
    import faiss

    with pytest.raises(ConsistencyError, match='GPU'):
        GpuDevice(faiss.get_num_gpus())
