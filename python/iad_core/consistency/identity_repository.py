from iad_core.consistency.identity_models import AnchorIdentityState, CandidateIdentityRecord


class CandidateIdentityRecords:
    @staticmethod
    def read(connection, run_id, anchor_id, candidates):
        if candidates is None:
            raise ValueError('图像验证要求已冻结的召回候选')
        gates = [CandidateIdentityRecord.model_validate_json(row[0]) for row in connection.execute(
            'SELECT record_json FROM consistency_candidate_identity WHERE job_id=? AND anchor_id=? ORDER BY rowid',
            (run_id, anchor_id))]
        expected = {item.sample_id for item in candidates.candidates}
        if any(gate.candidate_id not in expected or gate.fingerprint != candidates.fingerprint for gate in gates):
            raise ValueError('候选资格记录与本主图冻结清单不一致')
        return AnchorIdentityState(fingerprint=candidates.fingerprint, retrieved=len(expected), gates=gates)
