from sqlite3 import Connection


def initialize_audit_schema(connection: Connection):
    connection.execute('''CREATE TABLE IF NOT EXISTS audit_workflow_runs (
        job_id TEXT PRIMARY KEY REFERENCES job_runs(job_id) ON DELETE CASCADE,
        snapshot_json TEXT NOT NULL, summary_json TEXT, report_html TEXT)''')
    connection.execute('''CREATE TABLE IF NOT EXISTS audit_sample_runs (
        job_id TEXT NOT NULL REFERENCES audit_workflow_runs(job_id) ON DELETE CASCADE,
        sample_id TEXT NOT NULL REFERENCES samples(sample_id), ordinal INTEGER NOT NULL,
        session_id TEXT NOT NULL UNIQUE, session_created INTEGER NOT NULL DEFAULT 0,
        state TEXT NOT NULL, consistency_json TEXT NOT NULL, result_json TEXT,
        commit_key TEXT, submission_json TEXT, PRIMARY KEY(job_id,sample_id), UNIQUE(job_id,ordinal))''')
    connection.execute('''CREATE TABLE IF NOT EXISTS audit_sample_media (
        job_id TEXT NOT NULL, target_id TEXT NOT NULL, media_key TEXT NOT NULL,
        sample_id TEXT NOT NULL REFERENCES samples(sample_id),
        media_json TEXT NOT NULL, PRIMARY KEY(job_id,target_id,media_key),
        FOREIGN KEY(job_id,target_id) REFERENCES audit_sample_runs(job_id,sample_id) ON DELETE CASCADE)''')
    connection.execute('''CREATE TABLE IF NOT EXISTS audit_media_deliveries (
        job_id TEXT NOT NULL, target_id TEXT NOT NULL,
        call_id TEXT NOT NULL REFERENCES model_calls(call_id) ON DELETE CASCADE, evidence_id TEXT NOT NULL,
        PRIMARY KEY(job_id,target_id,call_id,evidence_id),
        FOREIGN KEY(job_id,target_id) REFERENCES audit_sample_runs(job_id,sample_id) ON DELETE CASCADE)''')

    connection.execute("""CREATE TABLE IF NOT EXISTS audit_report_runs (
        job_id TEXT PRIMARY KEY REFERENCES audit_workflow_runs(job_id) ON DELETE CASCADE,
        session_id TEXT NOT NULL UNIQUE, session_created INTEGER NOT NULL DEFAULT 0,
        state TEXT NOT NULL DEFAULT 'PENDING', generation INTEGER NOT NULL DEFAULT 1, groups_json TEXT NOT NULL DEFAULT '[]',
        result_json TEXT, error TEXT)""")
    connection.execute("""CREATE TABLE IF NOT EXISTS audit_report_commits (
        job_id TEXT NOT NULL REFERENCES audit_report_runs(job_id) ON DELETE CASCADE,
        commit_key TEXT NOT NULL, submission_json TEXT NOT NULL,
        PRIMARY KEY(job_id,commit_key))""")

    if 'generation' not in {row[1] for row in connection.execute('PRAGMA table_info(audit_report_runs)')}:
        connection.execute('ALTER TABLE audit_report_runs ADD COLUMN generation INTEGER NOT NULL DEFAULT 1')
    connection.execute('''CREATE TABLE IF NOT EXISTS audit_report_reads (
        job_id TEXT NOT NULL REFERENCES audit_report_runs(job_id) ON DELETE CASCADE,
        generation INTEGER NOT NULL, call_id TEXT NOT NULL REFERENCES model_calls(call_id) ON DELETE CASCADE,
        sample_id TEXT NOT NULL, PRIMARY KEY(job_id,generation,call_id,sample_id))''')
    connection.execute('''CREATE TABLE IF NOT EXISTS audit_image_commits (
        job_id TEXT NOT NULL, sample_id TEXT NOT NULL, commit_key TEXT NOT NULL,
        submission_json TEXT NOT NULL, PRIMARY KEY(job_id,sample_id,commit_key),
        FOREIGN KEY(job_id,sample_id) REFERENCES audit_sample_runs(job_id,sample_id) ON DELETE CASCADE)''')
