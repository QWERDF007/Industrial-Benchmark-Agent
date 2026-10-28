import json
from contextlib import nullcontext

import numpy as np

from iad_core.feature.profiles import ImageEncoders
from iad_core.storage.database import Database
from iad_core.storage.models import FeatureRecord


class FeatureRepository:
    """Content owns vectors; sample feature rows are read-only projections."""

    def __init__(self, db: Database):
        self.db=db

    def upsert(self, record: FeatureRecord) -> None:
        self.upsert_batch([record])

    def upsert_batch(self, records: list[FeatureRecord]) -> None:
        profiles={}
        for record in records:
            if not isinstance(record,FeatureRecord):
                raise TypeError('Feature writes require a content FeatureRecord')
            if record.profile_id not in profiles:
                profiles[record.profile_id]=ImageEncoders(self.db).profile(record.profile_id)
            profile=profiles[record.profile_id]
            if (record.dim,record.dtype)!=(profile.dim,profile.storage_dtype):
                raise ValueError('Feature dimensions and precision must match its immutable profile')
            if record.status=='COMPLETE':
                if record.embedding_blob is None or record.error_code is not None or record.error_message is not None:
                    raise ValueError('Complete features require a vector and no failure')
                vector=np.frombuffer(record.embedding_blob,dtype=record.dtype)
                if vector.shape!=(record.dim,) or not np.isfinite(vector).all() or not np.isclose(np.linalg.norm(vector.astype(np.float32)),1,atol=1e-3):
                    raise ValueError('Feature vectors must have the configured dimensions and finite unit norm')
            elif record.embedding_blob is not None or not record.error_code:
                raise ValueError('Failed features require an error and no vector')
        with self.db.connection() as connection:
            connection.executemany('''INSERT INTO feature_records(
                content_group_id,profile_id,view_key,dim,dtype,embedding_blob,status,error_code,error_message,attempt_count)
                VALUES(?,?,?,?,?,?,?,?,?,1) ON CONFLICT(content_group_id,profile_id,view_key) DO UPDATE SET
                dim=excluded.dim,dtype=excluded.dtype,embedding_blob=excluded.embedding_blob,status=excluded.status,
                error_code=excluded.error_code,error_message=excluded.error_message,
                attempt_count=feature_records.attempt_count+1,updated_at=CURRENT_TIMESTAMP''',
                [(r.content_group_id,r.profile_id,r.view_key,r.dim,r.dtype,r.embedding_blob,r.status,r.error_code,r.error_message) for r in records])

    def get(self, content_group_id: str, profile_id: str, view_key: str = 'full') -> dict | None:
        with self.db.connection() as connection:
            row=connection.execute('SELECT * FROM feature_records WHERE content_group_id=? AND profile_id=? AND view_key=?',
                (content_group_id,profile_id,view_key)).fetchone()
        return dict(row) if row else None

    def get_for_sample(self, sample_id: str, profile_id: str | None = None, view_key: str = 'full') -> dict | None:
        with self.db.connection() as connection:
            row=connection.execute('''SELECT * FROM sample_features WHERE sample_id=?
                AND profile_id=COALESCE(?,(SELECT profile_id FROM workbench_image_settings WHERE id=1)) AND view_key=?''',
                (sample_id,profile_id,view_key)).fetchone()
        return dict(row) if row else None

    def list_by_task(self, task_id: str, profile_id: str | None = None) -> list[dict]:
        with self.db.connection() as connection:
            rows=connection.execute('''SELECT f.* FROM sample_features f JOIN samples s ON s.sample_id=f.sample_id
                WHERE s.task_id=? AND f.profile_id=COALESCE(?,(SELECT profile_id FROM workbench_image_settings WHERE id=1))
                AND f.view_key='full' ORDER BY s.id''',(task_id,profile_id)).fetchall()
        return [dict(row) for row in rows]

    def count_by_task(self, task_id: str, profile_id: str | None = None) -> int:
        with self.db.connection() as connection:
            return connection.execute('''SELECT count(*) FROM sample_features f JOIN samples s ON s.sample_id=f.sample_id
                WHERE s.task_id=? AND f.profile_id=COALESCE(?,(SELECT profile_id FROM workbench_image_settings WHERE id=1))
                AND f.view_key='full' ''',(task_id,profile_id)).fetchone()[0]

    def sources(self, sample_ids: list[str]) -> list[dict]:
        with self.db.connection() as connection:
            rows=connection.execute('''SELECT s.sample_id,s.image_path,p.*
                FROM samples s JOIN json_each(?) requested ON requested.value=s.sample_id
                LEFT JOIN sample_pixel_index p ON p.sample_id=s.sample_id WHERE s.is_excluded=0 ORDER BY s.sample_id''',
                (json.dumps(sorted(set(sample_ids))),)).fetchall()
        return [dict(row) for row in rows]

    def records(self, group_ids: list[str], profile_id: str, view_key: str = 'full') -> list[dict]:
        with self.db.connection() as connection:
            rows=connection.execute('''SELECT f.* FROM feature_records f JOIN json_each(?) scope ON scope.value=f.content_group_id
                WHERE f.profile_id=? AND f.view_key=?''',(json.dumps(sorted(set(group_ids))),profile_id,view_key)).fetchall()
        return [dict(row) for row in rows]

    def corpus_metadata(self, sample_ids: list[str], profile_id: str, connection) -> list[dict]:
        rows=connection.execute('''SELECT s.sample_id,p.content_group_id,p.scan_ref,
            json_extract(p.descriptor_json,'$.decode_status') AS decode_status,
            f.status AS feature_status,f.attempt_count,f.dim,f.dtype
            FROM samples s JOIN json_each(?) scope ON scope.value=s.sample_id
            LEFT JOIN sample_pixel_index p ON p.sample_id=s.sample_id
            LEFT JOIN feature_records f ON f.content_group_id=p.content_group_id AND f.profile_id=? AND f.view_key='full'
            WHERE s.is_excluded=0 ORDER BY s.sample_id''',(json.dumps(sample_ids),profile_id)).fetchall()
        return [dict(row) for row in rows]

    def iter_vectors(self, group_ids: tuple[str,...], profile_id: str, connection=None):
        with nullcontext(connection) if connection is not None else self.db.connection() as connection:
            rows=connection.execute('''SELECT f.* FROM feature_records f JOIN json_each(?) scope ON scope.value=f.content_group_id
                WHERE f.profile_id=? AND f.view_key='full' AND f.status='COMPLETE' ORDER BY f.content_group_id''',
                (json.dumps(group_ids),profile_id))
            for row in rows:
                yield dict(row)
