import json

from iad_core.audit.report_models import AuditBatchDelta, AuditDiscovery, AuditDiscoveryBody, AuditDiscoveryQuery


class AuditDiscoveries:
    def __init__(self, reports):
        self.reports = reports

    def apply(self, current: list[AuditDiscovery], submission: AuditBatchDelta) -> list[AuditDiscovery]:
        entries = {item.group_id:item.model_dump(mode='json', exclude_computed_fields=True) for item in current}
        if len({item.group_id for item in submission.discoveries}) != len(submission.discoveries):
            raise ValueError('同次提交不能重复修改同一发现')
        claim_fields = ('description', 'visual_signature', 'annotation_relation', 'scope', 'key_difference')
        required = set()
        for edit in submission.discoveries:
            previous = entries.get(edit.group_id)
            if previous and any(previous[name] != getattr(edit, name) for name in claim_fields):
                required.update((edit.group_id, role, json.dumps(ref, sort_keys=True))
                    for role in ('support', 'counter') for ref in previous[role+'_refs'])
            entries[edit.group_id] = {'support_refs':[], 'counter_refs':[], 'representatives':[], **(previous or {})} | edit.model_dump(mode='json')
        reviewed = set()
        for change in submission.evidence_changes:
            if change.group_id not in entries:
                raise ValueError('引用变更须对应真实发现')
            reference = change.reference.model_dump(mode='json')
            identity = (change.group_id, change.role, json.dumps(reference, sort_keys=True))
            if identity in reviewed:
                raise ValueError('同次提交不能重复处理同一角色引用')
            reviewed.add(identity)
            refs = entries[change.group_id][change.role+'_refs']
            if change.action == 'add':
                if reference in refs:
                    raise ValueError('已存在的引用无需重复新增')
                refs.append(reference)
            else:
                if reference not in refs:
                    raise ValueError('保留或移除须对应已有引用')
                if change.action == 'remove': refs.remove(reference)
        if required - reviewed:
            raise ValueError('主张或范围变化须逐项复核全部旧引用')
        if len({item.group_id for item in submission.representative_changes}) != len(submission.representative_changes):
            raise ValueError('同次提交不能重复修改同一发现的精选')
        for selection in submission.representative_changes:
            if selection.group_id not in entries:
                raise ValueError('精选变更须对应真实发现')
            entries[selection.group_id]['representatives'] = [item.model_dump(mode='json') for item in selection.representatives]
        return [AuditDiscovery.model_validate(item) for item in entries.values()]

    def page(self, run_id: str, query: dict) -> dict:
        query = AuditDiscoveryQuery.model_validate(query)
        current = self.reports.session(run_id)
        revision, discoveries = current.revision, current.discoveries
        if query.revision is not None:
            with self.reports.db.connection() as connection:
                row = connection.execute('SELECT submission_json FROM audit_global_versions WHERE job_id=? AND revision=?',
                    (run_id, query.revision)).fetchone()
            if row is None: raise ValueError('发现目录版本不存在')
            revision = query.revision
            discoveries = [AuditDiscovery.model_validate(item) for item in json.loads(row[0])['discoveries']]
        discovery = next((item for item in discoveries if item.group_id == query.group_id), None)
        if discovery is None: raise ValueError('发现不属于当前目录')
        items = [dict(role=role, reference=ref.model_dump(mode='json')) for role in ('support', 'counter')
            if query.role is None or query.role == role for ref in getattr(discovery, role+'_refs')]
        start = (query.page-1)*query.page_size
        return dict(job_id=run_id, revision=revision, discovery=discovery.model_dump(mode='json',
            include=set(AuditDiscoveryBody.model_fields)|{'representatives'}),
            total=len(items), page=query.page, page_size=query.page_size, items=items[start:start+query.page_size])
