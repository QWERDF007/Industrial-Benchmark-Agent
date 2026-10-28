import json
from datetime import datetime, timezone

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.retrieval_sources import SourceImage
from iad_core.duplicate.index import PixelIndex
from iad_core.duplicate.models import PairObservation
from iad_core.duplicate.verify import PairVerifier
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository


class PairObservations:
    def __init__(self, db: Database):
        self.db = db

    def verify(self, sample_id_a: str, sample_id_b: str, *, verifier: PairVerifier,
               dino_cosine: float | None = None) -> PairObservation:
        left, right = sorted((sample_id_a, sample_id_b))
        if left == right:
            raise ValueError('Pair observations require two distinct samples')
        samples = {sample.sample_id: sample for sample in SampleRepository(self.db).get_many([left, right])}
        if len(samples) != 2 or samples[left].task_id != samples[right].task_id:
            raise ConsistencyError('REFERENCE_NOT_FOUND', 'Pair samples must belong to the same task')
        sources = []
        for identity in (left, right):
            published = PixelIndex(self.db).get(identity)
            if published is None:
                raise ConsistencyError('INDEX_NOT_READY', 'Publish image content before verifying relations')
            sources.append(SourceImage.read(samples[identity].image_path, published))
        result = verifier.verify_pixels(sources[0].pixels(), sources[1].pixels(), dino_cosine)
        observation = PairObservation(sample_id_a=left, sample_id_b=right,
            image_sha256_a=sources[0].sha256, image_sha256_b=sources[1].sha256,
            verification=result, config=verifier.config, checked_at=datetime.now(timezone.utc))
        with self.db.connection() as connection:
            connection.execute('''INSERT INTO image_pair_observations(
                sample_id_a,sample_id_b,image_sha256_a,image_sha256_b,observation_json)
                VALUES(?,?,?,?,?) ON CONFLICT(sample_id_a,sample_id_b,image_sha256_a,image_sha256_b)
                DO UPDATE SET observation_json=excluded.observation_json''',
                (left, right, observation.image_sha256_a, observation.image_sha256_b, observation.model_dump_json()))
        return observation

    def current(self, task_id: str) -> list[PairObservation]:
        with self.db.connection() as connection:
            connection.execute('BEGIN')
            rows = connection.execute('''SELECT o.observation_json FROM image_pair_observations o
                JOIN samples a ON a.sample_id=o.sample_id_a JOIN samples b ON b.sample_id=o.sample_id_b
                WHERE a.task_id=? AND b.task_id=? AND a.is_excluded=0 AND b.is_excluded=0
                ORDER BY o.sample_id_a,o.sample_id_b''', (task_id, task_id)).fetchall()
            observations = [PairObservation.model_validate_json(row[0]) for row in rows]
            identities = sorted({identity for item in observations for identity in (item.sample_id_a, item.sample_id_b)})
            states = connection.execute('''SELECT s.sample_id,s.image_path,p.*,d.scan_ref AS dataset_scan_ref
                FROM samples s JOIN sample_pixel_index p ON p.sample_id=s.sample_id
                JOIN datasets d ON d.dataset_id=s.dataset_id
                WHERE s.sample_id IN (SELECT value FROM json_each(?))''', (json.dumps(identities),)).fetchall()
        current = {}
        for row in states:
            if row['scan_ref'] != row['dataset_scan_ref']:
                continue
            try:
                current[row['sample_id']] = SourceImage.read(row['image_path'], PixelIndex.entry(row)).sha256
            except ConsistencyError:
                continue
        return [item for item in observations if current.get(item.sample_id_a) == item.image_sha256_a
            and current.get(item.sample_id_b) == item.image_sha256_b]
