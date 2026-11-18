from collections import Counter, defaultdict

from iad_core.audit.pair_scoring import AuditPairScoring
from iad_core.audit.distribution_scoring import AuditDistributionScoring

from scipy.cluster.hierarchy import DisjointSet

from iad_core.audit.quality_models import (
    AuditScope, AuditScoreWeights, ConsistencyImpactReview, ConsistencyScoreWeights, QualityComparison, QualityDistributionReview, QualityDimension,
    QualityImage, QualityScore, QualityScoreItem, QualitySceneAlias,
)

DIVERSITY_RULES = (
    ('A2', '缺陷类别与形态', '类内视觉变化覆盖不足', 10),
    ('B1', '缺陷尺寸与位置', '微小缺陷样本稀缺', 8),
    ('B2', '缺陷尺寸与位置', '其他尺寸层次失衡', 7),
    ('B3', '缺陷尺寸与位置', '边缘、角落位置稀缺', 6),
    ('B4', '缺陷尺寸与位置', '关键结构区域缺陷稀缺', 4),
    ('C1', '对比度', '低对比度缺陷稀缺', 8),
    ('C2', '对比度', '其他对比度层次失衡', 5),
    ('C3', '缺陷组合', '同类多缺陷图像稀缺', 4),
    ('C4', '缺陷组合', '跨类别组合图像稀缺', 3),
    ('D1', '困难良品', '困难良品稀缺', 16),
    ('D2', '困难良品', '困难良品内部类型稀缺', 5),
    ('D4', '困难良品', '特殊正常纹理稀缺', 4),
)


FULL_DISTRIBUTION_WEIGHT = .5


