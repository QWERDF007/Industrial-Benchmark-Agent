from typing import List, Union
import hashlib
from pathlib import Path
import numpy as np
from PIL import Image
from iad_core.feature.base import FeatureExtractor


class MockFeatureExtractor(FeatureExtractor):
    """
    Lightweight deterministic feature extractor for fast tests and CPU verification.
    """

    def __init__(
        self,
        model_id: str = "mock_vit_768",
        profile_id: str = "mock_224",
        dim: int = 768,
        dtype: str = "fp16",
        profile=None,
    ):
        self.model_id = profile.model_id if profile else model_id
        self.profile_id = profile.profile_id if profile else profile_id
        self.dim = profile.dim if profile else dim
        self.dtype_str = {'float16':'fp16','float32':'fp32'}[profile.storage_dtype] if profile else dtype

    def encode_batch(
        self, images: List[Union[Image.Image, np.ndarray, str]]
    ) -> np.ndarray:
        if not images:
            return np.empty((0, self.dim), dtype=np.float16 if self.dtype_str == "fp16" else np.float32)

        vectors = []
        for img in images:
            if isinstance(img, str):
                pil_img = Image.open(img).convert("RGB")
            elif isinstance(img, np.ndarray):
                pil_img = Image.fromarray(img).convert("RGB")
            else:
                pil_img = img.convert("RGB")

            resized = pil_img.resize((16, 16))
            arr = np.asarray(resized, dtype=np.float32) / 255.0
            vec = arr.flatten()
            if len(vec) < self.dim:
                vec = np.pad(vec, (0, self.dim - len(vec)))
            else:
                vec = vec[: self.dim]

            seed = int(np.sum(vec[:10]) * 1000) % (2**31 - 1)
            rng = np.random.RandomState(seed)
            noise = rng.normal(0, 0.05, size=self.dim)
            vec = vec + noise
            vectors.append(vec)

        arr = np.stack(vectors, axis=0)
        norm = np.linalg.norm(arr, axis=-1, keepdims=True)
        arr = arr / np.maximum(norm, 1e-12)

        target_dtype = np.float16 if self.dtype_str == "fp16" else np.float32
        return arr.astype(target_dtype)


def configure_test_encoder(db, root):
    from iad_core.feature.profiles import EmbeddingProfile, ImageEncoderConfig, ImageEncoderEdit, ImageEncoders
    root=Path(root)
    weights=root/'dispatch-fixture.pth';weights.write_bytes(b'dispatch fixture, never loaded as a real model')
    source=root/'dispatch-source';source.mkdir(exist_ok=True)
    (source/'hubconf.py').write_text('')
    profile=EmbeddingProfile.create('dinov2_vitb14_reg',str(weights),str(source),storage_dtype='float16')
    config=ImageEncoderConfig(profile=profile)
    settings=ImageEncoders(db)
    settings.save(ImageEncoderEdit(expected_revision=settings.read().revision,selection=config))
    return config


def index_test_samples(db):
    from iad_core.dataset.registry import DatasetRegistry
    DatasetRegistry(db).discover()
    from iad_core.duplicate.index import PixelScan
    with db.connection() as connection:
        datasets=[row[0] for row in connection.execute('SELECT DISTINCT dataset_id FROM samples')]
    for dataset_id in datasets:
        with db.connection() as connection:
            scan=PixelScan(connection)
            for row in connection.execute('SELECT sample_id,image_path FROM main.samples WHERE dataset_id=?',(dataset_id,)):
                scan.stage(row['sample_id'],row['image_path'],hashlib.sha256(Path(row['image_path']).read_bytes()).hexdigest())
            scan.publish(dataset_id)


def seed_test_vector(db, sample_id, vector, profile):
    from iad_core.duplicate.index import PixelIndex
    from iad_core.storage.models import FeatureRecord
    from iad_core.storage.repositories import SampleRepository, FeatureRepository
    sample=SampleRepository(db).get(sample_id)
    color=tuple(hashlib.sha256(sample_id.encode()).digest()[:3])
    Image.new('RGB',(sample.width,sample.height),color).save(sample.image_path)
    index_test_samples(db)
    padded=np.pad(vector,(0,profile.dim-len(vector))).astype(profile.storage_dtype)
    FeatureRepository(db).upsert(FeatureRecord(content_group_id=PixelIndex(db).get(sample_id).content_group_id,
        profile_id=profile.profile_id,dim=profile.dim,dtype=profile.storage_dtype,embedding_blob=padded.tobytes()))
