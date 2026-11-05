import json
from collections import Counter
from statistics import median
from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.workbench.report import QualityRatio


class ReportDistribution(AnalysisModel):
    count: int = Field(ge=0)
    minimum: float | None
    median: float | None
    maximum: float | None


class ReportTechnicalEvidence(AnalysisModel):
    image_decoding: QualityRatio
    decode_statuses: dict[str, int]
    annotation_geometry: QualityRatio
    geometry_statuses: dict[str, int]
    annotation_parse_error_samples: int = Field(ge=0)
    annotation_source_sizes: QualityRatio
    source_size_unknown_annotations: int = Field(ge=0)
    bbox_scale: dict[Literal['width_fraction', 'height_fraction', 'area_fraction'], ReportDistribution]

    @classmethod
    def from_records(cls, samples, annotations, issues, pixels):
        samples = {sample['sample_id']: sample for sample in samples}
        observed = set(samples) | {issue['sample_id'] for issue in issues if issue['sample_id']}
        unavailable = {issue['sample_id'] for issue in issues if issue['issue_type']=='INVALID_IMAGE'}
        decoding = {pixel['sample_id']: pixel['decode_status'] for pixel in pixels}
        decode_statuses = Counter(decoding.get(identity, 'UNAVAILABLE' if identity in unavailable else 'UNKNOWN') for identity in observed)
        spatial = [annotation for annotation in annotations if annotation['annotation_type'] in ('bbox', 'polygon', 'mask')]
        geometry = Counter(annotation['geometry_status'] for annotation in spatial)
        declared = [annotation for annotation in spatial if annotation['source_width'] is not None and annotation['source_height'] is not None]
        matching = sum((annotation['source_width'], annotation['source_height']) ==
            (samples[annotation['sample_id']]['width'], samples[annotation['sample_id']]['height']) for annotation in declared)
        scales = dict(width_fraction=[], height_fraction=[], area_fraction=[])
        for annotation in spatial:
            if annotation['geometry_status']=='INVALID' or not annotation['bbox_json']:
                continue
            x1, y1, x2, y2 = json.loads(annotation['bbox_json'])
            sample = samples[annotation['sample_id']]
            width, height = (x2-x1)/sample['width'], (y2-y1)/sample['height']
            scales['width_fraction'].append(width)
            scales['height_fraction'].append(height)
            scales['area_fraction'].append(width*height)
        return cls(
            image_decoding=QualityRatio(numerator=decode_statuses['COMPLETE'], denominator=len(observed),
                basis='最近扫描完成原始像素解码的图像 / 登记及扫描拒绝图像；未支持或缺解码记录单独保留，不以标注错误判图像不可读'),
            decode_statuses=dict(decode_statuses),
            annotation_geometry=QualityRatio(numerator=len(spatial)-geometry['INVALID'], denominator=len(spatial),
                basis='扫描几何策略处理后非INVALID的空间标注 / 已解析空间标注；裁剪和缩放状态分别保留，不代表业务语义确认'),
            geometry_statuses=dict(geometry),
            annotation_parse_error_samples=len({issue['sample_id'] for issue in issues if issue['issue_type']=='ANNOTATION_PARSE_ERROR'}),
            annotation_source_sizes=QualityRatio(numerator=matching, denominator=len(declared),
                basis='声明尺寸与原图相同的空间标注 / 带完整尺寸声明的空间标注；只核对尺寸，不证明图像内容或标注完整性'),
            source_size_unknown_annotations=len(spatial)-len(declared),
            bbox_scale={key: ReportDistribution(count=len(values), minimum=min(values) if values else None,
                median=median(values) if values else None, maximum=max(values) if values else None)
                for key, values in scales.items()})
