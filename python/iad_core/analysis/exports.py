import hashlib
import json
import os
import tempfile
import zipfile
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from iad_core.analysis.models import AnalysisWorkflowSnapshot
from iad_core.analysis.publications import AnalysisPublications
from iad_core.contracts import ArtifactRef
from iad_core.evidence.images import EvidenceImages


class AnalysisExports:
    def __init__(self, db):
        self.db = db

    def create(self, version_id: str, directory: str, session_jsonl: str,
               child_sessions: dict[str, str] | None = None) -> ArtifactRef:
        publication = AnalysisPublications(self.db).get(version_id)
        root = Path(directory) / 'versions'
        target = root / version_id
        archive_path = root / (version_id + '.zip')
        artifact = ArtifactRef(artifact_id=version_id,artifact_type='analysis_publication_zip',
            uri=f'iad://analysis/publications/{version_id}/export',path=str(archive_path),summary='本场冻结范围、覆盖、成果、证据和原生轨迹')
        if archive_path.is_file():
            return artifact
        lines = session_jsonl.splitlines()
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            row = connection.execute('''SELECT r.snapshot_json,r.session_id,json_extract(j.payload_json,'$.submitted_at') submitted_at
                FROM analysis_workflow_runs r JOIN job_runs j ON j.job_id=r.job_id WHERE r.job_id=?''', (publication.job_id,)).fetchone()
            snapshot = AnalysisWorkflowSnapshot.model_validate_json(row['snapshot_json'])
            inherited = connection.execute('SELECT session_event_count FROM analysis_publication_exports WHERE version_id=?',
                (publication.parent_version_id,)).fetchone() if publication.manual_edit is not None else None
            connection.execute('INSERT INTO analysis_publication_exports(version_id,session_event_count) VALUES(?,?) ON CONFLICT DO NOTHING',
                (version_id,inherited[0] if inherited else len(lines)-1))
            event_count = connection.execute('SELECT session_event_count FROM analysis_publication_exports WHERE version_id=?',(version_id,)).fetchone()[0]
            recorded = connection.execute('SELECT session_event_counts_json FROM analysis_publication_exports WHERE version_id=?', (version_id,)).fetchone()[0]
            if recorded is None:
                child_counts = {sid:len(text.splitlines()) - 1 for sid, text in (child_sessions or {}).items()}
                connection.execute('UPDATE analysis_publication_exports SET session_event_counts_json=? WHERE version_id=?',
                    (json.dumps(child_counts), version_id))
            else:
                child_counts = json.loads(recorded)
            commits = connection.execute('''SELECT round_id,revision,submission_json,receipt_json FROM analysis_workflow_commits
                WHERE job_id=? AND revision<=? ORDER BY revision''',(publication.job_id,publication.revision)).fetchall()
            finalizations = connection.execute('''SELECT revision,submission_json,receipt_json FROM analysis_finalization_commits
                WHERE job_id=? AND revision<=? ORDER BY revision''',(publication.job_id,publication.revision)).fetchall()
            arguments = connection.execute('''SELECT * FROM analysis_claim_arguments
                WHERE job_id=? AND revision<=? ORDER BY revision,rowid''', (publication.job_id, publication.revision)).fetchall()
            claims = connection.execute('''SELECT * FROM analysis_claim_revisions
                WHERE job_id=? AND revision<=? ORDER BY revision,rowid''', (publication.job_id, publication.revision)).fetchall()
            calls = {item['call_id']:json.loads(item['summary_json']) for item in connection.execute(
                'SELECT call_id,summary_json FROM model_calls WHERE run_id=?',(publication.job_id,))}
            deliveries = connection.execute('SELECT evidence_id,call_id FROM analysis_media_deliveries WHERE job_id=? ORDER BY rowid',(publication.job_id,)).fetchall()
        if len(lines) < event_count + 1:
            raise LookupError('原生Session轨迹缺少已冻结发布版本的事件')
        encode = lambda value: json.dumps(value,ensure_ascii=False,indent=2)+'\n'
        manifest = dict(version_id=version_id,run_id=publication.job_id,session_id=row['session_id'],submitted_at=row['submitted_at'],
            snapshot=snapshot.model_dump(mode='json',exclude={'agent'}),model=snapshot.agent.profile.model_dump(mode='json',exclude={'credential_ref'}))
        texts = {'manifest.json':encode(manifest),'coverage.json':encode(publication.coverage.model_dump(mode='json')),
            ('directions.json' if publication.module=='exploration' else 'knowledge.json'):encode(publication.model_dump(mode='json')),
            'session/events.jsonl':'\n'.join(lines[:event_count+1])+'\n'}
        if publication.delegations:
            manifest['observer_sessions'] = [dict(session_id=task.session_id, round_id=task.round_id,
                trace_available=task.session_id in child_counts) for task in publication.delegations]
            texts['manifest.json'] = encode(manifest)
            texts['observer-reports.jsonl'] = ''.join(json.dumps(task.model_dump(mode='json'),ensure_ascii=False)+'\n'
                for task in publication.delegations)
            for sid, count in child_counts.items():
                child_lines = (child_sessions or {}).get(sid, '').splitlines()
                if len(child_lines) < count + 1:
                    raise LookupError('子代理Session轨迹缺少冻结版本的事件')
                texts['observers/'+sid+'/events.jsonl'] = '\n'.join(child_lines[:count+1])+'\n'
        rounds = [dict(run_id=publication.job_id,session_id=row['session_id'],round_id=item['round_id'],revision=item['revision'],
            submission=json.loads(item['submission_json']),receipt=json.loads(item['receipt_json'])) for item in commits]
        texts['rounds.jsonl'] = ''.join(json.dumps(item,ensure_ascii=False)+'\n' for item in rounds)
        texts['finalization.jsonl'] = ''.join(json.dumps(dict(run_id=publication.job_id,session_id=row['session_id'],
            phase='finalize',revision=item['revision'],submission=json.loads(item['submission_json']),
            receipt=json.loads(item['receipt_json'])),ensure_ascii=False)+'\n' for item in finalizations)
        texts['arguments.jsonl'] = ''.join(json.dumps(dict(item),ensure_ascii=False)+'\n' for item in arguments)
        texts['claims.jsonl'] = ''.join(json.dumps({**{name:item[name] for name in item.keys() if name != 'content_json'},
            'content':json.loads(item['content_json'])},ensure_ascii=False)+'\n' for item in claims)
        delivered = defaultdict(list)
        frozen = set(publication.model_call_ids or [])
        for item in deliveries:
            call = calls[item['call_id']]
            if item['call_id'] in frozen and call.get('finished_at') and not call.get('error') and call.get('finish_reason') not in ('error','aborted'):
                delivered[item['evidence_id']].append(dict(call_id=call['call_id'],session_id=call['session_id'],
                    request_ref=f'/api/iad/jobs/{publication.job_id}/model-calls/{call["call_id"]}'))
        records = {record.sample.sample_id:record for record in snapshot.manifest.records}
        roles = {item.sample_id:item.candidate_role for round in snapshot.plan.rounds for item in round.targets}
        images = EvidenceImages(self.db.db_path)
        assets, evidence = {}, []
        for record in publication.coverage.records:
            source = records[record.sample_id]
            for index,image in enumerate(record.media):
                media_path = 'media/'+image.sha256+'.png'
                assets[media_path] = images.path(image)
                evidence.append(dict(evidence_id=image.evidence_id,sample_id=record.sample_id,dataset_id=record.dataset_id,
                    filename=source.sample.relative_path,candidate_role=roles[record.sample_id],image=image.model_dump(mode='json'),
                    observed=image.evidence_id in record.observed_evidence_ids
                        or bool(record.observed_evidence_ids) and index in record.delivered_offsets,media_path=media_path,
                    model_calls=delivered[image.evidence_id] if publication.model_call_ids is not None else None))
        texts['evidence.jsonl'] = ''.join(json.dumps(item,ensure_ascii=False)+'\n' for item in evidence)
        target.mkdir(parents=True,exist_ok=True)
        timestamp = datetime.fromisoformat(publication.created_at).timetuple()[:6]
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(dir=root,suffix='.zip.tmp',delete=False) as handle:
                temporary = Path(handle.name)
            with zipfile.ZipFile(temporary,'w') as archive:
                for name,content in texts.items():
                    path = target / name
                    path.parent.mkdir(parents=True,exist_ok=True)
                    path.write_text(content,encoding='utf-8')
                    archive.writestr(zipfile.ZipInfo(name,date_time=timestamp),content,compress_type=zipfile.ZIP_DEFLATED)
                for name,source in assets.items():
                    payload = Path(source).read_bytes()
                    if hashlib.sha256(payload).hexdigest() != Path(name).stem:
                        raise ValueError('冻结证据在导出期间变化')
                    path = target / name
                    path.parent.mkdir(parents=True,exist_ok=True)
                    path.write_bytes(payload)
                    archive.writestr(zipfile.ZipInfo(name,date_time=timestamp),payload,compress_type=zipfile.ZIP_DEFLATED)
            os.replace(temporary,archive_path)
        finally:
            if temporary is not None:
                temporary.unlink(missing_ok=True)
        return artifact
