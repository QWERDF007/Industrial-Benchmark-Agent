from collections import Counter, defaultdict
from dataclasses import dataclass

import numpy as np
from scipy.stats import gaussian_kde

from iad_core.audit.distribution_models import (
    AuditBoxSummary, AuditCategoryBox, AuditClassCount, AuditDataDistribution,
    AuditDistributionQuery, AuditDistributionSlice, AuditHeatmap, AuditHistogram,
)
from iad_core.audit.profile_models import AuditGeometryProfile, AuditQuantiles
from iad_core.consistency.annotations import AnnotationSet
from iad_core.storage.models import Annotation
from iad_core.workbench.analysis_manifest import AnalysisManifest, AnalysisRegistration


@dataclass(frozen=True)
class DistributionImage:
    registration: AnalysisRegistration
    categories: set[str]
    boxes: list[Annotation]
    valid_boxes: list[Annotation]
    measures: dict[str, list[float]]

    @classmethod
    def capture(cls, record: AnalysisRegistration) -> 'DistributionImage':
        sample = record.sample
        if sample.width <= 0 or sample.height <= 0:
            raise ValueError('冻结图像的宽高必须为正数')
        boxes = [annotation for annotation in record.annotations if annotation.annotation_type == 'bbox']
        resolved = AnnotationSet(sample_id=sample.sample_id, dataset_id=sample.dataset_id,
            width=sample.width, height=sample.height, quality_status=sample.quality_status,
            quality_source=sample.quality_source, annotations=boxes).resolve_geometry()
        valid = [annotation for annotation in resolved.annotations if annotation.geometry_status == 'VALID']
        measures = defaultdict(list)
        for annotation in valid:
            x0, y0, x1, y1 = annotation.bbox
            width, height = x1 - x0, y1 - y0
            for key, value in dict(box_width=width, box_height=height,
                relative_width=width / sample.width, relative_height=height / sample.height,
                relative_area=width * height / (sample.width * sample.height),
                box_aspect_ratio=width / height, center_x=(x0 + x1) / (2 * sample.width),
                center_y=(y0 + y1) / (2 * sample.height)).items():
                measures[key].append(value)
        categories = {annotation.raw_label for annotation in boxes} if record.dataset_format == 'labelme' else {sample.quality_status.value}
        return cls(record, categories, boxes, valid, dict(measures))


