import json

from iad_core.audit.stage_models import AuditDefectProfile, AuditDefectProfileCommit, AuditPhaseState, AuditStageSample
from iad_core.workbench.analysis_sources import AnalysisSourceRoles


class AuditStages:
    def __init__(self, state):
        self.state, self.db = state, state.db

    @staticmethod
    def role(record):
        return AnalysisSourceRoles.resolve(record.dataset_format, record.sample.quality_status,
            record.sample.annotation_availability.status, len(record.annotations))

    @classmethod
    def resolve(cls, snapshot, samples, profile) -> AuditPhaseState:
        roles = {record.sample.sample_id: cls.role(record) for record in snapshot.manifest.records}
        defects = [sample for sample in samples if roles[sample.sample_id] != 'normal']
        pending = [sample.sample_id for sample in defects if sample.state in ('PENDING', 'RUNNING')]
        if pending:
            return AuditPhaseState(phase='defects', pending_sample_ids=pending)
        failed = [sample.sample_id for sample in defects if sample.state != 'COMPLETED'
            or sample.execution_status != 'completed']
        if failed:
            return AuditPhaseState(phase='blocked', limitations=['缺陷审计未成功完成：'+', '.join(failed)])
        versions = {sample.sample_id: sample.result_revision for sample in defects if roles[sample.sample_id] == 'defect'}
        if versions and (profile is None or profile.source_versions != versions):
            return AuditPhaseState(phase='defect_profile')
        normals = [sample.sample_id for sample in samples if roles[sample.sample_id] == 'normal'
            and sample.state in ('PENDING', 'RUNNING')]
        return AuditPhaseState(phase='normals' if normals else 'report', pending_sample_ids=normals,
            defect_profile=profile)

    def profile(self, run_id: str) -> AuditDefectProfile | None:
        with self.db.connection() as connection:
            row = connection.execute('SELECT profile_json FROM audit_defect_profiles WHERE job_id=? ORDER BY revision DESC LIMIT 1',
                (run_id,)).fetchone()
        return AuditDefectProfile.model_validate_json(row[0]) if row else None

    def status(self, run_id: str) -> AuditPhaseState:
        from iad_core.audit.batches import AuditBatches
        with self.db.connection() as connection:
            samples = [AuditStageSample.model_validate(dict(row)) for row in connection.execute(
                "SELECT sample_id,state,result_revision,json_extract(result_json,'$.execution_status') execution_status "
                'FROM audit_sample_runs WHERE job_id=? ORDER BY ordinal', (run_id,))]
        rechecks = {review.sample_id for review in AuditBatches(self.state).rechecks(run_id)}
        samples = [sample.model_copy(update={'state':'RUNNING'}) if sample.sample_id in rechecks else sample for sample in samples]
        return self.resolve(self.state.snapshot(run_id), samples, self.profile(run_id))

    def context(self, run_id: str) -> dict:
        from iad_core.audit.master_records import AuditMasterRecords
        from iad_core.audit.master_models import AuditMasterDatasetProfile
        from iad_core.audit.reports import AuditReports
        if self.status(run_id).phase != 'defect_profile':
            raise ValueError('全部缺陷图像审计完成后才能生成缺陷画像')
        profile = self.profile(run_id)
        return dict(kind='audit_master_index', job_id=run_id, phase='defect_profile', revision=profile.revision if profile else 0,
            items=[], record_index=AuditMasterRecords(AuditReports(self.db)).index(run_id, 'defects'),
            dataset_profile=AuditMasterDatasetProfile.capture(self.state.snapshot(run_id).dataset_profile).model_dump(mode='json'),
            previous_profile=profile.model_dump(mode='json', exclude={'source_versions'}) if profile else None)

    def publish(self, run_id: str, request: dict) -> AuditDefectProfile:
        from iad_core.audit.reports import AuditReports
        from iad_core.audit.evidence import AuditEvidence
        submission = AuditDefectProfileCommit.model_validate(request)
        canonical = submission.model_dump_json()
        with self.db.connection() as connection:
            saved = connection.execute('SELECT request_json,profile_json FROM audit_defect_profiles WHERE job_id=? AND commit_key=?',
                (run_id, submission.commit_key)).fetchone()
        if saved:
            if saved[0] != canonical:
                raise ValueError('同一画像提交键不能用于不同内容')
            return AuditDefectProfile.model_validate_json(saved[1])
        if self.status(run_id).phase != 'defect_profile':
            raise ValueError('缺陷画像只能在缺陷阶段全部完成后提交')
        records = {record.sample.sample_id:record for record in self.state.snapshot(run_id).manifest.records}
        samples = self.state.samples(run_id)
        versions = {sample.sample_id: sample.result_revision for sample in samples if self.role(records[sample.sample_id]) == 'defect'}
        reports, evidence = AuditReports(self.db), AuditEvidence(self.state)
        if set(versions.items()) - reports.read_versions(run_id):
            raise ValueError('主 Agent 必须实际读取全部缺陷图级结果的当前版本')
        if not submission.features and not submission.limitations:
            raise ValueError('无法形成缺陷画像时必须说明实际证据缺口')
        if len({feature.feature_id for feature in submission.features}) != len(submission.features):
            raise ValueError('缺陷特征ID不能重复')
        observed = reports.observed(run_id)
        for feature in submission.features:
            reports.validate_references(run_id, feature.references, current_only=True)
            for reference in feature.references:
                if reference.sample_id not in versions:
                    raise ValueError('缺陷画像只能引用实际缺陷图像')
                record = records[reference.sample_id]
                labels = {item.raw_label for item in record.annotations if not item.is_ignored}
                if labels and feature.category not in labels:
                    raise ValueError('缺陷画像类别须来自引用图像的原始标注')
                if evidence.prepare(run_id, reference.sample_id, reference.sample_id).evidence_id not in observed:
                    raise ValueError('缺陷画像代表图须由主 Agent 实际观察')
        previous = self.profile(run_id)
        if submission.base_revision != (previous.revision if previous else 0):
            raise ValueError('缺陷画像版本已变化')
        profile = AuditDefectProfile(revision=submission.base_revision+1, source_versions=versions,
            features=submission.features, limitations=submission.limitations)
        from iad_core.audit.profile_semantics import AuditProfileSemantics
        semantics = AuditProfileSemantics(self.state, run_id)
        changed = previous is not None and semantics.facts(previous) != semantics.facts(profile)
        profile = profile.model_copy(update={'semantic_revision': (previous.semantic_revision + int(changed)) if previous else 1})
        with self.db.connection() as connection:
            connection.execute('BEGIN IMMEDIATE')
            job = connection.execute('SELECT status FROM job_runs WHERE job_id=?', (run_id,)).fetchone()
            if job is None or job[0] != 'RUNNING':
                raise ValueError('作业已停止，不能发布缺陷画像')
            connection.execute('INSERT INTO audit_defect_profiles VALUES(?,?,?,?,?)',
                (run_id, profile.revision, submission.commit_key, canonical, profile.model_dump_json()))
            if previous and changed:
                from iad_core.audit.delegation_models import AuditReviewRequest
                from iad_core.audit.rechecks import AuditRechecks
                references = [ref for feature in profile.features for ref in feature.references]
                if not references:
                    references = [dict(sample_id=identity, result_revision=version, kind='image') for identity, version in versions.items()][:1]
                for sample in samples:
                    if self.role(records[sample.sample_id]) != 'normal' or sample.state != 'COMPLETED':
                        continue
                    review = AuditReviewRequest(sample_id=sample.sample_id, result_revision=sample.result_revision,
                        reason='缺陷判别依据已更新，请依据当前缺陷参考重新核对良品判断。', conflict_refs=references[:4])
                    batch = connection.execute('SELECT number FROM audit_batches,json_each(sample_ids_json) m WHERE job_id=? AND m.value=?',
                        (run_id, sample.sample_id)).fetchone()
                    AuditRechecks.enqueue(connection, run_id, review, batch[0])

        return profile

    def compatible(self, run_id: str, profile_revision: int | None) -> bool:
        from iad_core.audit.profile_semantics import AuditProfileSemantics
        return AuditProfileSemantics(self.state, run_id).compatible(profile_revision, self.profile(run_id))

    def validate_observation(self, run_id, sample_id, observation, observed):
        if not observation.complete:
            return
        record = next(item for item in self.state.snapshot(run_id).manifest.records if item.sample.sample_id == sample_id)
        if self.role(record) != 'normal':
            if any(not scene.basis for scene in observation.defects):
                raise ValueError('缺陷场景须说明符合该类形态、尺寸、位置和对比度的可见依据')
            return
        normal, profile = observation.normal, self.profile(run_id)
        if normal is None or profile is None or not profile.features:
            raise ValueError('缺少实际缺陷参考，无法完成困难良品判定；请记录评分证据缺口')
        with self.db.connection() as connection:
            expected = dict(connection.execute('SELECT sample_id,result_revision FROM audit_sample_runs WHERE job_id=? '
                'AND sample_id IN (SELECT key FROM json_each(?))', (run_id, json.dumps(profile.source_versions))).fetchall())
        if expected != profile.source_versions or normal.profile_revision != profile.revision:
            raise ValueError('良品判定须采用当前缺陷画像版本')
        if normal.texture and not normal.texture_reason:
            raise ValueError('特殊正常纹理须有具体可见依据，不能用频次替代判断')
        qualification = normal.qualification
        if not normal.hard:
            if qualification is not None or normal.confusable:
                raise ValueError('易混淆现象须统一完成困难良品判断')
            return
        if qualification is None:
            raise ValueError('困难良品必须提供真实缺陷对照、相似特征、良品依据及判断难点')
        feature = next((item for item in profile.features if item.feature_id == qualification.feature_id), None)
        if feature is None or qualification.reference not in feature.references:
            raise ValueError('困难良品引用的缺陷特征或版本不属于当前画像')
        from iad_core.audit.evidence import AuditEvidence
        image = AuditEvidence(self.state).prepare(run_id, sample_id, qualification.reference.sample_id)
        if image.evidence_id not in observed:
            raise ValueError('困难良品须实际观察所引用的缺陷对照原图')
