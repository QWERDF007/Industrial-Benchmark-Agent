"""Frozen distribution facts and validated model impact assessments, shared by both scopes."""
from collections import Counter

import numpy as np
from scipy.stats import entropy

from iad_core.audit.distribution import AuditDistributions
from iad_core.audit.quality_models import QualityDistributionEvidence, QualityDistributionReview, QualityScoreItem
from iad_core.dataset.heatmap import DistributionHeatmap
from iad_core.audit.distribution_groups import DistributionBasis, DistributionGroups, IMAGE_SUPPORT, INSTANCE_SUPPORT, BALANCE_TOLERANCE


DISTRIBUTION_RULES = {
    'class_balance': ('类别覆盖与均衡', 40),
    'image_geometry': ('图像尺寸与比例失衡', 15),
    'instance_geometry': ('实例尺寸、比例与面积失衡', 20),
    'instance_count': ('每图实例数量失衡', 10),
    'instance_position': ('实例位置覆盖失衡', 10),
    'capture_source': ('采集来源失衡', 5),
}
VISUAL_CAUSES = {'B1': 'instance_geometry', 'B2': 'instance_geometry',
    'B3': 'instance_position', 'B4': 'instance_position', 'C3': 'instance_count', 'C4': 'instance_count'}


class ResolvedDistributionReview(QualityDistributionReview):
    evidence: list[QualityDistributionEvidence]
    basis: str
    base_deduction: float


