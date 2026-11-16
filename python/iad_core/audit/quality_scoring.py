from collections import Counter, defaultdict

from scipy.cluster.hierarchy import DisjointSet

from iad_core.audit.quality_models import (
    AuditScoreWeights, QualityDimension, QualityImage, QualityScore, QualityScoreItem, QualitySceneAlias,
)

DIVERSITY_RULES = (
    ('A1', '缺陷类别与形态', '缺陷类别覆盖不足', 20),
    ('A2', '缺陷类别与形态', '类内视觉变化覆盖不足', 10),
    ('B1', '缺陷尺寸与位置', '微小缺陷样本稀缺', 8),
    ('B2', '缺陷尺寸与位置', '其他尺寸层次失衡', 7),
    ('B3', '缺陷尺寸与位置', '边缘、角落位置稀缺', 6),
    ('B4', '缺陷尺寸与位置', '关键结构区域缺陷稀缺', 4),
    ('C1', '对比度', '低对比度缺陷稀缺', 8),
    ('C2', '对比度', '其他对比度层次失衡', 5),
    ('C3', '缺陷组合', '同类多缺陷图像稀缺', 4),
    ('C4', '缺陷组合', '跨类别组合图像稀缺', 3),
    ('D1', '困难良品', '困难良品稀缺', 10),
    ('D2', '困难良品', '困难良品内部类型稀缺', 5),
    ('D3', '困难良品', '易混淆良品稀缺', 6),
    ('D4', '困难良品', '特殊正常纹理稀缺', 4),
)


class AuditQualityScorer:
    def score(self, images: list[QualityImage], weights: AuditScoreWeights | None = None, *,
            exact_groups: list[list[str]] | None = None, redundant_groups: list[list[str]] | None = None,
            aliases: list[QualitySceneAlias] = ()) -> QualityScore:
        weights = weights or AuditScoreWeights()
        completed = [image for image in images if image.completed]
        items = self.consistency(completed)
        diversity_ready = bool(completed) and all(image.observation_complete for image in completed)
        items.extend(self.diversity(completed, aliases, diversity_ready))
        redundancy_ready = bool(completed) and exact_groups is not None and redundant_groups is not None
        items.extend(self.redundancy(completed, exact_groups or [], redundant_groups or [], redundancy_ready))
        dimensions = {}
        for key, label in (('consistency', '数据一致性'), ('diversity', '数据多样性'), ('redundancy', '数据冗余度')):
            selected = [item for item in items if item.dimension == key]
            deduction = sum(item.deduction for item in selected) if all(item.deduction is not None for item in selected) else None
            dimensions[key] = QualityDimension(label=label, deduction=deduction,
                score=max(0, 100-deduction) if deduction is not None else None)
        limitations = []
        if len(completed) != len(images) or not images:
            limitations.append('审计图像尚未全部完成')
        if not diversity_ready:
            limitations.append('视觉场景归类证据不完整')
        if exact_groups is None:
            limitations.append('严格重复关系未完成冻结')
        if redundant_groups is None:
            limitations.append('低信息增量相似图尚未完成图证确认')
        result = QualityScore(status='insufficient' if limitations else 'complete',
            total=None if limitations else sum(weights.normalized()[key] * value.score for key, value in dimensions.items()),
            weights=weights.normalized(), total_images=len(images), completed_images=len(completed),
            observed_images=sum(image.observation_complete for image in completed),
            limitations=limitations, items=items, dimensions=dimensions)
        dataset_ids = sorted({image.dataset_id for image in images})
        for dataset_id in dataset_ids:
            if len(dataset_ids) == 1:
                child = result
            else:
                child = self.score([image for image in images if image.dataset_id == dataset_id], weights,
                    exact_groups=exact_groups, redundant_groups=redundant_groups, aliases=aliases)
            result.dataset_scores.append(child.model_copy(update={'dataset_id': dataset_id, 'dataset_scores': []}))
        return result

    def consistency(self, images: list[QualityImage]) -> list[QualityScoreItem]:
        buckets = {code: [] for code in ('category_mismatch', 'missing_annotation', 'extra_annotation')}
        for image in images:
            for code in buckets:
                if code in image.findings or code == 'category_mismatch' and 'image_label_mismatch' in image.findings:
                    buckets[code].append(image.sample_id)
                    break
        for code in ('position_difference', 'split', 'merge'):
            buckets[code] = [image.sample_id for image in images if code in image.findings]
        return [QualityScoreItem(code=code, dimension='consistency', direction='标注一致性',
            label=label, maximum=100 * severity, count=len(buckets[code]), denominator=len(images),
            ratio=len(buckets[code]) / len(images) if images else None,
            deduction=100 * severity * len(buckets[code]) / len(images) if images else None,
            sample_ids=buckets[code]) for code, label, severity in (
                ('category_mismatch', '类别不一致', 1), ('missing_annotation', '少标', 1), ('extra_annotation', '多标', .7),
                ('position_difference', '位置差异', 0), ('split', '拆分', 0), ('merge', '合并', 0))]

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

        add('A1', [(defect.category, identity, image.sample_id) for image, defect, identity in defects], len(defects),
            distribution=True, cause_axis='category')
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
        hard = [image for image in normal if image.normal.hard]
        hard_types = {names.get(('hard_type', image.normal.hard_type), image.normal.hard_type) for image in hard}
        add('D1', [(next(iter(hard_types)) if len(hard_types) == 1 else '困难良品', image.sample_id, image.sample_id)
            for image in hard], len(normal), cause_axis='normal')
        add('D2', [(names.get(('hard_type', image.normal.hard_type), image.normal.hard_type), image.sample_id, image.sample_id)
            for image in hard], len(hard), distribution=True, cause_axis='normal')
        add('D3', [(names.get(('confusable', '易混淆良品'), '易混淆良品'), image.sample_id, image.sample_id)
            for image in normal if image.normal.confusable], len(normal), cause_axis='normal')
        add('D4', [(names.get(('texture', image.normal.texture), image.normal.texture), image.sample_id, image.sample_id)
            for image in normal if image.normal.texture], len(normal), cause_axis='normal')
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
