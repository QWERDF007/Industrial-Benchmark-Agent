import os
import sqlite3
from typing import Optional
from contextlib import contextmanager


class Database:
    def __init__(self, db_path: str = "data/benchmark.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
        self.init_schema()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode = WAL")
        conn.execute("PRAGMA synchronous = NORMAL")
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    @contextmanager
    def connection(self):
        conn = self.get_connection()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def init_schema(self):
        with self.connection() as conn:
            cursor = conn.cursor()
            # 1. inspection_tasks
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS inspection_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT UNIQUE NOT NULL,
                product TEXT,
                station TEXT,
                camera TEXT,
                inspection_target TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            # 2. samples
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sample_id TEXT UNIQUE NOT NULL,
                task_id TEXT NOT NULL,
                dataset_id TEXT,
                image_path TEXT NOT NULL,
                relative_path TEXT NOT NULL,
                physical_sample_id TEXT,
                capture_sequence_id TEXT,
                batch_id TEXT,
                station TEXT,
                camera TEXT,
                width INTEGER NOT NULL,
                height INTEGER NOT NULL,
                quality_status TEXT NOT NULL,
                quality_source TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(task_id, relative_path)
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_task_id ON samples(task_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_quality_status ON samples(quality_status)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_batch_id ON samples(batch_id)")

            # 3. annotations
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS annotations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                annotation_id TEXT UNIQUE NOT NULL,
                sample_id TEXT NOT NULL,
                annotation_type TEXT NOT NULL,
                raw_label TEXT NOT NULL,
                phenomenon TEXT,
                bbox_json TEXT,
                polygon_json TEXT,
                mask_path TEXT,
                source TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_annotations_sample_id ON annotations(sample_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_annotations_phenomenon ON annotations(phenomenon)")

            # 4. import_issues
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS import_issues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT,
                sample_id TEXT,
                issue_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_issues_task_id ON import_issues(task_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_issues_type ON import_issues(issue_type)")