class AuditQualityScorer:
    def score(self, images: list[QualityImage], weights: ConsistencyScoreWeights | None = None, *,
            exact_groups: list[list[str]] | None = None, redundant_groups: list[list[str]] | None = None,
            aliases: list[QualitySceneAlias] = (), scope: AuditScope = 'full',
            comparisons: list[QualityComparison] = (), distribution_reviews: list[QualityDistributionReview] | None = None,
            dataset_id: str | None = None, consistency_reviews: list[ConsistencyImpactReview] | None = None) -> QualityScore:
        weights = weights if weights is not None else (AuditScoreWeights() if scope == 'full' else ConsistencyScoreWeights())
        if isinstance(weights, AuditScoreWeights) != (scope == 'full'):
            raise ValueError('综合得分系数与审计范围不符')
        completed = [image for image in images if image.completed]
        comparisons = [QualityComparison.model_validate(c) for c in comparisons]
        reviews = [QualityDistributionReview.model_validate(r) for r in distribution_reviews] if distribution_reviews is not None else None
        if consistency_reviews is not None:
            facts = AuditPairScoring.context(images, comparisons) if dataset_id is None else [dict(scope_id=dataset_id,
                items=[dict(code=item.code,ref=f'{dataset_id}:{item.code}')
                    for item in AuditPairScoring.base_items(images,comparisons) if item.base_deduction])]
            consistency_reviews = AuditPairScoring.validate(consistency_reviews, facts)
        items = AuditPairScoring.score(images, comparisons, consistency_reviews, dataset_id or 'overall')
        items.extend(AuditDistributionScoring.items(reviews or [], dataset_id or 'overall', factor=FULL_DISTRIBUTION_WEIGHT if scope == 'full' else 1))
        diversity_ready = bool(completed) and all(image.observation_complete for image in completed)
        if scope == 'full':
            visual = self.diversity(completed, aliases, diversity_ready)
            factor = 100*(1-FULL_DISTRIBUTION_WEIGHT)/sum(rule[3] for rule in DIVERSITY_RULES)
            for item in visual:
                item.maximum *= factor
                if item.deduction is not None:
                    item.deduction *= factor
            items.extend(visual)
            AuditDistributionScoring.suppress_overlaps(items)
        redundancy_ready = bool(completed) and exact_groups is not None and redundant_groups is not None
        if scope == 'full':
            items.extend(self.redundancy(completed, exact_groups or [], redundant_groups or [], redundancy_ready))
        dimensions = {}
        for key, label in (('consistency', '数据一致性'), ('diversity', '数据多样性'), ('redundancy', '数据冗余度')):
            if scope == 'consistency' and key == 'redundancy':
                continue
            selected = [item for item in items if item.dimension == key]
            deduction = sum(item.deduction for item in selected) if all(item.deduction is not None for item in selected) else None
            if key == 'diversity' and reviews is None:
                deduction = None
            dimensions[key] = QualityDimension(label=label, deduction=deduction,
                score=max(0, 100-deduction) if deduction is not None else None)
        limitations = []
        if dimensions['consistency'].score is None:
            limitations.append('一致性影响系数尚未完成模型判断')
        if reviews is None:
            limitations.append('分布评分尚未完成模型判断')
        if len(completed) != len(images) or not images:
            limitations.append('审计图像尚未全部完成')
        if scope == 'full' and not diversity_ready:
            limitations.append('视觉场景归类证据不完整')
        if scope == 'full' and exact_groups is None:
            limitations.append('严格重复关系未完成冻结')
        if scope == 'full' and redundant_groups is None:
            limitations.append('低信息增量相似图尚未完成图证确认')
        effective_weights = weights.normalized()
        result = QualityScore(status='insufficient' if limitations else 'complete',
            total=None if limitations else sum(effective_weights[key] * value.score for key, value in dimensions.items()),
            weights=effective_weights, total_images=len(images), completed_images=len(completed),
            observed_images=sum(image.observation_complete for image in completed),
            limitations=limitations, items=items, dimensions=dimensions)
        dataset_ids = sorted({image.dataset_id for image in images})
        for dataset_id in dataset_ids:
            if len(dataset_ids) == 1:
                child = result
            else:
                child = self.score([image for image in images if image.dataset_id == dataset_id], weights,
                    exact_groups=exact_groups, redundant_groups=redundant_groups, aliases=aliases, scope=scope,
                    comparisons=comparisons, distribution_reviews=reviews, dataset_id=dataset_id,
                    consistency_reviews=[r for r in consistency_reviews if r.scope_id == dataset_id] if consistency_reviews is not None else None)
            result.dataset_scores.append(child.model_copy(update={'dataset_id': dataset_id, 'dataset_scores': []}))
        return result

    def diversity(self, images: list[QualityImage], aliases: list[QualitySceneAlias], ready: bool) -> list[QualityScoreItem]:
        names = {(item.axis, item.source): item.canonical for item in aliases}
        candidates, denominators = defaultdict(list), {}
        defects = [(image, defect, f'{image.sample_id}:{index}') for image in images for index, defect in enumerate(image.defects)]

        def add(code, values, denominator, *, distribution=False, select=None, category='', cause_axis=''):
            buckets = defaultdict(list)
            for value, member_id, sample_id in values:
                buckets[value].append((member_id, sample_id))
            denominators[code] = max(denominators.get(code, 0), denominator)
            for scenario, members in buckets.items():
                if not scenario or select is not None and not select(scenario):
                    continue
                count = len(members)
                ratio = count / denominator if denominator else 0
                scarcity = (max(0, min(1, (20-count)/19)) + max(0, min(1, (.10-ratio)/.08))) / 2
                if distribution and len(buckets) < 2:
                    scarcity = 0
                cause = (cause_axis, category, scenario, tuple(sorted(member[0] for member in members)))
                candidates[code].append((scarcity, count, denominator, f'{category}：{scenario}' if category else scenario, sorted({member[1] for member in members}), cause))

        categories = sorted({defect.category for _, defect, _ in defects})
        for category in categories:
            group = [(image, defect, identity) for image, defect, identity in defects if defect.category == category]
            for code, axis, selected in (
                ('A2', 'morphology', None), ('A2', 'special_morphology', None), ('A2', 'appearance', None),
                ('B1', 'size', lambda value: value == 'tiny'), ('B2', 'size', lambda value: value != 'tiny'),
                ('B3', 'location', lambda value: value in ('edge', 'corner')), ('B4', 'structural_region', None),
                ('C1', 'contrast', lambda value: value == 'low'), ('C2', 'contrast', lambda value: value != 'low')):
                values = [(names.get((axis, getattr(defect, axis)), getattr(defect, axis)), identity, image.sample_id)
                    for image, defect, identity in group]
                add(code, values, len(group), distribution=True, select=selected, category=category,
                    cause_axis='visual' if code.startswith('A') else axis)
        abnormal = [image for image in images if not image.is_normal]
        same_class, cross_class = [], []
        for image in abnormal:
            counts = Counter(defect.category for defect in image.defects)
            if len(counts) == 1 and sum(counts.values()) > 1:
                same_class.append((next(iter(counts)), image.sample_id, image.sample_id))
            elif len(counts) > 1:
                cross_class.append((' + '.join(sorted(counts)), image.sample_id, image.sample_id))
        add('C3', same_class, len(abnormal), cause_axis='same-class')
        add('C4', cross_class, len(abnormal), cause_axis='cross-class')
        normal = [image for image in images if image.is_normal and image.normal]
        hard = [image for image in normal if image.normal.hard and image.normal.qualification]
        hard_types = {names.get(('hard_type', image.normal.hard_type), image.normal.hard_type) for image in hard}
        add('D1', [(next(iter(hard_types)) if len(hard_types) == 1 else '困难良品', image.sample_id, image.sample_id)
            for image in hard], len(normal), cause_axis='normal')
        add('D2', [(names.get(('hard_type', image.normal.hard_type), image.normal.hard_type), image.sample_id, image.sample_id)
            for image in hard], len(hard), distribution=True, cause_axis='normal')
        add('D4', [(names.get(('texture', image.normal.texture), image.normal.texture), image.sample_id, image.sample_id)
            for image in normal if image.normal.texture and image.normal.texture_reason], len(normal), cause_axis='normal')
        items, causes = [], {}
        for code, direction, label, maximum in DIVERSITY_RULES:
            candidate = max(candidates[code], key=lambda item: (item[0], item[3]), default=None)
            scarcity, count, denominator, scenario, sample_ids, cause = candidate or (0, 0, denominators.get(code, 0), '', [], None)
            items.append(QualityScoreItem(code=code, dimension='diversity', direction=direction, label=label,
                maximum=maximum, count=count, denominator=denominator, ratio=count/denominator if denominator else None,
                deduction=maximum*scarcity if ready else None, scenario=scenario, sample_ids=sample_ids))
            if cause is not None:
                causes[code] = cause
        for item in sorted(items, key=lambda item: (-(item.deduction or 0), item.code)):
            if not item.deduction:
                continue
            winner = next((other for other in items if other.code != item.code and other.deduction
                and other.suppressed_by is None and causes.get(other.code) == causes.get(item.code)
                and (other.deduction > item.deduction or other.deduction == item.deduction and other.code < item.code)), None)
            if winner:
                item.deduction, item.suppressed_by = 0, winner.code
        return items

    def redundancy(self, images: list[QualityImage], exact_groups: list[list[str]], redundant_groups: list[list[str]],
            ready: bool) -> list[QualityScoreItem]:
        identities = {image.sample_id for image in images}
        exact_extras, similar_extras, representatives = set(), set(), {}
        for group in exact_groups:
            members = sorted(identities.intersection(group))
            if members:
                representatives.update(dict.fromkeys(members, members[0]))
                exact_extras.update(members[1:])
        similar = DisjointSet()
        for group in redundant_groups:
            members = sorted({representatives.get(identity, identity) for identity in identities.intersection(group)})
            for identity in members:
                similar.add(identity)
            for identity in members[1:]:
                similar.merge(members[0], identity)
        for group in similar.subsets():
            similar_extras.update(sorted(group)[1:])
        return [QualityScoreItem(code=code, dimension='redundancy', direction='样本冗余', label=label,
            maximum=maximum, count=len(extras), denominator=len(images), ratio=len(extras)/len(images) if images else None,
            deduction=min(maximum, coefficient*len(extras)/len(images)) if ready else None, sample_ids=sorted(extras))
            for code, label, maximum, coefficient, extras in (
                ('E', '严格重复的额外图像', 70, 150, exact_extras), ('V', '低信息增量的额外相似图像', 30, 75, similar_extras))]
