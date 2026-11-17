import json


class AuditProfileSemantics:
    def __init__(self, state, run_id: str):
        self.state, self.run_id = state, run_id

    def facts(self, profile) -> str:
        from iad_core.audit.batches import AuditBatches
        histories = {}
        features = []
        for feature in sorted(profile.features, key=lambda item: item.feature_id):
            references = []
            for reference in feature.references:
                if reference.sample_id not in histories:
                    histories[reference.sample_id] = {item.revision: item.final for item in
                        AuditBatches(self.state).history(self.run_id, reference.sample_id)}
                final = histories[reference.sample_id][reference.result_revision]
                value = final if reference.kind == 'image' else getattr(final,
                    {'finding': 'findings', 'observation': 'observations', 'feature': 'visual_features'}[reference.kind])[reference.index]
                references.append(dict(sample_id=reference.sample_id, kind=reference.kind, index=reference.index,
                    facts=value.model_dump(mode='json', exclude={'selected_evidence', 'hypothesis_assessments'})))
            features.append({**feature.model_dump(mode='json', exclude={'references'}),
                'references': sorted(references, key=lambda item: json.dumps(item, sort_keys=True, ensure_ascii=False))})
        return json.dumps(dict(features=features, limitations=sorted(profile.limitations)), sort_keys=True, ensure_ascii=False)

    def compatible(self, revision: int | None, current) -> bool:
        if revision is None or current is None:
            return False
        with self.state.db.connection() as connection:
            row = connection.execute('SELECT profile_json FROM audit_defect_profiles WHERE job_id=? AND revision=?',
                (self.run_id, revision)).fetchone()
        if row is None:
            return False
        from iad_core.audit.stage_models import AuditDefectProfile
        previous = AuditDefectProfile.model_validate_json(row[0])
        if previous.semantic_revision != current.semantic_revision:
            return False
        versions = {sample.sample_id: sample.result_revision for sample in self.state.samples(self.run_id)
            if sample.sample_id in current.source_versions}
        return versions == current.source_versions and self.facts(previous) == self.facts(current)
