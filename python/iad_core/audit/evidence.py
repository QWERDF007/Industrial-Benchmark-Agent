import json

from iad_core.analysis.queries import AnalysisQueries
from iad_core.evidence.images import EvidenceImages, PreparedImage
from iad_core.workbench.calls import ModelCalls
from iad_core.audit.models import AuditMediaQuery
from iad_core.analysis.evidence_models import AnalysisEvidenceReferenceQuery
from iad_core.evidence.registrations import (EvidenceReferenceQuery, PreparedRegistration, RegistrationImages, RegistrationMedia, RegistrationMediaPage, RegistrationMediaQuery, RegistrationCropQuery)


class AuditEvidence:
    def __init__(self, jobs):
        self.jobs, self.db = jobs, jobs.db
        self.images = RegistrationImages(self.db.db_path)

    def prepare(self, run_id: str, target_id: str, sample_id: str) -> PreparedRegistration:
        record = self.jobs.record(run_id,target_id,sample_id)
        with self.db.connection() as connection:
            row = connection.execute('SELECT media_json FROM audit_sample_media WHERE job_id=? AND target_id=? AND media_key=?',
                (run_id, target_id, 'sample:'+sample_id)).fetchone()
        if row:
            return PreparedRegistration.model_validate_json(row[0])
        in_scope = any(item.sample.sample_id == sample_id for item in self.jobs.snapshot(run_id).manifest.records)
        media = (self.prepare(run_id,sample_id,sample_id) if target_id != sample_id and in_scope
            else self.images.prepare(record, None, raw_annotations=True))
        with self.db.connection() as connection:
            connection.execute('INSERT INTO audit_sample_media(job_id,target_id,media_key,sample_id,media_json) VALUES(?,?,?,?,?)',
                (run_id, target_id, 'sample:'+sample_id, sample_id, media.model_dump_json()))
        return media

    def read(self, run_id: str, target_id: str, query: dict | RegistrationMediaQuery) -> RegistrationMediaPage:
        on_demand = self.jobs.snapshot(run_id).context_policy == 'evidence-on-demand-v1'
        query = (AuditMediaQuery if on_demand else RegistrationMediaQuery).model_validate(query)
        media = self.prepare(run_id, target_id, query.sample_id)
        if not on_demand or query.view == 'all':
            return media.page(query.offset, query.limit)
        images = [item for item in media.images if item.image.is_whole_image == (query.view == 'whole')]
        return media.page(query.offset, query.limit, images=images)

    def reference(self, run_id: str, target_id: str, evidence_id: str, view: str = 'whole') -> RegistrationMediaPage:
        query = AnalysisEvidenceReferenceQuery(evidence_id=evidence_id, view=view)
        evidence_id = query.evidence_id
        self.jobs.sample(run_id,target_id)
        snapshot = self.jobs.snapshot(run_id)
        reference = next((item for item in snapshot.knowledge.evidence if item.image.evidence_id == evidence_id), None) if snapshot.knowledge else None
        if reference is None:
            raise ValueError('图像证据不属于本场已选知识')
        source = AnalysisQueries(self.db).sample_evidence(snapshot.knowledge.selection.version_id, reference.sample_id)
        record = source.registration
        images = []
        for item in source.items:
            if not item.observed or item.image.representation != 'raw' or item.image.is_whole_image != (query.view == 'whole'):
                continue
            path = EvidenceImages(self.db.db_path).path(item.image)
            prepared = PreparedImage(item.image, path).with_source(record.sample, record.dataset_format, record.annotations)
            images.append(RegistrationMedia(sample_id=reference.sample_id, dataset_id=record.sample.dataset_id,
                image=item.image, path=path, model_context=prepared.model_context(), required=False))
        media = PreparedRegistration(sample_id=reference.sample_id, images=images)
        with self.db.connection() as connection:
            connection.execute('''INSERT INTO audit_sample_media(job_id,target_id,media_key,sample_id,media_json)
                VALUES(?,?,?,?,?) ON CONFLICT(job_id,target_id,media_key) DO NOTHING''',
                (run_id,target_id,'reference:'+evidence_id+(':'+query.view if snapshot.context_policy == 'evidence-on-demand-v1' else ''),media.sample_id,media.model_dump_json()))
        return media.page().model_copy(update={'evidence_id':evidence_id})

    def crop(self, run_id: str, target_id: str, query: dict) -> RegistrationMediaPage:
        query = RegistrationCropQuery.model_validate(query)
        record = self.jobs.record(run_id,target_id,query.sample_id)
        prepared = self.prepare(run_id,target_id,query.sample_id)
        if prepared.error:
            raise ValueError(prepared.error)
        whole=next(item for item in prepared.images if item.image.is_whole_image)
        record=record.model_copy(update={'sample':record.sample.model_copy(update={'image_path':whole.path}), 'source_fingerprint':None})
        media=self.images.crop(record,query.bbox,single_window=True)
        with self.db.connection() as connection:
            connection.executemany('''INSERT INTO audit_sample_media(job_id,target_id,media_key,sample_id,media_json)
                VALUES(?,?,?,?,?) ON CONFLICT(job_id,target_id,media_key) DO NOTHING''',
                [(run_id,target_id,'crop:'+item.image.evidence_id,query.sample_id,
                    PreparedRegistration(sample_id=query.sample_id,images=[item]).model_dump_json()) for item in media.images])
        return prepared.page(query.offset, query.limit, images=media.images)

    def observed(self, run_id: str, target_id: str) -> set[str]:
        successful = ModelCalls(self.db).successful_native_ids(run_id,
            complete_response=self.jobs.snapshot(run_id).context_policy == 'evidence-on-demand-v1')
        with self.db.connection() as connection:
            return {row[0] for row in connection.execute(
                'SELECT evidence_id,call_id FROM audit_media_deliveries WHERE job_id=? AND target_id=?',
                (run_id,target_id)) if row[1] in successful}

    def delivered(self, run_id: str, target_id: str, call_id: str, evidence_ids: list[str]):
        sample = self.jobs.sample(run_id, target_id)
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            row = connection.execute('SELECT summary_json FROM model_calls WHERE call_id=? AND run_id=?', (call_id,run_id)).fetchone()
            if row is None or json.loads(row[0]).get('session_id') != sample.session_id:
                raise ValueError('媒体回执没有本图独立Session的实际模型请求')
            available = {image.image.evidence_id for row in connection.execute(
                'SELECT media_json FROM audit_sample_media WHERE job_id=? AND target_id=?', (run_id,target_id))
                for image in PreparedRegistration.model_validate_json(row[0]).images}
            if set(evidence_ids) - available:
                raise ValueError('实发媒体不属于本图独立审计场景')
            connection.executemany('INSERT OR IGNORE INTO audit_media_deliveries(job_id,target_id,call_id,evidence_id) VALUES(?,?,?,?)',
                [(run_id,target_id,call_id,eid) for eid in evidence_ids])
