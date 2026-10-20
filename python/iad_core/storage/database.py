import os
import sqlite3
from typing import Optional
from contextlib import contextmanager


class Database:
    """
    SQLite Database Manager for Industrial Benchmark Agent v2.
    Schema v2 includes all 13 core and execution tables.
    """
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
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON inspection_tasks(task_id)")

            # 2. samples
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
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_quality ON samples(quality_status)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_batch_id ON samples(batch_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_origin ON samples(data_origin)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_samples_physical ON samples(physical_sample_id)")

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
                mask_sha256 TEXT,
                geometry_status TEXT DEFAULT 'VALID',
                source TEXT NOT NULL DEFAULT 'imported',
                source_width INTEGER,
                source_height INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_annos_sample_id ON annotations(sample_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_annos_phenomenon ON annotations(phenomenon)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_annos_geometry ON annotations(geometry_status)")
            annotation_columns = {row[1] for row in cursor.execute("PRAGMA table_info(annotations)")}
            if "mask_sha256" not in annotation_columns:
                cursor.execute("ALTER TABLE annotations ADD COLUMN mask_sha256 TEXT")

            # 4. import_issues
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS import_issues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT NOT NULL,
                dataset_id TEXT DEFAULT 'UNKNOWN',
                sample_id TEXT,
                issue_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            cursor.execute("CREATE INDEX IF NOT EXISTS idx_issues_task_id ON import_issues(task_id)")

            # Migration: ensure dataset_id column exists on legacy databases
            cursor.execute("PRAGMA table_info(import_issues)")
            existing_issue_cols = {col[1] for col in cursor.fetchall()}
            if "dataset_id" not in existing_issue_cols:
                cursor.execute("ALTER TABLE import_issues ADD COLUMN dataset_id TEXT DEFAULT 'UNKNOWN'")

            # 5. feature_records
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

            # 6. review_sessions
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS review_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE NOT NULL,
                task_id TEXT NOT NULL,
                reviewer TEXT NOT NULL,
                started_at TIMESTAMP,
                submitted_at TIMESTAMP,
                total_reviewed INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_task_id ON review_sessions(task_id)")

            # 7. review_decisions
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS review_decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sample_id TEXT NOT NULL,
                decision TEXT NOT NULL,
                reviewer TEXT NOT NULL DEFAULT 'default',
                reason_code TEXT,
                comment TEXT,
                evidence_version TEXT DEFAULT 'v2',
                review_session_id TEXT,
                started_at TIMESTAMP,
                submitted_at TIMESTAMP,
                review_duration_ms INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(sample_id, reviewer)
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_review_sample_id ON review_decisions(sample_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_review_decision ON review_decisions(decision)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_review_session ON review_decisions(review_session_id)")

            # 8. gold_records
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS gold_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sample_id TEXT NOT NULL,
                task_id TEXT NOT NULL,
                policy_name TEXT NOT NULL,
                gold_quality TEXT NOT NULL,
                binary_label TEXT,
                hard_normal BOOLEAN DEFAULT 0,
                gold_source TEXT NOT NULL,
                gold_source_ref TEXT,
                gold_status TEXT NOT NULL,
                provenance_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(sample_id, policy_name)
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_gold_sample_id ON gold_records(sample_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_gold_task_id ON gold_records(task_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_gold_status ON gold_records(gold_status)")

            # 9. benchmark_builds
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS benchmark_builds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                build_id TEXT UNIQUE NOT NULL,
                task_id TEXT NOT NULL,
                gold_policy TEXT NOT NULL,
                split_policy TEXT NOT NULL,
                seed INTEGER NOT NULL,
                status TEXT NOT NULL,
                output_dir TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_builds_task_id ON benchmark_builds(task_id)")

            # 10. split_assignments
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS split_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                build_id TEXT NOT NULL,
                sample_id TEXT NOT NULL,
                split_group_id TEXT NOT NULL,
                split_name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(build_id, sample_id)
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_split_build_id ON split_assignments(build_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_split_sample_id ON split_assignments(sample_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_split_group_id ON split_assignments(split_group_id)")

            # 11. evaluation_runs
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS evaluation_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT UNIQUE NOT NULL,
                task_id TEXT NOT NULL,
                build_id TEXT NOT NULL,
                model_id TEXT NOT NULL,
                threshold_strategy TEXT NOT NULL,
                metrics_json TEXT,
                status TEXT NOT NULL,
                output_dir TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_eval_task_id ON evaluation_runs(task_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_eval_build_id ON evaluation_runs(build_id)")

            # 12. job_runs
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS job_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT UNIQUE NOT NULL,
                task_id TEXT NOT NULL,
                job_type TEXT NOT NULL,
                status TEXT NOT NULL,
                progress REAL DEFAULT 0.0,
                message TEXT,
                artifact_dir TEXT,
                started_at TIMESTAMP,
                finished_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_task_id ON job_runs(task_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_runs(status)")

            # 13. agent_runs
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS agent_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT UNIQUE NOT NULL,
                task_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                goal TEXT NOT NULL,
                status TEXT NOT NULL,
                final_artifact TEXT,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                finished_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_agent_runs_task ON agent_runs(task_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_agent_runs_session ON agent_runs(session_id)")

            # 14. audit_suggestions (Non-authoritative multimodal LLM advice, Tickets RP-14, S08)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_suggestions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                suggestion_id TEXT UNIQUE NOT NULL,
                task_id TEXT NOT NULL,
                sample_id TEXT,
                session_id TEXT,
                model_route TEXT,
                observations_json TEXT,
                hypotheses_json TEXT,
                evidence_refs_json TEXT,
                conclusion_status TEXT NOT NULL,
                recommended_action TEXT NOT NULL,
                input_modalities_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_suggestions_task ON audit_suggestions(task_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_suggestions_sample ON audit_suggestions(sample_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_suggestions_session ON audit_suggestions(session_id)")
            columns = {row[1] for row in cursor.execute("PRAGMA table_info(audit_suggestions)")}
            for column, definition in {
                "confidence": "REAL",
                "reference_sample_ids_json": "TEXT NOT NULL DEFAULT '[]'",
                "audit_run_id": "TEXT",
                "analysis_json": "TEXT",
            }.items():
                if column not in columns:
                    cursor.execute(f"ALTER TABLE audit_suggestions ADD COLUMN {column} {definition}")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_issues_sample ON import_issues(sample_id)")
            job_columns = {row[1] for row in cursor.execute("PRAGMA table_info(job_runs)")}
            if "payload_json" not in job_columns:
                cursor.execute("ALTER TABLE job_runs ADD COLUMN payload_json TEXT NOT NULL DEFAULT '{}'")
            session_columns = {row[1] for row in cursor.execute("PRAGMA table_info(review_sessions)")}
            if "dataset_id" not in session_columns:
                cursor.execute("ALTER TABLE review_sessions ADD COLUMN dataset_id TEXT")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS datasets (
                    dataset_id TEXT PRIMARY KEY,
                    task_id TEXT NOT NULL,
                    config_json TEXT NOT NULL,
                    reference_sample_ids_json TEXT NOT NULL DEFAULT '[]',
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS normal_profiles (
                    profile_id TEXT PRIMARY KEY,
                    dataset_id TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    signature TEXT NOT NULL UNIQUE,
                    profile_json TEXT NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS knowledge_versions (
                    version_id TEXT PRIMARY KEY,
                    dataset_id TEXT NOT NULL REFERENCES datasets(dataset_id),
                    kind TEXT NOT NULL CHECK(kind IN ('normal','defect')),
                    parent_version_id TEXT REFERENCES knowledge_versions(version_id),
                    normal_version_id TEXT REFERENCES knowledge_versions(version_id),
                    signature TEXT NOT NULL,
                    snapshot_json TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_knowledge_dataset_kind ON knowledge_versions(dataset_id,kind,created_at)")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS knowledge_heads (
                    dataset_id TEXT NOT NULL REFERENCES datasets(dataset_id),
                    kind TEXT NOT NULL CHECK(kind IN ('normal','defect')),
                    version_id TEXT NOT NULL REFERENCES knowledge_versions(version_id),
                    PRIMARY KEY(dataset_id,kind)
                )
            """)
