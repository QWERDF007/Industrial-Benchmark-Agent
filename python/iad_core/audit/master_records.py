import json

from iad_core.audit.master_models import AuditMasterRecord
from iad_core.audit.report_models import AuditRecordQuery


class AuditMasterRecords:
    """Versioned facts are delivered in bounded pages; an index never counts as a read."""

    def __init__(self, reports):
        self.reports, self.state = reports, reports.state

    def selected(self, run_id: str, query: AuditRecordQuery):
        from iad_core.audit.stages import AuditStages
        records = {record.sample.sample_id: record for record in self.state.snapshot(run_id).manifest.records}
        return [sample for sample in self.reports.matching_versions(run_id, query)
            if query.scope == 'all' or AuditStages.role(records[sample['sample_id']]) == query.scope.removesuffix('s')]

    def index(self, run_id: str, scope: str = 'all') -> dict:
        samples = self.selected(run_id, AuditRecordQuery(scope=scope))
        read = self.reports.read_versions(run_id)
        return dict(scope=scope, total=len(samples), unread=sum((sample['sample_id'], sample['result_revision']) not in read for sample in samples))

    def page(self, run_id: str, query: dict) -> dict:
        query = AuditRecordQuery.model_validate(query)
        selected = self.selected(run_id, query)
        read = self.reports.read_versions(run_id) if query.unread_only else set()
        selected = [sample for sample in selected if (sample['sample_id'], sample['result_revision']) not in read]
        remaining = [sample for sample in selected if query.cursor is None or sample['ordinal'] > int(query.cursor)]
        if query.page > 1:
            if query.unread_only:
                raise ValueError('未读集合请使用 next_cursor，不能用偏移页码')
            remaining = remaining[(query.page - 1) * query.page_size:]
        records = {record.sample.sample_id: record for record in self.state.snapshot(run_id).manifest.records}
        from iad_core.audit.batches import AuditBatches
        reviews = {review.sample_id: review for review in AuditBatches(self.state).rechecks(run_id, pending_only=False)}
        result = dict(kind='audit_records', job_id=run_id, representation=query.representation,
            scope=query.scope, total=len(selected), page=query.page, page_size=query.page_size, items=[], next_cursor=None)
        used = len(json.dumps(result, ensure_ascii=False)) + 128
        last = None
        for entry in remaining:
            if len(result['items']) >= query.page_size:
                result['next_cursor'] = str(last)
                break
            sample = self.state.sample(run_id, entry['sample_id'])
            if query.result_revision is not None and sample.result_revision != query.result_revision:
                version = next((item for item in AuditBatches(self.state).history(run_id, sample.sample_id)
                    if item.revision == query.result_revision), None)
                if version is None:
                    raise ValueError('图级结果版本不存在')
                sample = sample.model_copy(update={'result': version.final, 'result_revision': version.revision})
            item = AuditMasterRecord.capture(sample).model_dump(mode='json', exclude_computed_fields=True)
            record = records[sample.sample_id]
            review = reviews.get(sample.sample_id)
            item['review'] = review.model_dump(mode='json') if review and review.result_revision == sample.result_revision else None
            item['category_labels'] = (sorted({a.raw_label for a in record.annotations if not a.is_ignored})
                if record.dataset_format == 'labelme' else [record.sample.quality_status.value])
            if query.representation == 'facts':
                item['consistency'] = {key: value for key, value in item['consistency'].items() if key != 'gates'}
                if item['final']:
                    item['final'] = {key: value for key, value in item['final'].items()
                        if key not in ('hypothesis_assessments', 'selected_evidence')}
            size = len(json.dumps(item, ensure_ascii=False, separators=(',', ':'))) + 2
            if len(result['items']) >= query.page_size or used + size > query.max_chars:
                if last is None:
                    raise ValueError('单图事实超过页面预算，请增加 max_chars 后读取该图')
                result['next_cursor'] = str(last)
                break
            result['items'].append(item)
            used += size
            last = sample.ordinal
        return result
