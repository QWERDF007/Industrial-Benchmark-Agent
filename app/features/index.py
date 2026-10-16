import os
import json
import time
import logging
from typing import Optional, List, Dict, Any, Tuple
import numpy as np
import faiss
from pydantic import BaseModel

from app.storage.database import Database
from app.storage.repositories import FeatureRepository

logger = logging.getLogger("iad_benchmark.features.index")


class IndexBuildResult(BaseModel):
    task_id: str
    model_id: str
    preprocess_key: str
    num_vectors: int
    dim: int
    index_path: str
    sample_ids_path: str
    metadata_path: str
    elapsed_seconds: float


def build_faiss_index(
    task_id: str,
    model_id: str = "dinov2_vitb14_reg",
    preprocess_key: str = "dinov2_224_norm",
    db_path: str = "data/benchmark.db",
    output_dir: Optional[str] = None,
) -> IndexBuildResult:
    """
    Build a FAISS IndexFlatIP (cosine similarity) index from SQLite feature cache.
    Rebuildable at any time without GPU inference.
    """
    start_time = time.time()
    db = Database(db_path)
    feat_repo = FeatureRepository(db)

    records = feat_repo.list_by_task(task_id, model_id, preprocess_key)
    if not records:
        raise ValueError(
            f"No feature records found for task '{task_id}', model '{model_id}', preprocess '{preprocess_key}'"
        )

    sample_ids = []
    vector_list = []
    dim = records[0].dim
    dtype_str = records[0].dtype

    np_dtype = np.float16 if dtype_str == "fp16" else np.float32

    for r in records:
        vec = np.frombuffer(r.embedding_blob, dtype=np_dtype)
        if len(vec) != dim:
            logger.warning(f"Vector length mismatch for sample {r.sample_id}: {len(vec)} vs {dim}")
            continue
        sample_ids.append(r.sample_id)
        vector_list.append(vec)

    num_vectors = len(sample_ids)
    if num_vectors == 0:
        raise ValueError("No valid feature vectors could be unpacked")

    # Stack and convert to float32 for FAISS IndexFlatIP
    embeddings = np.stack(vector_list, axis=0).astype(np.float32)

    # L2 normalize to guarantee cosine similarity
    faiss.normalize_L2(embeddings)

    # Create IndexFlatIP
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    # Destination directory
    idx_dir = output_dir or os.path.join("runs", "features", task_id)
    os.makedirs(idx_dir, exist_ok=True)

    index_file = os.path.join(idx_dir, "index.faiss")
    sample_ids_file = os.path.join(idx_dir, "sample_ids.json")
    metadata_file = os.path.join(idx_dir, "metadata.json")

    faiss.write_index(index, index_file)

    with open(sample_ids_file, "w", encoding="utf-8") as f:
        json.dump(sample_ids, f, indent=2, ensure_ascii=False)

    metadata = {
        "task_id": task_id,
        "model_id": model_id,
        "preprocess_key": preprocess_key,
        "num_vectors": num_vectors,
        "dim": dim,
        "metric": "cosine",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    elapsed = time.time() - start_time
    logger.info(
        f"Built FAISS index for {num_vectors} vectors (dim={dim}) in {elapsed:.2f}s at {index_file}"
    )

    return IndexBuildResult(
        task_id=task_id,
        model_id=model_id,
        preprocess_key=preprocess_key,
        num_vectors=num_vectors,
        dim=dim,
        index_path=index_file,
        sample_ids_path=sample_ids_file,
        metadata_path=metadata_file,
        elapsed_seconds=round(elapsed, 2),
    )


def load_faiss_index(
    index_dir: str,
) -> Tuple[faiss.Index, List[str], Dict[str, Any]]:
    """Load FAISS index, sample_ids, and metadata from directory."""
    index_file = os.path.join(index_dir, "index.faiss")
    sample_ids_file = os.path.join(index_dir, "sample_ids.json")
    metadata_file = os.path.join(index_dir, "metadata.json")

    if not os.path.exists(index_file):
        raise FileNotFoundError(f"FAISS index file not found: {index_file}")
    if not os.path.exists(sample_ids_file):
        raise FileNotFoundError(f"sample_ids file not found: {sample_ids_file}")

    index = faiss.read_index(index_file)
    with open(sample_ids_file, "r", encoding="utf-8") as f:
        sample_ids = json.load(f)

    metadata = {}
    if os.path.exists(metadata_file):
        with open(metadata_file, "r", encoding="utf-8") as f:
            metadata = json.load(f)

    return index, sample_ids, metadata
