from sqlite3 import Connection


def _projection(conn: Connection, name: str, source: str, key: str, fields: tuple[str, ...],
                query: str, updates: str) -> None:
    """Maintain an indexed projection of canonical JSON in the source transaction."""
    exists = conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (name,)).fetchone()
    definition = f'CREATE VIEW {name}_source AS {query}'
    current = conn.execute("SELECT sql FROM sqlite_master WHERE type='view' AND name=?", (name+'_source',)).fetchone()
    changed = current is None or ' '.join(current[0].split()) != ' '.join(definition.split())
    if changed:
        conn.execute(f'DROP VIEW IF EXISTS {name}_source')
        conn.execute(definition)
    columns = ','.join(fields)
    conn.execute(f'''CREATE TABLE IF NOT EXISTS {name}(
        source_id TEXT NOT NULL REFERENCES {source}({key}) ON DELETE CASCADE,
        {','.join(field + ' TEXT NOT NULL' for field in fields)},PRIMARY KEY(source_id,{columns}))''')
    conn.execute(f'CREATE INDEX IF NOT EXISTS idx_{name}_lookup ON {name}({columns},source_id)')
    insert = f'''INSERT INTO {name} SELECT * FROM {name}_source WHERE source_id=NEW.{key}
        ON CONFLICT(source_id,{columns}) DO NOTHING;'''
    definitions = {
        'insert': f'CREATE TRIGGER {name}_insert AFTER INSERT ON {source} BEGIN {insert} END',
        'update': f'''CREATE TRIGGER {name}_update AFTER UPDATE OF {updates} ON {source}
            BEGIN DELETE FROM {name} WHERE source_id=OLD.{key}; {insert} END''',
    }
    for suffix, statement in definitions.items():
        trigger_name = name + '_' + suffix
        previous = conn.execute("SELECT sql FROM sqlite_master WHERE name=? AND type='trigger'", (trigger_name,)).fetchone()
        if previous is None or ' '.join(previous[0].split()) != ' '.join(statement.split()):
            conn.execute(f'DROP TRIGGER IF EXISTS {trigger_name}')
            conn.execute(statement)
    if not exists or changed:
        conn.execute(f'DELETE FROM {name}')
        conn.execute(f'INSERT INTO {name} SELECT * FROM {name}_source')


def initialize_deletion_indexes(conn: Connection) -> None:
    if not conn.in_transaction:
        conn.execute('BEGIN IMMEDIATE')
    conn.execute('DROP VIEW IF EXISTS job_consistency_evidence')
    conn.execute('''CREATE VIEW job_consistency_evidence AS
        SELECT job_id,evidence_id FROM consistency_anchor_evidence
        UNION ALL SELECT job_id,json_extract(value,'$.evidence_id')
            FROM audit_sample_runs,json_each(consistency_json,'$.evidence')
        UNION ALL SELECT job_id,json_extract(value,'$.evidence_id')
            FROM audit_sample_runs,json_each(consistency_json,'$.captured_evidence')
        UNION ALL SELECT job_id,json_extract(value,'$.evidence_id')
            FROM audit_upstream_records,json_each(record_json,'$.evidence')
        UNION ALL SELECT c.run_id,r.evidence_id FROM audit_evidence_references r
            JOIN audit_consistency_checks c ON c.check_id=r.source_id''')
    _projection(conn, 'job_dataset_scopes', 'job_requests', 'job_id', ('dataset_id', 'kind'), '''
        SELECT job_id AS source_id,
            COALESCE(json_extract(request_json,'$.dataset_id'),json_extract(payload_json,'$.dataset_id')) AS dataset_id,
            'direct' AS kind FROM job_run_requests WHERE dataset_id IS NOT NULL
        UNION SELECT job_id,value,'workflow' FROM job_run_requests,json_each(request_json,'$.dataset_ids')
            WHERE job_type IN ('ANALYSIS_WORKFLOW','MODEL_AUDIT') AND value IS NOT NULL
        UNION SELECT job_id,value,'consistency' FROM job_run_requests,
            json_each(request_json,'$.consistency_check.scopes.subjects.dataset_ids')
            WHERE job_type='ANALYSIS_WORKFLOW' AND value IS NOT NULL
        UNION SELECT job_id,value,'consistency' FROM job_run_requests,
            json_each(request_json,'$.consistency_check.scopes.corpus.dataset_ids')
            WHERE job_type='ANALYSIS_WORKFLOW' AND value IS NOT NULL
        UNION SELECT job_id,value,'consistency' FROM job_run_requests,json_tree(request_json,'$.frozen_group')
            WHERE job_type='CONSISTENCY_ANALYSIS' AND key='dataset_id' AND value IS NOT NULL
        UNION SELECT job_id,value,'consistency' FROM job_run_requests,json_tree(request_json,'$.consistency_scopes')
            WHERE job_type='CONSISTENCY_MODEL_BATCH' AND key='dataset_id' AND value IS NOT NULL
        ''', 'request_json')
    _projection(conn, 'job_ownership_edges', 'job_runs', 'job_id', ('parent_id', 'child_id'), '''
        SELECT job_id AS source_id,job_id AS parent_id,value AS child_id
            FROM job_runs,json_each(payload_json,'$.batch_runs') WHERE value IS NOT NULL
        UNION SELECT job_id,json_extract(payload_json,'$.parent_run_id'),job_id FROM job_runs
            WHERE json_extract(payload_json,'$.parent_run_id') IS NOT NULL
        ''', 'payload_json')
    _projection(conn, 'job_index_batches', 'job_runs', 'job_id', ('batch_id',), '''
        SELECT job_id AS source_id,json_extract(payload_json,'$.index_batch_id') AS batch_id
            FROM job_runs WHERE batch_id IS NOT NULL
        ''', 'payload_json')
    _projection(conn, 'consistency_run_datasets', 'consistency_runs', 'batch_id', ('dataset_id',), '''
        SELECT batch_id AS source_id,value AS dataset_id FROM consistency_runs,json_each(plan_json,'$.scopes.subjects.dataset_ids')
            WHERE value IS NOT NULL
        UNION SELECT batch_id,value FROM consistency_runs,json_each(plan_json,'$.scopes.corpus.dataset_ids')
            WHERE value IS NOT NULL
        ''', 'plan_json')
    _projection(conn, 'consistency_query_datasets', 'consistency_queries', 'query_id', ('dataset_id',), '''
        SELECT query_id AS source_id,value AS dataset_id FROM consistency_queries,json_each(snapshot_json,'$.scopes.subjects.dataset_ids')
            WHERE value IS NOT NULL
        UNION SELECT query_id,value FROM consistency_queries,json_each(snapshot_json,'$.scopes.corpus.dataset_ids')
            WHERE value IS NOT NULL
        ''', 'snapshot_json')
    _projection(conn, 'audit_evidence_references', 'audit_consistency_checks', 'check_id', ('evidence_id',), '''
        SELECT check_id AS source_id,json_extract(value,'$.evidence_id') AS evidence_id
            FROM audit_consistency_checks,json_each(record_json,'$.references') WHERE evidence_id IS NOT NULL
        GROUP BY check_id,evidence_id
        ''', 'record_json')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_consistency_run_root ON consistency_runs(root_batch_id,batch_id)')
    conn.execute("CREATE INDEX IF NOT EXISTS idx_evidence_left_dataset ON consistency_results(json_extract(snapshot_json,'$.sources.left.sample.dataset_id'),evidence_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_evidence_right_dataset ON consistency_results(json_extract(snapshot_json,'$.sources.right.sample.dataset_id'),evidence_id)")
