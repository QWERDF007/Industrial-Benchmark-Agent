from sqlite3 import Connection

from iad_core.dataset.registry import DatasetRegistry
from iad_core.storage.database import Database
from iad_core.task.config import DatasetConfig


class ScanSnapshot:
    """Stage source parsing privately, then publish current imports in one short transaction."""

    def __init__(self, connection: Connection, config: DatasetConfig):
        self.connection = connection
        row = connection.execute('SELECT config_json FROM datasets WHERE dataset_id=?', (config.dataset.id,)).fetchone()
        self.baseline = row['config_json'] if row else None
        for table in ('samples', 'annotations', 'import_issues'):
            connection.execute(f'CREATE TEMP TABLE "{table}" AS SELECT * FROM main."{table}" WHERE 0')
        connection.execute('CREATE UNIQUE INDEX temp.scan_sample_identity ON samples(dataset_id,relative_path)')
        connection.execute('CREATE UNIQUE INDEX temp.scan_annotation_identity ON annotations(annotation_id)')
        connection.execute('CREATE TEMP TABLE scan_seen(sample_id TEXT PRIMARY KEY)')

    def publish(self, db: Database, config: DatasetConfig) -> int:
        conn = self.connection
        conn.commit()
        conn.execute('BEGIN IMMEDIATE')
        row = conn.execute('SELECT config_json FROM datasets WHERE dataset_id=?', (config.dataset.id,)).fetchone()
        if (row['config_json'] if row else None) != self.baseline:
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
        for table, identity in [('samples', ('dataset_id', 'relative_path')), ('annotations', ('annotation_id',)), ('import_issues', ())]:
            columns = [row['name'] for row in conn.execute(f'PRAGMA main.table_info("{table}")')
                       if row['name'] not in ('id', 'created_at', 'updated_at')]
            names = ','.join(f'"{name}"' for name in columns)
            statement = f'INSERT INTO main."{table}"({names}) SELECT {names} FROM temp."{table}" WHERE 1'
            if identity:
                updates = [f'"{name}"=excluded."{name}"' for name in columns if name not in (*identity, 'sample_id')]
                updates.append('updated_at=CURRENT_TIMESTAMP')
                statement += f' ON CONFLICT({",".join(identity)}) DO UPDATE SET {",".join(updates)}'
            conn.execute(statement)
        missing = conn.execute("""INSERT INTO main.import_issues(task_id,dataset_id,sample_id,issue_type,severity,message)
            SELECT task_id,dataset_id,sample_id,'MISSING_IMAGE','ERROR','Previously registered image is absent from the scanned directory'
            FROM main.samples s WHERE dataset_id=? AND NOT EXISTS(SELECT 1 FROM scan_seen v WHERE v.sample_id=s.sample_id)""",
            (config.dataset.id,))
        return missing.rowcount
