from collections import deque
from collections.abc import Mapping
from fractions import Fraction
from typing import Literal

from pydantic import ConfigDict, Field

from iad_core.advisory.analysis import AnalysisModel


class SamplingRatio(AnalysisModel):
    model_config = ConfigDict(extra='forbid', frozen=True)
    normal: int = Field(gt=0, strict=True)
    abnormal: int = Field(gt=0, strict=True)


DEFAULT_SAMPLING_RATIO = SamplingRatio(normal=1, abnormal=1)


SamplingGroup = Literal['normal', 'abnormal', 'unclassified']


class SamplingCounts(AnalysisModel):
    normal: int = Field(default=0, ge=0)
    abnormal: int = Field(default=0, ge=0)
    unclassified: int = Field(default=0, ge=0)


class MixedSampling:
    def __init__(self, groups: Mapping[str, SamplingGroup], batch_size: int, ratio: SamplingRatio):
        self.groups, self.batch_size, self.ratio = groups, batch_size, ratio

    def batches(self) -> list[list[str]]:
        normal = deque(sid for sid, group in self.groups.items() if group == 'normal')
        abnormal = deque(sid for sid, group in self.groups.items() if group == 'abnormal')
        unclassified = deque(sid for sid, group in self.groups.items() if group == 'unclassified')
        remainder = Fraction(1, 2)
        batches = []
        while normal or abnormal or unclassified:
            count = min(self.batch_size, len(normal) + len(abnormal))
            if normal and abnormal:
                ideal = Fraction(count * self.ratio.normal, self.ratio.normal + self.ratio.abnormal)
                if count >= 2:
                    ideal = min(max(ideal, 1), count - 1)
                quota = ideal + remainder
                normal_quota = int(quota)
                remainder = quota - normal_quota
            else:
                normal_quota = count if normal else 0
            normal_count = min(normal_quota, len(normal))
            abnormal_count = min(count - normal_quota, len(abnormal))
            normal_count += min(count - normal_count - abnormal_count, len(normal) - normal_count)
            abnormal_count += min(count - normal_count - abnormal_count, len(abnormal) - abnormal_count)
            batch = [normal.popleft() for _ in range(normal_count)] + [abnormal.popleft() for _ in range(abnormal_count)]
            batch.extend(unclassified.popleft() for _ in range(min(self.batch_size - len(batch), len(unclassified))))
            batches.append(batch)
        return batches
