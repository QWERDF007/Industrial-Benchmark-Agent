"""Continuous distribution penalties and exact grouping of frozen observations."""
from collections import defaultdict
from dataclasses import dataclass

import numpy as np

from iad_core.audit.distribution import AuditDistributions, DistributionImage
from iad_core.audit.quality_models import (
    DistributionBinsReference, DistributionGroupReference, DistributionMetricGrouping, QualityDistributionEvidence,
)

IMAGE_SUPPORT = 50
INSTANCE_SUPPORT = 100
BALANCE_TOLERANCE = 2


@dataclass(frozen=True)
class DistributionBasis:
    name: str
    evidence: list[QualityDistributionEvidence]

    @property
    def deduction(self) -> float:
        return sum(item.base_deduction for item in self.evidence)


class DistributionGroups:
    def __init__(self, data: AuditDistributions, images: list[DistributionImage], metrics: dict):
        self.data, self.images, self.metrics = data, images, metrics

    @staticmethod
    def contributions(counts: list[int], maximum: float, support: int) -> list[float]:
        if len(counts) < 2 or not max(counts,default=0):
            return [0.0 for _ in counts]
        largest = max(counts)
        return [maximum/len(counts)*max(0,1-BALANCE_TOLERANCE*count/largest)
            *(.6+.4*max(0,1-count/support)) for count in counts]

    def evaluate(self, comparison: DistributionMetricGrouping, maximum: float) -> DistributionBasis:
        metric = self.metrics.get(comparison.metric)
        if metric is None or len({group.label for group in comparison.groups}) != len(comparison.groups):
            raise ValueError('分组须引用本方向的实际统计，组名不得重复')
        tokens, owners = [], []
        categorical = 'counts' in metric
        for image in self.images:
            sid = image.registration.sample.sample_id
            if categorical:
                value = str(len(image.annotations)) if comparison.metric == '每图实例数' else str(
                    getattr(image.registration.sample,comparison.metric))
                if value in metric['counts']:
                    tokens.append(value)
                    owners.append(sid)
            else:
                measures = self.data.heatmap_measures.get(comparison.metric,(comparison.metric,))
                columns = [self.data.values([image],measure) for measure in measures]
                for values in zip(*columns):
                    indexes = []
                    for axis,value in enumerate(values):
                        edges = metric['edges'] if len(values)==1 else metric['x_edges' if axis==0 else 'y_edges']
                        indexes.append(int(np.clip(np.searchsorted(edges,value,side='right')-1,0,len(edges)-2)))
                    tokens.append(tuple(indexes))
                    owners.append(sid)
        indexed = defaultdict(set)
        for index,token in enumerate(tokens):
            indexed[token].add(index)
        occupied, observations, readings = set(), [], []
        for group in comparison.groups:
            selected = set()
            for member in group.members:
                if member.metric != comparison.metric:
                    raise ValueError('同一比较口径不能混用其他统计')
                if isinstance(member,DistributionGroupReference):
                    if not categorical or member.bucket not in metric['counts']:
                        raise ValueError('分组须引用真实的统计值')
                    values = {member.bucket}
                elif isinstance(member,DistributionBinsReference):
                    if categorical:
                        raise ValueError('分类统计不能引用分箱')
                    x0,x1 = member.x
                    edges = metric.get('edges',metric.get('x_edges',[]))
                    if not 0 <= x0 <= x1 < len(edges)-1 or ('y_edges' in metric) != (member.y is not None):
                        raise ValueError('分组分箱范围无效')
                    if member.y is None:
                        values = {(x,) for x in range(x0,x1+1)}
                    else:
                        y0,y1 = member.y
                        if not 0 <= y0 <= y1 < len(metric['y_edges'])-1:
                            raise ValueError('分组分箱范围无效')
                        values = {(x,y) for x in range(x0,x1+1) for y in range(y0,y1+1)}
                if selected & values or occupied & values:
                    raise ValueError('分组范围不得重复或重叠')
                selected.update(values)
            occupied.update(selected)
            indices = set().union(*(indexed[token] for token in selected))
            if not indices:
                raise ValueError('分组不能编造未出现的场景')
            observations.append(indices)
            image_count = len({owners[i] for i in indices})
            readings.append(QualityDistributionEvidence(metric=comparison.metric,bucket=group.label,
                image_count=image_count,image_denominator=len(self.images),
                annotation_count=None if categorical or comparison.metric.startswith('image_') else len(indices),
                annotation_denominator=None if categorical or comparison.metric.startswith('image_') else len(tokens)))
        if set().union(*observations) != set(range(len(tokens))):
            raise ValueError('分组必须覆盖本统计全部有效数据')
        image_points = self.contributions([r.image_count for r in readings],maximum,IMAGE_SUPPORT)
        choices = [('图像',image_points)]
        if readings[0].annotation_count is not None:
            choices.append(('实例',self.contributions([r.annotation_count for r in readings],maximum,INSTANCE_SUPPORT)))
        basis, points = max(choices,key=lambda item:sum(item[1]))
        return DistributionBasis(comparison.metric+':'+basis,[reading.model_copy(update={
            'base_deduction':point,'basis':basis}) for reading,point in zip(readings,points) if point>0])