class AuditDistributions:
    """Deterministic aggregates of the immutable audit manifest, shared by tools and reports."""

    heatmap_measures = {
        'image_dimensions': ('image_width', 'image_height'),
        'box_dimensions': ('box_width', 'box_height'),
        'relative_box_dimensions': ('relative_width', 'relative_height'),
        'box_centers': ('center_x', 'center_y'),
    }
    histogram_measures = ('image_aspect_ratio', 'box_aspect_ratio', 'relative_area')

    @classmethod
    def for_run(cls, db, run_id: str) -> 'AuditDistributions':
        from iad_core.audit.state import AuditState
        return cls(AuditState(db).snapshot(run_id).manifest)

    def __init__(self, manifest: AnalysisManifest):
        self.dataset_format = manifest.records[0].dataset_format
        self.images = [DistributionImage.capture(record) for record in manifest.records]
        self.datasets = list(manifest.dataset_ids)
        self.categories = sorted({category for image in self.images for category in image.categories})
        self.scopes = defaultdict(list)
        for image in self.images:
            for dataset_id in (None, image.registration.sample.dataset_id):
                for category in (None, *sorted(image.categories)):
                    self.scopes[dataset_id, category].append(image)
        self.edges = {}
        for measure in {key for pair in self.heatmap_measures.values() for key in pair} | set(self.histogram_measures):
            values = self.values(self.images, measure)
            if measure in ('relative_width', 'relative_height', 'center_x', 'center_y'):
                self.edges[measure] = np.linspace(min(0, min(values, default=0)), max(1, max(values, default=1)), 33)
            else:
                self.edges[measure] = np.histogram_bin_edges(values, bins=32)

    @staticmethod
    def values(images: list[DistributionImage], measure: str, category: str | None = None) -> list[float]:
        if measure == 'image_aspect_ratio':
            return [image.registration.sample.width / image.registration.sample.height for image in images]
        if measure.startswith('image_'):
            attribute = measure.removeprefix('image_')
            return [float(getattr(image.registration.sample, attribute)) for image in images]
        return [value for image in images for annotation, value in zip(image.valid_boxes, image.measures.get(measure, []))
            if category is None or annotation.raw_label == category]

    @staticmethod
    def summarize(values: list[float]) -> AuditBoxSummary | None:
        if not values:
            return None
        array = np.asarray(values)
        minimum, q25, median, q75, maximum = np.quantile(array, [0, .25, .5, .75, 1]).tolist()
        spread = 1.5 * (q75 - q25)
        inside = array[(array >= q25 - spread) & (array <= q75 + spread)]
        outliers = Counter(float(value) for value in array[(array < q25 - spread) | (array > q75 + spread)])
        return AuditBoxSummary(minimum=minimum, q25=q25, median=median, q75=q75, maximum=maximum,
            count=len(values), lower_whisker=float(inside.min()), upper_whisker=float(inside.max()),
            outliers=sorted(outliers.items()))

    def view(self, query: AuditDistributionQuery | None = None) -> AuditDistributionSlice:
        query = query or AuditDistributionQuery()
        if query.dataset_id is not None and query.dataset_id not in self.datasets:
            raise ValueError('子数据集不属于本次审计冻结范围')
        if query.category is not None and query.category not in self.categories:
            raise ValueError('类别不属于本次审计冻结范围')
        images = self.scopes.get((query.dataset_id, query.category), [])
        image_counts, box_counts = Counter(), Counter()
        instance_counts = Counter()
        invalid = unannotated = 0
        for image in images:
            categories = image.categories if query.category is None else {query.category}
            image_counts.update(categories)
            boxes = [box for box in image.boxes if query.category is None or box.raw_label == query.category]
            valid = [box for box in image.valid_boxes if query.category is None or box.raw_label == query.category]
            box_counts.update(box.raw_label for box in boxes)
            instance_counts[str(len(boxes))] += 1
            invalid += len(boxes) - len(valid)
            unannotated += not boxes
        heatmaps = {}
        for name, (x, y) in self.heatmap_measures.items():
            if self.dataset_format != 'labelme' and not name.startswith('image_'):
                continue
            counts, x_edges, y_edges = np.histogram2d(self.values(images, x, query.category),
                self.values(images, y, query.category), bins=(self.edges[x], self.edges[y]))
            cells = [(int(i), int(j), int(counts[i, j])) for i, j in zip(*np.nonzero(counts))]
            heatmaps[name] = AuditHeatmap(x_edges=x_edges.tolist(), y_edges=y_edges.tolist(), cells=cells)
        metadata = {}
        for key in ('batch_id', 'station', 'camera', 'data_origin'):
            values = [getattr(image.registration.sample, key) for image in images]
            metadata[key] = dict(Counter(str(getattr(value, 'value', value)) if value is not None else '' for value in values))
        histograms, summaries = {}, {}
        for measure in self.histogram_measures:
            if self.dataset_format != 'labelme' and not measure.startswith('image_'):
                continue
            values = self.values(images, measure, query.category)
            counts, edges = np.histogram(values, bins=self.edges[measure])
            density = []
            if len(values) > 1 and min(values) < max(values):
                grid = np.linspace(edges[0], edges[-1], 128)
                density = list(zip(grid.tolist(), gaussian_kde(values)(grid).tolist()))
            histograms[measure] = AuditHistogram(edges=edges.tolist(), counts=counts.tolist(), density=density)
            if summary := self.summarize(values):
                summaries[measure] = summary
        area_by_category = [AuditCategoryBox(category=category, statistics=summary)
            for category in sorted(image_counts)
            if self.dataset_format == 'labelme' and (summary := self.summarize(self.values(images, 'relative_area', category))) is not None]
        return AuditDistributionSlice(**query.model_dump(), image_count=len(images),
            box_count=sum(box_counts.values()) if self.dataset_format == 'labelme' else None,
            invalid_box_count=invalid, unannotated_images=unannotated, instance_counts=dict(sorted(instance_counts.items(), key=lambda item: int(item[0])))
                if self.dataset_format == 'labelme' else {},
            classes=[AuditClassCount(category=category, image_count=count,
                box_count=box_counts[category] if self.dataset_format == 'labelme' else None)
                for category, count in sorted(image_counts.items())],
            datasets=dict(Counter(image.registration.sample.dataset_id for image in images)),
            quality=dict(Counter(image.registration.sample.quality_status.value for image in images)),
            metadata=metadata, heatmaps=heatmaps, histograms=histograms, summaries=summaries, area_by_category=area_by_category)

    def catalog(self) -> AuditDataDistribution:
        return AuditDataDistribution(dataset_format=self.dataset_format, datasets=self.datasets, categories=self.categories,
            slices=[self.view(AuditDistributionQuery(dataset_id=dataset_id, category=category)) for dataset_id, category in self.scopes])

    def geometry(self) -> AuditGeometryProfile | None:
        if self.dataset_format != 'labelme':
            return None
        quantiles = {}
        for key in ('relative_area', 'relative_width', 'relative_height', 'aspect_ratio', 'center_x', 'center_y'):
            summary = self.summarize(self.values(self.images, 'box_aspect_ratio' if key == 'aspect_ratio' else key))
            quantiles[key] = AuditQuantiles(**summary.model_dump(include=set(AuditQuantiles.model_fields))) if summary else None
        return AuditGeometryProfile(box_count=sum(len(image.valid_boxes) for image in self.images),
            annotated_images=sum(bool(image.valid_boxes) for image in self.images),
            instance_distribution=dict(Counter(str(len(image.valid_boxes)) for image in self.images)), **quantiles)
