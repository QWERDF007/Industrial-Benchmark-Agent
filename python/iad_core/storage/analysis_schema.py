from sqlite3 import Connection


COMMITS_SCHEMA = '''CREATE TABLE IF NOT EXISTS analysis_workflow_commits (
    job_id TEXT NOT NULL REFERENCES analysis_workflow_runs(job_id) ON DELETE CASCADE,
    commit_key TEXT NOT NULL, round_id INTEGER NOT NULL, revision INTEGER NOT NULL,
    submission_json TEXT NOT NULL, receipt_json TEXT NOT NULL,
    PRIMARY KEY(job_id,round_id,commit_key), UNIQUE(job_id,revision))'''

OBSERVATIONS_SCHEMA = '''CREATE TABLE IF NOT EXISTS analysis_sample_observations (
    job_id TEXT NOT NULL REFERENCES analysis_workflow_runs(job_id) ON DELETE CASCADE,
    observation_id TEXT NOT NULL, sample_id TEXT NOT NULL REFERENCES samples(sample_id) ON DELETE CASCADE,
    round_id INTEGER NOT NULL, revision INTEGER NOT NULL, observation_json TEXT NOT NULL,
    PRIMARY KEY(job_id,observation_id),
    FOREIGN KEY(job_id,revision) REFERENCES analysis_workflow_commits(job_id,revision) ON DELETE CASCADE)'''


def initialize_analysis_schema(connection: Connection):
    connection.execute('''CREATE TABLE IF NOT EXISTS analysis_workflow_runs (
        job_id TEXT PRIMARY KEY REFERENCES job_runs(job_id) ON DELETE CASCADE,
        session_id TEXT NOT NULL UNIQUE, session_created INTEGER NOT NULL DEFAULT 0,
        snapshot_json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0,
        catalog_json TEXT NOT NULL)''')
    connection.execute('''CREATE TABLE IF NOT EXISTS analysis_sample_media (
        job_id TEXT NOT NULL REFERENCES analysis_workflow_runs(job_id) ON DELETE CASCADE,
        sample_id TEXT NOT NULL REFERENCES samples(sample_id) ON DELETE CASCADE,
        media_json TEXT NOT NULL, PRIMARY KEY(job_id,sample_id))''')
    connection.execute('''CREATE TABLE IF NOT EXISTS analysis_media_deliveries (
        job_id TEXT NOT NULL REFERENCES analysis_workflow_runs(job_id) ON DELETE CASCADE,
        call_id TEXT NOT NULL REFERENCES model_calls(call_id) ON DELETE CASCADE,
        evidence_id TEXT NOT NULL, PRIMARY KEY(job_id,call_id,evidence_id))''')
    connection.execute(COMMITS_SCHEMA)
    connection.execute(OBSERVATIONS_SCHEMA)
    columns = connection.execute('PRAGMA table_info(analysis_workflow_commits)').fetchall()
    primary_key = [row[1] for row in sorted(columns, key=lambda row:row[5]) if row[5]]
    if primary_key == ['job_id', 'commit_key']:
        connection.execute(COMMITS_SCHEMA.replace('analysis_workflow_commits', 'analysis_workflow_commits_next'))
        connection.execute(OBSERVATIONS_SCHEMA.replace('analysis_sample_observations', 'analysis_sample_observations_next')
            .replace('analysis_workflow_commits', 'analysis_workflow_commits_next'))
        for table in ('analysis_workflow_commits', 'analysis_sample_observations'):
            connection.execute(f'INSERT INTO {table}_next SELECT * FROM {table} ORDER BY rowid')
        connection.execute('DROP TABLE analysis_sample_observations')
        connection.execute('DROP TABLE analysis_workflow_commits')
        connection.execute('ALTER TABLE analysis_workflow_commits_next RENAME TO analysis_workflow_commits')
        connection.execute('ALTER TABLE analysis_sample_observations_next RENAME TO analysis_sample_observations')
    connection.execute('CREATE INDEX IF NOT EXISTS idx_analysis_observations_sample ON analysis_sample_observations(job_id,sample_id)')
    connection.execute('''CREATE TABLE IF NOT EXISTS analysis_publications (
        version_id TEXT PRIMARY KEY, job_id TEXT NOT NULL REFERENCES analysis_workflow_runs(job_id) ON DELETE CASCADE,
        revision INTEGER NOT NULL, execution_status TEXT NOT NULL, publication_json TEXT NOT NULL)''')
    connection.execute('''CREATE UNIQUE INDEX IF NOT EXISTS idx_analysis_terminal_publication
        ON analysis_publications(job_id,revision,execution_status)
        WHERE json_type(publication_json,'$.manual_edit') IS NULL OR json_type(publication_json,'$.manual_edit')='null' ''')
    connection.execute('''CREATE TABLE IF NOT EXISTS analysis_knowledge_check_reviews (
        submission_id TEXT PRIMARY KEY, version_id TEXT NOT NULL REFERENCES analysis_publications(version_id) ON DELETE CASCADE,
        check_id TEXT NOT NULL, revision INTEGER NOT NULL CHECK(revision>0),
        submission_json TEXT NOT NULL, review_json TEXT NOT NULL, UNIQUE(version_id,check_id,revision))''')
    connection.execute('''CREATE TABLE IF NOT EXISTS analysis_publication_exports (
        version_id TEXT PRIMARY KEY REFERENCES analysis_publications(version_id) ON DELETE CASCADE,
        session_event_count INTEGER NOT NULL CHECK(session_event_count>=0))''')
    connection.execute('''CREATE TABLE IF NOT EXISTS analysis_direction_removals (
        version_id TEXT NOT NULL REFERENCES analysis_publications(version_id) ON DELETE CASCADE,
        direction_id TEXT NOT NULL, PRIMARY KEY(version_id,direction_id))''')
