from iad_core.dataset.registry import DatasetRegistry
from iad_core.exploration.models import ExplorationCatalog, ExplorationSnapshot, ExplorationVersion
from iad_core.storage.database import Database


class ExplorationRepository:
    def __init__(self, db: Database):
        self.db = db

    def get(self, version_id: str) -> ExplorationSnapshot:
        with self.db.connection() as conn:
            row = conn.execute('SELECT snapshot_json FROM direction_explorations WHERE version_id=?', (version_id,)).fetchone()
        if row is None:
            raise LookupError('方向探索版本不存在')
        return ExplorationSnapshot.model_validate_json(row[0])

    def catalog(self, dataset_id: str, version_id: str | None = None, direction_id: str | None = None) -> ExplorationCatalog:
        DatasetRegistry(self.db).get(dataset_id)
        with self.db.connection() as conn:
            rows = conn.execute('''SELECT version_id,run_id,created_at,json_array_length(snapshot_json,'$.directions') AS count
                FROM direction_explorations WHERE dataset_id=? ORDER BY rowid DESC''', (dataset_id,)).fetchall()
        versions = [ExplorationVersion(dataset_id=dataset_id, version_id=r['version_id'], run_id=r['run_id'],
                    created_at=r['created_at'], direction_count=r['count']) for r in rows]
        source_id = self.source(dataset_id, direction_id).version_id if direction_id else None
        if source_id and version_id and source_id != version_id:
            raise ValueError('方向不属于指定探索版本')
        selected = source_id or version_id or (versions[0].version_id if versions else None)
        if selected and selected not in {v.version_id for v in versions}:
            raise ValueError('方向探索版本不属于当前数据集')
        return ExplorationCatalog(dataset_id=dataset_id, versions=versions, exploration=self.get(selected) if selected else None)

    def direction(self, dataset_id: str, direction_id: str):
        return next(d for d in self.source(dataset_id, direction_id).directions if d.direction_id == direction_id)

    def source(self, dataset_id: str, direction_id: str) -> ExplorationSnapshot:
        with self.db.connection() as conn:
            row = conn.execute('''SELECT snapshot_json FROM direction_explorations
                WHERE dataset_id=? AND EXISTS(SELECT 1 FROM json_each(snapshot_json,'$.directions')
                    WHERE json_extract(value,'$.direction_id')=?)''', (dataset_id, direction_id)).fetchone()
        if row is None:
            raise ValueError('所选探索方向不存在或不属于当前数据集')
        return ExplorationSnapshot.model_validate_json(row[0])
