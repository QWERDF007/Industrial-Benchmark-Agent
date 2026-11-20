import shutil
from pathlib import Path
from sqlite3 import Connection


class JobArtifacts:
    """Retire job session directories only after their database deletion commits."""

    MODULES = ('consistency', 'audit', 'knowledge', 'exploration')

    def __init__(self, db_path: str):
        self.root = Path(db_path).resolve().parent

    @staticmethod
    def initialize(connection: Connection) -> None:
        connection.execute('CREATE TABLE IF NOT EXISTS job_artifact_deletions(run_id TEXT PRIMARY KEY)')
        connection.execute('''CREATE TRIGGER IF NOT EXISTS retire_job_artifacts AFTER DELETE ON job_runs
            BEGIN INSERT OR IGNORE INTO job_artifact_deletions(run_id) VALUES(OLD.job_id); END''')

    def collect(self, connection: Connection) -> None:
        if not connection.execute("SELECT 1 FROM sqlite_master WHERE name='job_artifact_deletions' AND type='table'").fetchone():
            return
        if not connection.execute('SELECT 1 FROM job_artifact_deletions LIMIT 1').fetchone():
            return
        connection.execute('BEGIN IMMEDIATE')
        directories = [directory for module in self.MODULES
            for directory in (self.root / (module + '-sessions')).glob('*') if directory.is_dir()]
        retired = {row[0] for row in connection.execute('SELECT run_id FROM job_artifact_deletions')}
        for run_id in retired:
            if Path(run_id).name != run_id or run_id in ('.', '..'):
                raise ValueError('作业ID不能包含路径')
        for directory in directories:
            for owned in directory.iterdir():
                if owned.name in retired and owned.is_dir():
                    shutil.rmtree(owned)
        connection.executemany('DELETE FROM job_artifact_deletions WHERE run_id=?', [(run_id,) for run_id in retired])
        connection.commit()
