import json
import sqlite3


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
