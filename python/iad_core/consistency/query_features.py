import io
from typing import TYPE_CHECKING,Callable

import numpy as np
from PIL import Image

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import ImageQuery
from iad_core.feature.cache import ContentFeatureCache
from iad_core.feature.profiles import ImageEncoderConfig, ImageEncoders
from iad_core.storage.features import FeatureRepository
from iad_core.storage.database import Database

if TYPE_CHECKING:
    from iad_core.workbench.runtime import WorkbenchRuntime


class QueryFeatures:
    def __init__(self, db: Database, runtime: 'WorkbenchRuntime'):
        self.db = db
        self.runtime = runtime

    def vector(self, query: ImageQuery, profile_id: str | None, *, owner_id: str | None = None,
               config: ImageEncoderConfig | None = None, checkpoint: Callable[[],None] | None = None,
               prepare: bool = True) -> tuple[str, np.ndarray]:
        encoders = ImageEncoders(self.db)
        profile = encoders.profile(profile_id)
        settings = encoders.read()
        config = config or ImageEncoderConfig(profile=profile, **settings.resources.model_dump())
        if config.profile.profile_id!=profile.profile_id:raise ConsistencyError('INVALID_SCOPE','Query encoder differs from the frozen profile')
        if checkpoint:checkpoint()
        if query.kind == 'sample':
            repository = FeatureRepository(self.db)
            record = repository.get_for_sample(query.sample_id, profile.profile_id)
            if record is None and prepare:
                ContentFeatureCache(self.db, self.runtime.images).prepare([query.sample_id], config,checkpoint=checkpoint)
                record = repository.get_for_sample(query.sample_id, profile.profile_id)
            if record is None:
                raise ConsistencyError('INDEX_NOT_READY', 'Query vector is unavailable for this profile')
            vector = np.frombuffer(record['embedding_blob'], dtype=record['dtype']).astype(np.float32).reshape(1, -1)
        else:
            def encode(source):
                if checkpoint:checkpoint()
                with Image.open(io.BytesIO(source.payload)) as image:
                    vector = self.runtime.images.encode(config, [image])
                if checkpoint:checkpoint()
                if (vector.shape != (1, profile.dim) or not np.isfinite(vector).all()
                        or not np.isclose(np.linalg.norm(vector.astype(np.float32)), 1, atol=1e-3)):
                    raise ConsistencyError('ENCODER_UNAVAILABLE', 'Query encoder returned an invalid vector')
                return vector
            vector = self.runtime.temporary_images.vector(query.image_ref, owner_id=owner_id,
                profile_id=profile.profile_id, encode=encode)
        return profile.profile_id, vector
