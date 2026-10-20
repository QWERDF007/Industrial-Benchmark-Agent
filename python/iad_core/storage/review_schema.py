import sqlite3


def init_review_schema(conn: sqlite3.Connection) -> None:
    conn.execute("""CREATE TABLE IF NOT EXISTS review_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        task_id TEXT NOT NULL,
        reviewer TEXT NOT NULL,
        started_at TIMESTAMP,
        submitted_at TIMESTAMP,
        total_reviewed INTEGER DEFAULT 0,
        dataset_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    if "dataset_id" not in {row[1] for row in conn.execute("PRAGMA table_info(review_sessions)")}:
        conn.execute("ALTER TABLE review_sessions ADD COLUMN dataset_id TEXT")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_sessions_task_id ON review_sessions(task_id)")

    columns = {row[1] for row in conn.execute("PRAGMA table_info(review_decisions)")}
    migrate = bool(columns) and "decision_id" not in columns
    if migrate:
        conn.execute("ALTER TABLE review_decisions RENAME TO review_decisions_legacy")
    conn.execute("""CREATE TABLE IF NOT EXISTS review_decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        decision_id TEXT UNIQUE NOT NULL DEFAULT (lower(hex(randomblob(16)))),
        sample_id TEXT NOT NULL,
        decision TEXT NOT NULL,
        reviewer TEXT NOT NULL DEFAULT 'default',
        reason_code TEXT,
        comment TEXT,
        evidence_version TEXT DEFAULT 'v2',
        review_session_id TEXT,
        started_at TIMESTAMP,
        submitted_at TIMESTAMP,
        review_duration_ms INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    if migrate:
        conn.execute("""INSERT INTO review_decisions (
            id,sample_id,decision,reviewer,reason_code,comment,evidence_version,
            review_session_id,started_at,submitted_at,review_duration_ms,created_at,updated_at
        ) SELECT id,sample_id,decision,reviewer,reason_code,comment,evidence_version,
            review_session_id,started_at,submitted_at,COALESCE(review_duration_ms,0),created_at,updated_at
            FROM review_decisions_legacy""")
        conn.execute("DROP TABLE review_decisions_legacy")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_review_sample_id ON review_decisions(sample_id,reviewer,id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_review_decision ON review_decisions(decision)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_review_session ON review_decisions(review_session_id)")
    conn.execute("""CREATE VIEW IF NOT EXISTS current_review_decisions AS
        SELECT * FROM (
            SELECT *,ROW_NUMBER() OVER(PARTITION BY sample_id,reviewer
                ORDER BY COALESCE(submitted_at,updated_at) DESC,id DESC) AS revision_position
            FROM review_decisions
        ) WHERE revision_position=1""")
