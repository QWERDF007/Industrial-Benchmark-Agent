import json
import sqlite3


def migrate_job_requests(conn: sqlite3.Connection) -> None:
    exists = conn.execute("SELECT 1 FROM sqlite_master WHERE name='job_requests' AND type='table'").fetchone()
    conn.execute('''CREATE TABLE IF NOT EXISTS job_requests(
        job_id TEXT PRIMARY KEY REFERENCES job_runs(job_id) ON DELETE CASCADE,
        request_json TEXT NOT NULL CHECK(json_valid(request_json)))''')
    if not exists:
        conn.execute("""INSERT INTO job_requests SELECT job_id,COALESCE(json_extract(payload_json,'$.request'),'{}')
            FROM job_runs""")
        conn.execute("""UPDATE job_runs SET payload_json=json_remove(payload_json,'$.request')
            WHERE json_type(payload_json,'$.request') IS NOT NULL""")
        for name in ('idx_jobs_queue', 'idx_jobs_submission', 'idx_jobs_analysis_request', 'idx_jobs_analysis_group'):
            conn.execute('DROP INDEX IF EXISTS ' + name)
    conn.execute('''CREATE VIEW IF NOT EXISTS job_run_requests AS
        SELECT j.*,r.request_json FROM job_runs j JOIN job_requests r USING(job_id)''')
    conn.execute('''CREATE TRIGGER IF NOT EXISTS capture_job_request AFTER INSERT ON job_runs BEGIN
        INSERT INTO job_requests VALUES(NEW.job_id,COALESCE(json_extract(NEW.payload_json,'$.request'),'{}'));
        UPDATE job_runs SET payload_json=json_remove(payload_json,'$.request') WHERE job_id=NEW.job_id;
        END''')
    conn.execute('''CREATE TRIGGER IF NOT EXISTS immutable_job_request BEFORE UPDATE ON job_requests BEGIN
        SELECT RAISE(ABORT,'Job request is immutable'); END''')


def migrate_audit_jobs(conn: sqlite3.Connection) -> None:
    rows = conn.execute("""SELECT job_id,payload_json FROM job_runs
        WHERE job_type='MODEL_AUDIT'
        AND json_type(payload_json,'$.request') IS NULL
        AND json_extract(payload_json,'$.root_run_id') IS NULL
        AND json_type(payload_json,'$.sample_ids')='array'""").fetchall()
    for run_id, raw in rows:
        payload = json.loads(raw)
        sample_ids = payload['sample_ids']
        scope = set(sample_ids)
        completed = {row[0] for row in conn.execute(
            'SELECT DISTINCT sample_id FROM audit_suggestions WHERE audit_run_id=?', (run_id,))}
        failed = {error['sample_id'] for error in payload['errors']}
        if (len(scope) != payload['total_samples'] or len(scope) != len(sample_ids)
                or len(completed) != payload['completed'] or len(failed) != payload['failed']
                or not (completed | failed).issubset(scope) or completed & failed):
            raise ValueError(f'历史审计作业 {run_id} 的样本记录与计数不一致，无法迁移')
        payload.update(root_run_id=run_id,
            completed_sample_ids=[sid for sid in sample_ids if sid in completed],
            failed_sample_ids=[sid for sid in sample_ids if sid in failed])
        conn.execute('UPDATE job_runs SET payload_json=? WHERE job_id=?',
            (json.dumps(payload, ensure_ascii=False), run_id))
