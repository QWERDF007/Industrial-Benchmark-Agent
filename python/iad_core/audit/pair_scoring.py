"""Frozen comparison statistics and image-level consistency deductions."""
from collections import defaultdict
from math import sqrt

from iad_core.audit.quality_models import ConsistencyImpactReview, QualityComparison, QualityImage, QualityScoreItem
from iad_core.consistency.conflict_categories import CONFLICT_RULES, primary_conflict_category
from iad_core.consistency.annotation_issues import ISSUE_CATEGORIES


CONSISTENCY_RULES = {
    'category_mismatch': ('类别不一致', 100),
    'instance_count_mismatch': ('少标/多标实例', 100),
    'coverage_mismatch': ('少标/多标内容', 30),
    'split': ('拆分', 0), 'merge': ('合并', 0), 'position_difference': ('位置差异', 0),
}


class AuditPairScoring:
    @staticmethod
    def comparisons(records) -> list[QualityComparison]:
        comparisons = []
        for record in records:
            categories = defaultdict(set)
            for assessment in getattr(record.result, 'assessments', []):
                if assessment.verdict in ('MATERIAL', 'EQUIVALENT'):
                    categories[assessment.candidate_id]
            for issue in record.result.issues:
                for reference in issue.evidence:
                    categories[reference.candidate_id].add(ISSUE_CATEGORIES[issue.type])
            comparisons.extend(QualityComparison(main_id=record.summary.anchor_id, candidate_id=candidate,
                categories=sorted(values)) for candidate, values in categories.items())
        return comparisons

    @staticmethod
    def base_items(images: list[QualityImage], comparisons: list[QualityComparison]) -> list[QualityScoreItem]:
        identities = {image.sample_id for image in images}
        pairs = defaultdict(set)
        for item in comparisons:
            if item.main_id == item.candidate_id:
                raise ValueError('计分图对不能是同一图像')
            if item.main_id in identities or item.candidate_id in identities:
                pairs[tuple(sorted((item.main_id, item.candidate_id)))].update(item.categories)
        buckets, charged = defaultdict(list), {}
        priority = {code:i for i,code in enumerate(CONSISTENCY_RULES)}
        for pair, categories in pairs.items():
            category = primary_conflict_category(categories)
            if category is None:
                continue
            kind = CONFLICT_RULES[category].issue_type
            code = ('instance_count_mismatch' if kind in ('missing_annotation', 'extra_annotation') else
                'coverage_mismatch' if kind in ('missing_content', 'extra_content') else kind)
            buckets[code].append(pair)
            for member in set(pair) & identities:
                if member not in charged or priority[code] < priority[charged[member]]:
                    charged[member] = code
        members_by_code = {code: sorted(sid for sid,value in charged.items() if value == code) for code in CONSISTENCY_RULES}
        category = len(members_by_code['category_mismatch'])
        instance = len(members_by_code['instance_count_mismatch'])
        serious = category + instance
        base = min(100, 150*sqrt(serious/len(images))) if images else 0
        bases = {'category_mismatch':base*category/serious if serious else 0,
            'instance_count_mismatch':base*instance/serious if serious else 0,
            'coverage_mismatch':30*sqrt(len(members_by_code['coverage_mismatch'])/len(images)) if images else 0}
        result = []
        for code, (label, maximum) in CONSISTENCY_RULES.items():
            members = sorted({sid for pair in buckets[code] for sid in pair} & identities)
            result.append(QualityScoreItem(code=code, dimension='consistency', direction='标注一致性',
                label=label, maximum=maximum, count=len(members), denominator=len(images),
                ratio=len(members)/len(images) if images else None, sample_ids=members,
                charged_count=len(members_by_code[code]), base_deduction=bases.get(code, 0),
                deduction=None if maximum and bases[code] else (0 if images else None),
                pair_count=len(buckets[code]), compared_pairs=len(pairs)))
        return result

    @classmethod
    def context(cls, images: list[QualityImage], comparisons: list[QualityComparison]) -> list[dict]:
        scopes = [('overall',images)]
        datasets = sorted({image.dataset_id for image in images})
        if len(datasets) > 1:
            scopes.extend((sid,[image for image in images if image.dataset_id == sid]) for sid in datasets)
        return [dict(scope_id=sid, image_count=len(members), items=[dict(code=item.code,
            ref=f'{sid}:{item.code}', label=item.label, charged_count=item.charged_count,
            ratio=item.charged_count/len(members), base_deduction=item.base_deduction) for item in cls.base_items(members,comparisons)
            if item.base_deduction]) for sid,members in scopes]

    @staticmethod
    def validate(reviews, facts: list[dict]) -> list[ConsistencyImpactReview]:
        parsed = [ConsistencyImpactReview.model_validate(value) for value in reviews]
        expected = {(scope['scope_id'], item['code']):item['ref'] for scope in facts for item in scope['items']}
        if len(parsed) != len(expected) or {(r.scope_id,r.code) for r in parsed} != set(expected):
            raise ValueError('一致性系数必须完整覆盖本范围实际扣分项，且不得重复')
        if any(set(r.evidence_refs) != {expected[r.scope_id,r.code]} for r in parsed):
            raise ValueError('一致性系数只能引用本范围、本扣分项的真实统计')
        return parsed

    @classmethod
    def score(cls, images, comparisons, reviews, scope_id='overall') -> list[QualityScoreItem]:
        items = cls.base_items(images, comparisons)
        factors = {review.code:review for review in reviews or [] if review.scope_id == scope_id}
        for item in items:
            if item.base_deduction and item.code in factors:
                review = factors[item.code]
                item.impact_coefficient, item.analysis = review.coefficient, review.analysis
                item.deduction = item.base_deduction*review.coefficient
        serious = items[:2]
        if all(item.deduction is not None for item in serious):
            total = sum(item.deduction for item in serious)
            if total > 100:
                for item in serious:
                    item.deduction *= 100/total
            content = items[2]
            if content.deduction is not None:
                content.deduction = min(content.maximum,content.deduction,max(0,100-sum(item.deduction for item in serious)))
        return items
