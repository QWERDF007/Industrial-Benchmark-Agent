import hashlib
import json

from iad_core.consistency.annotation_coverage import AnnotationCoverage
from iad_core.consistency.annotations import AnnotationSet
from iad_core.consistency.annotation_models import AnnotationMatchingConfig
from iad_core.consistency.comparison_domain import ComparisonDomain


class RecordedIssues:
    """Project frozen position observations through the shared coverage geometry."""

    @classmethod
    def read(cls, model, raw, connection, run_id, anchor_id):
        if not raw or 'position_difference' not in raw:
            return (getattr(model, 'model_validate_json', None) or model.validate_json)(raw)
        rows = connection.execute('''SELECT r.snapshot_json FROM consistency_anchor_evidence a
            JOIN consistency_results r USING(evidence_id) WHERE a.job_id=? AND a.anchor_id=?''',
            (run_id, anchor_id)).fetchall()
        if not rows:
            row = connection.execute('SELECT group_json FROM consistency_anchor_runs WHERE job_id=? AND anchor_id=?',
                (run_id, anchor_id)).fetchone()
            if row and row[0]:
                ids = {member['comparison']['evidence_id'] for member in json.loads(row[0])['members']}
                rows = [row for identity in ids if (row := connection.execute(
                    'SELECT snapshot_json FROM consistency_results WHERE evidence_id=?', (identity,)).fetchone())]
        geometries = []
        for row in rows:
            evidence = json.loads(row[0])
            sides = [AnnotationSet.model_validate(evidence['sources'][side]['annotations']) for side in ('left', 'right')]
            domain = ComparisonDomain.prepare(sides, evidence['result']['verification']['relation'],
                AnnotationMatchingConfig.model_validate(evidence['parameters']['matching']))
            geometries.append({shape.annotation.annotation_id: shape for side in domain.sides for shape in side.values()})
        return (getattr(model, 'model_validate', None) or model.validate_python)(cls(geometries).restore(json.loads(raw)))

    def __init__(self, geometries):
        self.geometries = geometries

    def restore(self, value):
        if isinstance(value, list):
            result = []
            for item in value:
                if isinstance(item, dict) and item.get('type') == 'position_difference':
                    result.extend(self.coverage_issues(item))
                else:
                    result.append(self.restore(item))
            return result
        if not isinstance(value, dict):
            return value
        result = {key: self.restore(item) for key, item in value.items()}
        issues = result.get('issues', [])
        if issues and ('conclusion' in result or 'categories' in result):
            from iad_core.consistency.annotation_issues import ISSUE_CATEGORIES
            from iad_core.consistency.conflict_categories import primary_conflict_category
            category = primary_conflict_category(ISSUE_CATEGORIES[issue['type']] for issue in issues)
            if category:
                result.update(conclusion=category.value, categories=[category.value])
        return result

    def coverage_issues(self, issue):
        main = issue.get('main_annotation_ids', [])
        candidates = [issue.get('candidate_annotation_ids', [])] if 'candidate_annotation_ids' in issue else [
            item['candidate_annotation_ids'] for item in issue.get('evidence', [])]
        kinds = set()
        for candidate in candidates:
            for shapes in self.geometries:
                if main and candidate and set(main+candidate) <= shapes.keys():
                    coverage = AnnotationCoverage.compare([shapes[i] for i in main], [shapes[i] for i in candidate])
                    if coverage.right_only:
                        kinds.add('missing_content')
                    if coverage.left_only:
                        kinds.add('extra_content')
        if not kinds:
            # A historical visual finding can concern object coverage beyond identical source geometry.
            # Preserve that frozen record; live submission validation rejects this type.
            return [issue]
        restored = []
        for kind in ('missing_content', 'extra_content'):
            if kind not in kinds:
                continue
            item = {**issue, 'type': kind}
            if restored and 'issue_id' in item:
                item['issue_id'] = 'issue_' + hashlib.sha256((issue['issue_id']+kind).encode()).hexdigest()
            restored.append(item)
        return restored