class AuditDistributionScoring:
    def __init__(self, manifest):
        self.data = data = AuditDistributions(manifest)
        self.facts = []
        scopes = [('overall', data.images)]
        if len(data.datasets) > 1:
            scopes.extend((sid, [image for image in data.images if image.registration.sample.dataset_id == sid])
                for sid in data.datasets)
        self.scope_images = dict(scopes)
        for scope_id, images in scopes:
            axes = {axis: {'ref': f'{scope_id}:{axis}', 'metrics': []} for axis in DISTRIBUTION_RULES}
            class_images, class_instances = Counter(), Counter()
            for image in images:
                class_images.update(image.categories)
                class_instances.update(annotation.raw_label for annotation in image.annotations)
            for name, counts in [('图像类别', class_images), ('实例类别', class_instances),
                ('每图实例数', Counter(str(len(image.annotations)) for image in images)
                    if data.dataset_format == 'labelme' else Counter())]:
                axis = 'instance_count' if name == '每图实例数' else 'class_balance'
                if counts:
                    axes[axis]['metrics'].append(self.categorical(name, counts))
            for name, (x, y) in data.heatmap_measures.items():
                xs, ys = data.values(images, x), data.values(images, y)
                if not xs:
                    continue
                heatmap = DistributionHeatmap.build(xs, ys, bins=8)
                axis = 'image_geometry' if name == 'image_dimensions' else (
                    'instance_position' if name == 'box_centers' else 'instance_geometry')
                axes[axis]['metrics'].append({'name': name, 'count': len(xs),
                    'x_edges': list(heatmap.x_edges), 'y_edges': list(heatmap.y_edges),
                    'cells': heatmap.cells,
                    'x_quantiles': np.quantile(xs, [0, .25, .5, .75, 1]).round(5).tolist(),
                    'y_quantiles': np.quantile(ys, [0, .25, .5, .75, 1]).round(5).tolist()})
            for measure in data.histogram_measures:
                values = data.values(images, measure)
                if not values:
                    continue
                counts, edges = np.histogram(values, bins=16)
                axis = 'image_geometry' if measure.startswith('image_') else 'instance_geometry'
                axes[axis]['metrics'].append({'name': measure, 'count': len(values),
                    'edges': edges.tolist(), 'counts': counts.tolist()})
            for field in ('batch_id', 'station', 'camera', 'data_origin'):
                counts = Counter(str(getattr(image.registration.sample, field)) for image in images
                    if getattr(image.registration.sample, field) not in (None, '', 'UNKNOWN'))
                if counts:
                    axes['capture_source']['metrics'].append(self.categorical(field, counts))
            self.facts.append({'scope_id': scope_id, 'image_count': len(images), 'axes': axes})

    @staticmethod
    def categorical(name, counts):
        values = list(counts.values())
        return {'name': name, 'counts': dict(sorted(counts.items())), 'count': sum(values),
            'normalized_entropy': float(entropy(values)/np.log(len(values))) if len(values) > 1 else 1,
            'min_max_ratio': min(values)/max(values)}

    def context(self):
        for scope in self.facts:
            basis = self.category_basis(scope)
            scope['axes']['class_balance'].update(base_deduction=basis.deduction,basis=basis.name,
                contributions=[item.model_dump(exclude_none=True) for item in basis.evidence])
            scope['scoring_policy'] = dict(image_support=IMAGE_SUPPORT,instance_support=INSTANCE_SUPPORT,
                balance_tolerance=BALANCE_TOLERANCE,maximums={k:v[1] for k,v in DISTRIBUTION_RULES.items()})
        return self.facts

    def category_basis(self, scope: dict) -> DistributionBasis:
        metrics = {metric['name']:metric for metric in scope['axes']['class_balance']['metrics']}
        image_counts = metrics.get('图像类别',{}).get('counts',{})
        instance_counts = metrics.get('实例类别',{}).get('counts',{})
        choices = []
        for name,counts,support in (('图像类别',image_counts,IMAGE_SUPPORT),('实例类别',instance_counts,INSTANCE_SUPPORT)):
            if not counts:
                continue
            labels = sorted(counts)
            points = DistributionGroups.contributions([counts[label] for label in labels],DISTRIBUTION_RULES['class_balance'][1],support)
            choices.append(DistributionBasis(name,[QualityDistributionEvidence(metric='category',bucket=label,
                image_count=image_counts.get(label),annotation_count=instance_counts.get(label),
                image_denominator=scope['image_count'],annotation_denominator=sum(instance_counts.values()) or None,
                basis=name,base_deduction=point) for label,point in zip(labels,points) if point>0]))
        return max(choices,key=lambda item:item.deduction,default=DistributionBasis('图像类别',[]))

    def validate(self, reviews) -> list[ResolvedDistributionReview]:
        parsed = [QualityDistributionReview.model_validate(value) for value in reviews]
        scopes = {scope['scope_id']:scope for scope in self.facts}
        expected = {(scope['scope_id'],axis) for scope in self.facts for axis in DISTRIBUTION_RULES}
        if len(parsed)!=len(expected) or {(r.scope_id,r.axis) for r in parsed}!=expected:
            raise ValueError('分布判断必须完整覆盖统计范围和六个评分方向，且不得重复')
        resolved = []
        for review in parsed:
            scope = scopes[review.scope_id]
            facts = scope['axes'][review.axis]
            if set(review.evidence_refs)!={facts['ref']}:
                raise ValueError('分布判断只能使用本方向真实的统计引用')
            if review.status is None or review.level is not None or review.affected:
                raise ValueError('分布评分必须提交判断状态、真实分组和影响系数')
            if len(set(review.overlap_codes))!=len(review.overlap_codes) or any(VISUAL_CAUSES.get(code)!=review.axis for code in review.overlap_codes):
                raise ValueError('同因去重只能引用本方向的真实视觉评分代码')
            if (review.status=='problem')!=(review.coefficient is not None):
                raise ValueError('只有实际扣分项需要影响系数，系数不得缺失')
            if not facts['metrics'] and review.status!='not_applicable':
                raise ValueError('没有统计依据的方向应标为不适用')
            basis = DistributionBasis('',[])
            if review.axis=='class_balance':
                if review.comparisons:
                    raise ValueError('类别分布由程序按全部实际类别计算，不自定义分组')
                basis = self.category_basis(scope)
                if (review.status=='problem')!=(basis.deduction>0):
                    raise ValueError('类别长尾判断须与实际类别基础扣分一致')
            elif review.status=='problem':
                if not review.comparisons or len({c.metric for c in review.comparisons})!=len(review.comparisons):
                    raise ValueError('分布问题须提供真实、互斥且完整的比较分组')
                metrics = {metric['name']:metric for metric in facts['metrics']}
                groups = DistributionGroups(self.data,self.scope_images[review.scope_id],metrics)
                basis = max((groups.evaluate(c,DISTRIBUTION_RULES[review.axis][1]) for c in review.comparisons),
                    key=lambda item:item.deduction)
                if not basis.deduction:
                    raise ValueError('均衡分布不能标为需要扣分的问题')
            elif review.comparisons:
                raise ValueError('正常或不适用方向不填写扣分分组')
            resolved.append(ResolvedDistributionReview(**review.model_dump(),basis=basis.name,
                base_deduction=basis.deduction,evidence=basis.evidence))
        return resolved

    @staticmethod
    def items(reviews: list[QualityDistributionReview], scope_id: str, *, factor: float) -> list[QualityScoreItem]:
        result = []
        for review in reviews:
            if review.scope_id!=scope_id:
                continue
            if not isinstance(review,ResolvedDistributionReview):
                raise ValueError('分布评分须先校验并解析冻结统计')
            maximum = DISTRIBUTION_RULES[review.axis][1]
            deduction = min(maximum,review.base_deduction*review.coefficient) if review.coefficient is not None else 0
            scale = deduction/review.base_deduction if review.base_deduction else 0
            evidence = [item.model_copy(update={'base_deduction':item.base_deduction*factor,
                'deduction':item.base_deduction*scale*factor}) for item in review.evidence]
            result.append(QualityScoreItem(code=review.axis,dimension='diversity',direction='分布多样性',
                label=DISTRIBUTION_RULES[review.axis][0],maximum=maximum*factor,count=0,denominator=0,ratio=None,
                deduction=deduction*factor,base_deduction=review.base_deduction*factor,
                impact_coefficient=review.coefficient,scoring_basis=review.basis,
                analysis=review.analysis,scenario=review.grouping,cause=review.axis,overlap_codes=review.overlap_codes,
                distribution_evidence=evidence))
        return result

    @staticmethod
    def suppress_overlaps(items):
        for axis in set(VISUAL_CAUSES.values()):
            statistical = [item for item in items if item.cause == axis and item.deduction is not None]
            codes = {code for item in statistical for code in item.overlap_codes}
            visual = [item for item in items if item.code in codes and item.deduction is not None]
            if not statistical or not visual:
                continue
            if sum(item.deduction for item in statistical) >= sum(item.deduction for item in visual):
                for item in visual:
                    if item.deduction:
                        item.deduction, item.suppressed_by = 0, statistical[0].code
            else:
                for item in statistical:
                    if item.deduction:
                        item.deduction, item.suppressed_by = 0, max(visual, key=lambda i: i.deduction).code
                        for evidence in item.distribution_evidence:
                            evidence.deduction = 0
