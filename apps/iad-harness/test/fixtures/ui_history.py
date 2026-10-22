"""Terminal job history for UI volume tests; no model requests are executed."""
import json
import sqlite3
import sys
from datetime import datetime, timezone

with sqlite3.connect(sys.argv[1]) as conn:
    dataset_id = sys.argv[2]
    task_id = conn.execute('SELECT task_id FROM datasets WHERE dataset_id=?', (dataset_id,)).fetchone()[0]
    sample_id = conn.execute('SELECT sample_id FROM samples WHERE dataset_id=? LIMIT 1', (dataset_id,)).fetchone()[0]
    now = datetime.now(timezone.utc).isoformat()
    for index in range(1000):
        run_id = f'knowledge_ui_fixture_{index:04d}'
        payload = {'request': {'dataset_id': dataset_id, 'sample_ids': [sample_id], 'kind': 'normal', 'model_name': 'fixture-mllm'},
                   'root_run_id': run_id, 'parent_run_id': None, 'completed': 0, 'failed': 0,
                   'errors': [], 'completed_sample_ids': [], 'failed_sample_ids': [], 'total_samples': 1,
                   'cancel_requested': True}
        conn.execute('''INSERT INTO job_runs(job_id,task_id,job_type,status,progress,message,payload_json,started_at,finished_at)
                     VALUES(?,?,'NORMAL_KNOWLEDGE','CANCELLED',0,'已取消',?,?,?)''',
                     (run_id, task_id, json.dumps(payload), now, now))
