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

            # 2. samples (C01: UNIQUE(dataset_id, relative_path); C06: data_origin)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sample_id TEXT UNIQUE NOT NULL,
                task_id TEXT NOT NULL,
                dataset_id TEXT NOT NULL,
                image_path TEXT NOT NULL,
                relative_path TEXT NOT NULL,
                data_origin TEXT DEFAULT 'UNKNOWN',
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
                UNIQUE(dataset_id, relative_path)
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_task_id ON samples(task_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_dataset_id ON samples(dataset_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_quality_status ON samples(quality_status)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_batch_id ON samples(batch_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_origin ON samples(data_origin)")

            # 3. annotations (C03: geometry_status, source_width, source_height)
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
                geometry_status TEXT DEFAULT 'VALID',
                source_width INTEGER,
                source_height INTEGER,
                source TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_annotations_sample_id ON annotations(sample_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_annotations_phenomenon ON annotations(phenomenon)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_annotations_geometry_status ON annotations(geometry_status)")

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

            # 5. feature_records (Step 2 Feature Cache)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS feature_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sample_id TEXT NOT NULL,
                model_id TEXT NOT NULL,
                preprocess_key TEXT NOT NULL,
                dim INTEGER NOT NULL,
                dtype TEXT NOT NULL,
                embedding_blob BLOB NOT NULL,
                source_file_size INTEGER,
                source_mtime_ns INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(sample_id, model_id, preprocess_key)
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_features_sample_id ON feature_records(sample_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_features_lookup ON feature_records(sample_id, model_id, preprocess_key)")

            # 6. review_decisions (Step 3 Human Review Decisions)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS review_decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sample_id TEXT NOT NULL,
                decision TEXT NOT NULL,
                reviewer TEXT NOT NULL DEFAULT 'default',
                reason_code TEXT,
                comment TEXT,
                evidence_version TEXT DEFAULT 'v1',
                review_duration_ms INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(sample_id, reviewer)
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_review_sample_id ON review_decisions(sample_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_review_decision ON review_decisions(decision)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_review_reviewer ON review_decisions(reviewer)")
