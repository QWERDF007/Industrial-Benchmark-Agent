from sqlite3 import Connection


def init_content_index_schema(connection: Connection) -> None:
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_identity_inputs (
        job_id TEXT NOT NULL,anchor_id TEXT NOT NULL,candidate_id TEXT NOT NULL,
        fingerprint TEXT NOT NULL,plan_json TEXT NOT NULL CHECK(json_valid(plan_json)),
        FOREIGN KEY(job_id,anchor_id) REFERENCES consistency_anchor_runs(job_id,anchor_id) ON DELETE CASCADE,
        PRIMARY KEY(job_id,anchor_id,candidate_id))''')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_identity_views (
        job_id TEXT NOT NULL,anchor_id TEXT NOT NULL,candidate_id TEXT NOT NULL,page_index INTEGER NOT NULL,
        fingerprint TEXT NOT NULL,record_json TEXT NOT NULL CHECK(json_valid(record_json)),
        FOREIGN KEY(job_id,anchor_id) REFERENCES consistency_anchor_runs(job_id,anchor_id) ON DELETE CASCADE,
        PRIMARY KEY(job_id,anchor_id,candidate_id,page_index))''')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_candidate_identity (
        job_id TEXT NOT NULL,anchor_id TEXT NOT NULL,candidate_id TEXT NOT NULL,
        record_json TEXT NOT NULL CHECK(json_valid(record_json)),
        FOREIGN KEY(job_id,anchor_id) REFERENCES consistency_anchor_runs(job_id,anchor_id) ON DELETE CASCADE,
        PRIMARY KEY(job_id,anchor_id,candidate_id))''')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_anchor_runs (
        job_id TEXT NOT NULL REFERENCES job_runs(job_id) ON DELETE CASCADE,
        anchor_id TEXT NOT NULL,ordinal INTEGER NOT NULL CHECK(ordinal>=0),
        session_id TEXT NOT NULL UNIQUE,session_created INTEGER NOT NULL DEFAULT 0 CHECK(session_created IN(0,1)),
        state TEXT NOT NULL CHECK(state IN ('PENDING','RUNNING','COMPLETED','FAILED','CANCELLED','INTERRUPTED')),
        phase TEXT NOT NULL,attempt INTEGER NOT NULL DEFAULT 1 CHECK(attempt>0),
        trace_state TEXT NOT NULL DEFAULT 'OPEN' CHECK(trace_state IN ('OPEN','PENDING','CLOSED')),
        trace_error TEXT,candidates_json TEXT CHECK(candidates_json IS NULL OR json_valid(candidates_json)),
        group_json TEXT CHECK(group_json IS NULL OR json_valid(group_json)),
        visual_plan_json TEXT CHECK(visual_plan_json IS NULL OR json_valid(visual_plan_json)),
        result_json TEXT CHECK(result_json IS NULL OR json_valid(result_json)),
        PRIMARY KEY(job_id,anchor_id),UNIQUE(job_id,ordinal))''')
    columns = {row[1] for row in connection.execute('PRAGMA table_info(consistency_anchor_runs)')}
    for column, definition in {
        'attempt': 'INTEGER NOT NULL DEFAULT 1 CHECK(attempt>0)',
        'trace_state': "TEXT NOT NULL DEFAULT 'OPEN' CHECK(trace_state IN ('OPEN','PENDING','CLOSED'))",
        'trace_error': 'TEXT',
        'visual_plan_json': 'TEXT CHECK(visual_plan_json IS NULL OR json_valid(visual_plan_json))',
    }.items():
        if column not in columns:
            connection.execute(f'ALTER TABLE consistency_anchor_runs ADD COLUMN {column} {definition}')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_candidate_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,job_id TEXT NOT NULL,anchor_id TEXT NOT NULL,candidate_id TEXT NOT NULL,
        submission_json TEXT NOT NULL CHECK(json_valid(submission_json)),
        FOREIGN KEY(job_id,anchor_id) REFERENCES consistency_anchor_runs(job_id,anchor_id) ON DELETE CASCADE)''')
    connection.execute('CREATE INDEX IF NOT EXISTS idx_candidate_assessments ON consistency_candidate_assessments(job_id,anchor_id,candidate_id,id)')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_group_decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,decision_id TEXT NOT NULL UNIQUE,client_request_id TEXT NOT NULL UNIQUE,
        job_id TEXT NOT NULL,anchor_id TEXT NOT NULL,result_fingerprint TEXT NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('CONFIRM_DIFFERENCE','REJECT_DIFFERENCE','NEEDS_CONTEXT')),
        request_sha256 TEXT NOT NULL,record_json TEXT NOT NULL CHECK(json_valid(record_json)),
        FOREIGN KEY(job_id,anchor_id) REFERENCES consistency_anchor_runs(job_id,anchor_id) ON DELETE CASCADE)''')
    connection.execute('CREATE INDEX IF NOT EXISTS idx_group_decisions ON consistency_group_decisions(job_id,anchor_id,result_fingerprint,id)')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_anchor_phases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,job_id TEXT NOT NULL,anchor_id TEXT NOT NULL,
        attempt INTEGER NOT NULL CHECK(attempt>0),phase TEXT NOT NULL,state TEXT NOT NULL,
        started_at TEXT NOT NULL DEFAULT(strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        FOREIGN KEY(job_id,anchor_id) REFERENCES consistency_anchor_runs(job_id,anchor_id) ON DELETE CASCADE)''')
    connection.execute('CREATE INDEX IF NOT EXISTS idx_anchor_phases ON consistency_anchor_phases(job_id,anchor_id,id)')
    connection.execute('''CREATE TRIGGER IF NOT EXISTS consistency_anchor_phase_created
        AFTER INSERT ON consistency_anchor_runs BEGIN
        INSERT INTO consistency_anchor_phases(job_id,anchor_id,attempt,phase,state)
            VALUES(NEW.job_id,NEW.anchor_id,NEW.attempt,NEW.phase,NEW.state);
        END''')
    connection.execute('''CREATE TRIGGER IF NOT EXISTS consistency_anchor_phase_changed
        AFTER UPDATE OF phase,state,attempt ON consistency_anchor_runs
        WHEN NEW.phase!=OLD.phase OR NEW.state!=OLD.state OR NEW.attempt!=OLD.attempt BEGIN
        INSERT INTO consistency_anchor_phases(job_id,anchor_id,attempt,phase,state)
            VALUES(NEW.job_id,NEW.anchor_id,NEW.attempt,NEW.phase,NEW.state);
        END''')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_visual_requests (
        job_id TEXT NOT NULL,anchor_id TEXT NOT NULL,request_id TEXT NOT NULL,
        request_json TEXT NOT NULL CHECK(json_valid(request_json)),
        observation_json TEXT CHECK(observation_json IS NULL OR json_valid(observation_json)),
        PRIMARY KEY(job_id,anchor_id,request_id),
        FOREIGN KEY(job_id,anchor_id) REFERENCES consistency_anchor_runs(job_id,anchor_id) ON DELETE CASCADE)''')
    connection.execute('''CREATE TABLE IF NOT EXISTS image_pair_observations (
        sample_id_a TEXT NOT NULL REFERENCES samples(sample_id) ON DELETE CASCADE,
        sample_id_b TEXT NOT NULL REFERENCES samples(sample_id) ON DELETE CASCADE,
        image_sha256_a TEXT NOT NULL,image_sha256_b TEXT NOT NULL,
        observation_json TEXT NOT NULL CHECK(json_valid(observation_json)),
        PRIMARY KEY(sample_id_a,sample_id_b,image_sha256_a,image_sha256_b),CHECK(sample_id_a<sample_id_b),
        CHECK(json_extract(observation_json,'$.sample_id_a')=sample_id_a),
        CHECK(json_extract(observation_json,'$.sample_id_b')=sample_id_b),
        CHECK(json_extract(observation_json,'$.image_sha256_a')=image_sha256_a),
        CHECK(json_extract(observation_json,'$.image_sha256_b')=image_sha256_b))''')
    connection.execute('CREATE INDEX IF NOT EXISTS idx_image_pair_b ON image_pair_observations(sample_id_b)')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,decision_id TEXT NOT NULL UNIQUE,
        client_request_id TEXT NOT NULL UNIQUE,evidence_id TEXT NOT NULL REFERENCES consistency_results(evidence_id),
        request_sha256 TEXT NOT NULL,record_json TEXT NOT NULL CHECK(json_valid(record_json)))''')
    connection.execute('CREATE INDEX IF NOT EXISTS idx_consistency_decisions_evidence ON consistency_decisions(evidence_id,id)')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_correction_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,check_id TEXT NOT NULL UNIQUE,client_request_id TEXT NOT NULL UNIQUE,
        decision_id TEXT NOT NULL REFERENCES consistency_decisions(decision_id),
        evidence_id TEXT NOT NULL REFERENCES consistency_results(evidence_id),
        request_sha256 TEXT NOT NULL,record_json TEXT NOT NULL CHECK(json_valid(record_json)))''')
    connection.execute('CREATE INDEX IF NOT EXISTS idx_correction_decision ON consistency_correction_checks(decision_id,id)')
    connection.execute('CREATE INDEX IF NOT EXISTS idx_correction_evidence ON consistency_correction_checks(evidence_id)')
    connection.execute('''CREATE TABLE IF NOT EXISTS audit_consistency_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,check_id TEXT NOT NULL UNIQUE,
        run_id TEXT NOT NULL REFERENCES job_runs(job_id) ON DELETE CASCADE,sample_id TEXT NOT NULL,
        record_json TEXT NOT NULL CHECK(json_valid(record_json)),UNIQUE(run_id,sample_id))''')
    connection.execute('CREATE INDEX IF NOT EXISTS idx_audit_consistency_sample ON audit_consistency_checks(sample_id,id)')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_queries (
        query_id TEXT PRIMARY KEY,expires_at TEXT NOT NULL,snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)))''')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_query_items (
        query_id TEXT NOT NULL REFERENCES consistency_queries(query_id) ON DELETE CASCADE,position INTEGER NOT NULL,
        evidence_id TEXT NOT NULL REFERENCES consistency_results(evidence_id),
        facts_state TEXT NOT NULL CHECK(facts_state IN ('CURRENT','HISTORICAL','UNKNOWN')),
        source_states_json TEXT NOT NULL CHECK(json_valid(source_states_json)),evidence_available INTEGER NOT NULL,
        PRIMARY KEY(query_id,position))''')
    connection.execute('CREATE INDEX IF NOT EXISTS idx_consistency_query_evidence ON consistency_query_items(evidence_id)')
    connection.execute('CREATE INDEX IF NOT EXISTS idx_consistency_query_expiry ON consistency_queries(expires_at)')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_runs (
        batch_id TEXT PRIMARY KEY,request_id TEXT NOT NULL UNIQUE,fingerprint TEXT NOT NULL,
        root_batch_id TEXT NOT NULL,parent_batch_id TEXT,
        plan_json TEXT NOT NULL CHECK(json_valid(plan_json)),cancel_requested INTEGER NOT NULL DEFAULT 0 CHECK(cancel_requested IN(0,1)))''')
    columns={row[1] for row in connection.execute('PRAGMA table_info(consistency_runs)')}
    if 'interrupted' not in columns:connection.execute('ALTER TABLE consistency_runs ADD COLUMN interrupted INTEGER NOT NULL DEFAULT 0 CHECK(interrupted IN(0,1))')
    if 'error_json' not in columns:connection.execute('ALTER TABLE consistency_runs ADD COLUMN error_json TEXT CHECK(error_json IS NULL OR json_valid(error_json))')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_children (
        batch_id TEXT NOT NULL REFERENCES consistency_runs(batch_id),step INTEGER NOT NULL CHECK(step>=0),
        run_id TEXT NOT NULL UNIQUE REFERENCES job_runs(job_id),PRIMARY KEY(batch_id,step))''')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_batch_results (
        batch_id TEXT NOT NULL REFERENCES consistency_runs(batch_id),sample_a TEXT NOT NULL,sample_b TEXT NOT NULL,
        result_id TEXT NOT NULL,evidence_id TEXT NOT NULL REFERENCES consistency_results(evidence_id),
        PRIMARY KEY(batch_id,sample_a,sample_b))''')
    connection.execute('CREATE INDEX IF NOT EXISTS idx_consistency_batch_evidence ON consistency_batch_results(evidence_id)')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_results (
        evidence_id TEXT PRIMARY KEY,result_id TEXT NOT NULL UNIQUE,
        snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)),snapshot_sha256 TEXT NOT NULL)''')
    if connection.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='consistency_anchor_evidence'").fetchone() is None:
        connection.execute('''CREATE TABLE consistency_anchor_evidence (
            job_id TEXT NOT NULL,anchor_id TEXT NOT NULL,candidate_id TEXT NOT NULL,
            evidence_id TEXT NOT NULL REFERENCES consistency_results(evidence_id),
            FOREIGN KEY(job_id,anchor_id) REFERENCES consistency_anchor_runs(job_id,anchor_id) ON DELETE CASCADE,
            PRIMARY KEY(job_id,anchor_id,candidate_id,evidence_id))''')
        connection.execute('''INSERT INTO consistency_anchor_evidence(job_id,anchor_id,candidate_id,evidence_id)
            SELECT job_id,anchor_id,json_extract(member.value,'$.image.sample.sample_id'),
                json_extract(member.value,'$.comparison.evidence_id')
            FROM consistency_anchor_runs,json_each(group_json,'$.members') member WHERE group_json IS NOT NULL''')
    connection.execute('''CREATE TABLE IF NOT EXISTS consistency_pixel_evidence (
        pixel_key TEXT NOT NULL,sha256 TEXT NOT NULL,byte_count INTEGER NOT NULL CHECK(byte_count>0),
        PRIMARY KEY(pixel_key,sha256))''')
    connection.execute('''CREATE TABLE IF NOT EXISTS image_embedding_profiles (
        profile_id TEXT PRIMARY KEY,profile_json TEXT NOT NULL CHECK(json_valid(profile_json)))''')
    connection.execute('''CREATE TABLE IF NOT EXISTS workbench_image_settings (
        id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL CHECK(revision>0),
        profile_id TEXT REFERENCES image_embedding_profiles(profile_id),resources_json TEXT NOT NULL CHECK(json_valid(resources_json)))''')
    columns = {row[1] for row in connection.execute('PRAGMA table_info(datasets)')}
    if 'scan_ref' not in columns:
        connection.execute("ALTER TABLE datasets ADD COLUMN scan_ref TEXT NOT NULL DEFAULT 'unpublished'")
        connection.execute("UPDATE datasets SET scan_ref='scan_'||lower(hex(randomblob(16)))")
    connection.execute('''CREATE TABLE IF NOT EXISTS image_content_groups (
        group_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL)''')
    connection.execute('''CREATE TABLE IF NOT EXISTS sample_pixel_index (
        sample_id TEXT PRIMARY KEY REFERENCES samples(sample_id) ON DELETE CASCADE,
        scan_ref TEXT NOT NULL,
        image_sha256 TEXT,
        content_group_id TEXT REFERENCES image_content_groups(group_id),
        compare_profile TEXT NOT NULL,
        pixel_key TEXT,
        descriptor_json TEXT NOT NULL CHECK(json_valid(descriptor_json)),
        file_size INTEGER CHECK(file_size>=0),
        mtime_ns INTEGER CHECK(mtime_ns>=0),
        indexed_at TEXT NOT NULL,
        CHECK((json_extract(descriptor_json,'$.decode_status')='COMPLETE') = (content_group_id IS NOT NULL)))''')
    connection.execute('CREATE INDEX IF NOT EXISTS idx_pixels_candidate ON sample_pixel_index(compare_profile,pixel_key)')
    connection.execute('CREATE INDEX IF NOT EXISTS idx_pixels_group ON sample_pixel_index(content_group_id,sample_id)')
    columns={row[1] for row in connection.execute('PRAGMA table_info(feature_records)')}
    if 'sample_id' in columns:
        connection.execute('DROP TABLE feature_records')
    connection.execute('''CREATE TABLE IF NOT EXISTS feature_records (
        content_group_id TEXT NOT NULL REFERENCES image_content_groups(group_id) ON DELETE CASCADE,
        profile_id TEXT NOT NULL REFERENCES image_embedding_profiles(profile_id),
        view_key TEXT NOT NULL,dim INTEGER NOT NULL CHECK(dim>0),
        dtype TEXT NOT NULL CHECK(dtype IN ('float32','float16')),
        embedding_blob BLOB,status TEXT NOT NULL CHECK(status IN ('COMPLETE','FAILED')),
        error_code TEXT,error_message TEXT,attempt_count INTEGER NOT NULL CHECK(attempt_count>0),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(content_group_id,profile_id,view_key),
        CHECK((status='COMPLETE' AND embedding_blob IS NOT NULL AND error_code IS NULL AND error_message IS NULL)
            OR (status='FAILED' AND embedding_blob IS NULL AND error_code IS NOT NULL)),
        CHECK(embedding_blob IS NULL OR length(embedding_blob)=dim*CASE dtype WHEN 'float32' THEN 4 ELSE 2 END))''')
    connection.execute('CREATE INDEX IF NOT EXISTS idx_feature_profile ON feature_records(profile_id,view_key,status)')
    connection.execute('''CREATE VIEW IF NOT EXISTS sample_features AS
        SELECT p.sample_id,f.* FROM sample_pixel_index p JOIN samples s ON s.sample_id=p.sample_id
        JOIN feature_records f ON f.content_group_id=p.content_group_id
        WHERE f.status='COMPLETE' AND s.is_excluded=0''')
