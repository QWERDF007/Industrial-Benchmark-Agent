from sqlite3 import Connection
from pathlib import PurePosixPath

from iad_core.dataset.registry import DatasetRegistry
from iad_core.storage.database import Database
from iad_core.task.config import DatasetConfig
from iad_core.duplicate.index import PixelScan


class ScanSnapshot:
    """Stage source parsing privately, then publish current imports in one short transaction."""

    def __init__(self, connection: Connection, config: DatasetConfig, *, force_pixels: bool = False,
                 pixel_cache_bytes: int = 256 * 1024 * 1024):
        self.connection = connection
        row = connection.execute('SELECT config_json,scan_ref FROM datasets WHERE dataset_id=?', (config.dataset.id,)).fetchone()
        self.baseline = tuple(row) if row else None
        for table in ('samples', 'annotations', 'import_issues'):
            connection.execute(f'CREATE TEMP TABLE "{table}" AS SELECT * FROM main."{table}" WHERE 0')
        connection.execute('CREATE UNIQUE INDEX temp.scan_sample_identity ON samples(dataset_id,relative_path)')
        connection.execute('CREATE UNIQUE INDEX temp.scan_annotation_identity ON annotations(annotation_id)')
        connection.execute('CREATE TEMP TABLE scan_seen(sample_id TEXT PRIMARY KEY)')
        connection.execute('CREATE TEMP TABLE scan_excluded(sample_id TEXT PRIMARY KEY)')
        self.pixels = PixelScan(connection, cache_bytes=pixel_cache_bytes, force=force_pixels)
        if config.dataset.format == 'folder_classification':
            from iad_core.dataset.folder_rules import FolderRules
            rules = FolderRules(config.folder_rules)
            excluded = []
            for row in connection.execute('SELECT sample_id,relative_path FROM main.samples WHERE dataset_id=?', (config.dataset.id,)):
                rule = rules.resolve(PurePosixPath(row['relative_path']).parent.as_posix())
                if rule and rule.role == 'excluded':
                    excluded.append((row['sample_id'],))
            connection.executemany('INSERT INTO scan_excluded VALUES(?)', excluded)

    def publish(self, db: Database, config: DatasetConfig) -> int:
        conn = self.connection
        conn.commit()
        conn.execute('BEGIN IMMEDIATE')
        row = conn.execute('SELECT config_json,scan_ref FROM datasets WHERE dataset_id=?', (config.dataset.id,)).fetchone()
        if (tuple(row) if row else None) != self.baseline:
            raise ValueError('数据集配置在扫描期间发生变化，请重新扫描')
        DatasetRegistry(db).save(config, connection=conn)
        conn.execute("""INSERT INTO inspection_tasks(task_id,product,station,camera,inspection_target,description)
            VALUES(?,?,?,?,?,?) ON CONFLICT(task_id) DO UPDATE SET product=excluded.product,
            station=excluded.station,camera=excluded.camera,inspection_target=excluded.inspection_target,
            description=excluded.description,updated_at=CURRENT_TIMESTAMP""",
            (config.task.task_id, config.task.product, config.task.station, config.task.camera,
             config.task.inspection_target, config.task.description))
        conn.execute('DELETE FROM main.import_issues WHERE dataset_id=?', (config.dataset.id,))
        conn.execute('DELETE FROM main.annotations WHERE sample_id IN (SELECT sample_id FROM scan_seen)')
        conn.execute('UPDATE main.samples SET is_excluded=EXISTS(SELECT 1 FROM scan_excluded e WHERE e.sample_id=samples.sample_id) WHERE dataset_id=?', (config.dataset.id,))
        for table, identity in [('samples', ('dataset_id', 'relative_path')), ('annotations', ('annotation_id',)), ('import_issues', ())]:
            columns = [row['name'] for row in conn.execute(f'PRAGMA main.table_info("{table}")')
                       if row['name'] not in ('id', 'created_at', 'updated_at')]
            names = ','.join(f'"{name}"' for name in columns)
            statement = f'INSERT INTO main."{table}"({names}) SELECT {names} FROM temp."{table}" WHERE 1'
            if identity:
                change_cols = [c for c in columns if c not in (*identity, 'sample_id')]
                updates = [f'"{name}"=excluded."{name}"' for name in change_cols]
                updates.append("updated_at=(strftime('%Y-%m-%dT%H:%M:%fZ','now'))")
                change_predicates = [f'main."{table}"."{name}" IS NOT excluded."{name}"' for name in change_cols]
                where_clause = f' WHERE {" OR ".join(change_predicates)}' if change_predicates else ''
                statement += f' ON CONFLICT({",".join(identity)}) DO UPDATE SET {",".join(updates)}{where_clause}'
            conn.execute(statement)
        missing = conn.execute("""INSERT INTO main.import_issues(task_id,dataset_id,sample_id,issue_type,severity,message)
            SELECT task_id,dataset_id,sample_id,'MISSING_IMAGE','ERROR','Previously registered image is absent from the scanned directory'
            FROM main.samples s WHERE dataset_id=? AND is_excluded=0 AND NOT EXISTS(SELECT 1 FROM scan_seen v WHERE v.sample_id=s.sample_id)""",
            (config.dataset.id,))
        self.pixel_index = self.pixels.publish(config.dataset.id)
        return missing.rowcount
