import json

from iad_core.evidence.registrations import EvidenceReferenceQuery, RegistrationImages, RegistrationImageQuery, RegistrationMediaPage, RegistrationMediaQuery, RegistrationCropQuery, ExplorationCropQuery, PreparedRegistration
from iad_core.analysis.models import AnalysisBatchMaterials


class AnalysisEvidence:
    def __init__(self, jobs):
        self.jobs, self.db = jobs, jobs.db
        self.images = RegistrationImages(self.db.db_path)

    def prepare(self, run_id: str, sample_id: str, *, session_id: str | None = None) -> PreparedRegistration:
        if session_id:
            from iad_core.analysis.delegation import AnalysisDelegation
            task = AnalysisDelegation(self.jobs).task(run_id, session_id)
            if sample_id not in {target.sample_id for target in task.round.targets}:
                raise ValueError('图像不属于子代理本批目标')
        with self.db.connection() as connection:
            row = connection.execute('SELECT media_json FROM analysis_sample_media WHERE job_id=? AND sample_id=?',
                (run_id, sample_id)).fetchone()
        if row is not None:
            return PreparedRegistration.model_validate_json(row[0])
        context, snapshot = self.jobs.context(run_id), self.jobs.snapshot(run_id)
        if not session_id and (context.round is None or sample_id not in {target.sample_id for target in context.round.targets}):
            raise ValueError('图像不属于本场当前轮目标，旧证据须按已保存引用读取')
        record = next(record for record in snapshot.manifest.records if record.sample.sample_id == sample_id)
        batch_input = snapshot.input_organization != 'registration-tools'
        result = self.images.prepare(record, None if batch_input else snapshot.settings.whole_image_max_side,
            raw_annotations=batch_input, preserve_annotation_instances=batch_input)
        with self.db.connection() as connection:
            connection.execute('INSERT INTO analysis_sample_media(job_id,sample_id,media_json) VALUES(?,?,?)',
                (run_id, sample_id, result.model_dump_json()))
        return result

    def batch(self, run_id: str) -> AnalysisBatchMaterials:
        if self.jobs.snapshot(run_id).input_organization == 'registration-tools':
            raise ValueError('当前作业不使用整批材料输入')
        context = self.jobs.context(run_id)
        registrations = [self.prepare(run_id, target.sample_id).page() for target in context.round.targets] if context.round else []
        return AnalysisBatchMaterials(context=self.jobs.context(run_id), registrations=registrations)

    def read(self, run_id: str, query: dict | RegistrationMediaQuery, *, session_id: str | None = None) -> RegistrationMediaPage:
        if self.jobs.snapshot(run_id).input_organization != 'registration-tools':
            query = RegistrationImageQuery.model_validate(query)
            return self.prepare(run_id, query.sample_id, session_id=session_id).page()
        query = RegistrationMediaQuery.model_validate(query)
        prepared = self.prepare(run_id, query.sample_id)
        return prepared.page(query.offset, query.limit)

    def reference(self, run_id: str, query: dict | EvidenceReferenceQuery) -> RegistrationMediaPage:
        query = EvidenceReferenceQuery.model_validate(query)
        with self.db.connection() as connection:
            row = connection.execute('''SELECT media_json FROM analysis_sample_media
                WHERE job_id=? AND EXISTS(SELECT 1 FROM json_each(media_json,'$.images')
                    WHERE json_extract(value,'$.image.evidence_id')=?)''', (run_id,query.evidence_id)).fetchone()
        if row is None:
            raise LookupError('证据不属于本场已保存媒体')
        prepared = PreparedRegistration.model_validate_json(row[0])
        if query.evidence_id == prepared.evidence_id:
            return prepared.page()
        image = next(item for item in prepared.images if item.image.evidence_id == query.evidence_id)
        return prepared.page(images=[image])

    def delivered(self, run_id: str, call_id: str, evidence_ids: list[str]):
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            call = connection.execute('SELECT summary_json FROM model_calls WHERE run_id=? AND call_id=?', (run_id, call_id)).fetchone()
            actual_session = json.loads(call[0]).get('session_id') if call else None
            task = connection.execute('SELECT round_id FROM analysis_batch_tasks WHERE job_id=? AND session_id=?',
                (run_id, actual_session)).fetchone()
            if call is None or actual_session != self.jobs.state(run_id).session_id and task is None:
                raise ValueError('媒体回执没有本场实际模型请求')
            available = {item.image.evidence_id for row in connection.execute(
                'SELECT media_json FROM analysis_sample_media WHERE job_id=?', (run_id,))
                for item in PreparedRegistration.model_validate_json(row[0]).images}
            if set(evidence_ids) - available:
                raise ValueError('模型请求包含不属于本场的图像证据')
            connection.executemany('INSERT OR IGNORE INTO analysis_media_deliveries(job_id,call_id,evidence_id) VALUES(?,?,?)',
                [(run_id, call_id, evidence_id) for evidence_id in evidence_ids])

    def crop(self, run_id: str, query: dict, *, session_id: str | None = None) -> RegistrationMediaPage:
        batch_input = self.jobs.snapshot(run_id).input_organization != 'registration-tools'
        query=(ExplorationCropQuery if batch_input else RegistrationCropQuery).model_validate(query)
        context=self.jobs.context(run_id)
        if not session_id and (context.round is None or query.sample_id not in {target.sample_id for target in context.round.targets}):
            raise ValueError('裁窗图像不属于本场当前轮目标')
        prepared=self.prepare(run_id,query.sample_id,session_id=session_id)
        if prepared.error and (not batch_input or prepared.evidence_id is None):
            raise ValueError(prepared.error)
        record=next(record for record in self.jobs.snapshot(run_id).manifest.records if record.sample.sample_id==query.sample_id)
        cropped=self.images.crop(record,query.bbox,single_window=batch_input)
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            row=connection.execute('SELECT media_json FROM analysis_sample_media WHERE job_id=? AND sample_id=?',
                (run_id,query.sample_id)).fetchone()
            prepared=PreparedRegistration.model_validate_json(row[0])
            available={item.image.evidence_id for item in prepared.images}
            prepared.images.extend(item for item in cropped.images if item.image.evidence_id not in available)
            connection.execute('UPDATE analysis_sample_media SET media_json=? WHERE job_id=? AND sample_id=?',
                (prepared.model_dump_json(),run_id,query.sample_id))
        return prepared.page(images=cropped.images) if batch_input else prepared.page(query.offset, query.limit, images=cropped.images)
