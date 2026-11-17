import hashlib
import json
import math
from contextlib import nullcontext
from typing import Literal

from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.annotation_assignment import AnnotationAssignment
from iad_core.consistency.annotation_models import AnnotationComparison, AnnotationDifference, AnnotationMatchingConfig, InstanceMatch
from iad_core.consistency.geometry import InstanceGeometry, bbox_iou, union_region
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.task_types import ConsistencyTaskType, TASK_TYPES_BY_FORMAT
from iad_core.consistency.comparison_domain import ComparisonDomain
from iad_core.consistency.models import Identifier, Relation
from iad_core.consistency.policy import AnnotationPolicy
from iad_core.dataset.registry import DatasetRegistry
from iad_core.duplicate.index import PixelIndex
from iad_core.storage.database import Database
from iad_core.storage.models import Annotation, AnnotationAvailability, GeometryStatus, QualityStatus
from iad_core.consistency.annotation_inventory import AnnotationInventory
from iad_core.consistency.conflict_categories import ConflictCategory
from iad_core.storage.repositories import AnnotationRepository, SampleRepository


class AnnotationSet(AnalysisModel):
    sample_id: Identifier
    dataset_id: Identifier
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    quality_status: QualityStatus
    quality_source: str | None
    annotations: list[Annotation]
    availability: AnnotationAvailability = Field(default_factory=AnnotationAvailability)
    dataset_format: Literal['labelme', 'folder_classification'] | None = None
    policy: AnnotationPolicy = Field(default_factory=AnnotationPolicy)
    errors: list[str] = Field(default_factory=list)
    annotation_coordinates: Literal['RAW', 'EXIF_AMBIGUOUS', 'UNKNOWN'] = 'RAW'

    @property
    def supports_absence(self) -> bool:
        return (self.availability.status in ('VALID_EMPTY', 'VALID_NONEMPTY')
            and self.policy.annotation_coverage == 'EXHAUSTIVE')

    def resolve_geometry(self) -> 'AnnotationSet':
        annotations = []
        for annotation in self.annotations:
            if annotation.annotation_type == 'bbox' and annotation.geometry_status in ('VALID', 'INVALID'):
                box = annotation.bbox
                valid = (box is not None and len(box) == 4 and all(math.isfinite(value) for value in box)
                    and box[0] < box[2] and box[1] < box[3]
                    and all(value is None or value == size for value, size in (
                        (annotation.source_width, self.width), (annotation.source_height, self.height))))
                annotation = annotation.model_copy(update={'geometry_status':GeometryStatus.VALID if valid else GeometryStatus.INVALID})
            annotations.append(annotation)
        return self.model_copy(update={'annotations':annotations})

    def require_task(self, task_type: ConsistencyTaskType) -> None:
        if self.errors:
            raise ConsistencyError('ANNOTATION_UNREADABLE', '原始标注无法读取：' + self.sample_id + '；' + '；'.join(self.errors))
        if TASK_TYPES_BY_FORMAT.get(self.dataset_format) != task_type:
            raise ConsistencyError('ANNOTATION_UNREADABLE', '标注格式与作业冻结的任务类型不一致：' + self.sample_id)
        if task_type == 'anomaly_detection':
            if self.quality_status not in ('PASS', 'FAIL') or self.annotations:
                raise ConsistencyError('ANNOTATION_UNREADABLE', '图像级审核需要导入时确认的正常／异常分类：' + self.sample_id)
            return
        for annotation in self.annotations:
            try:
                box = InstanceGeometry.vector_bounds(annotation)
                if (annotation.geometry_status != 'VALID' or not annotation.raw_label.strip()
                        or annotation.bbox is None
                        or any(value is not None and value != size for value, size in (
                            (annotation.source_width, self.width), (annotation.source_height, self.height)))
                        or max(0, box[0]) >= min(self.width, box[2])
                        or max(0, box[1]) >= min(self.height, box[3])):
                    raise ValueError('需要非空类别、有效原始矩形或多边形及图内可见区域')
            except ValueError as error:
                raise ConsistencyError('ANNOTATION_UNREADABLE',
                    '区域标注无法审核：' + annotation.annotation_id + '；' + str(error)
                    + f'。原始坐标={annotation.bbox}，图像尺寸={self.width}×{self.height}。') from error

    @classmethod
    def capture(cls, db: Database, sample_id: str, connection=None) -> 'AnnotationSet':
        with nullcontext(connection) if connection is not None else db.connection() as connection:
            if not connection.in_transaction:
                connection.execute('BEGIN')
            sample = SampleRepository(db).get(sample_id, connection=connection)
            if sample is None:
                raise LookupError('Sample not found')
            if sample.is_excluded:
                raise ValueError('Excluded sample cannot enter annotation reconciliation')
            config = DatasetRegistry(db).get(sample.dataset_id, connection=connection)
            policy = config.annotations
            pixel = PixelIndex(db).get(sample_id, connection=connection)
            annotations = AnnotationRepository(db).list_by_sample(sample_id, connection=connection)
            errors = [row[0] for row in connection.execute('''SELECT message FROM import_issues
                WHERE sample_id=? AND upper(issue_type) IN ('ANNOTATION_PARSE_ERROR','INVALID_MASK')''', (sample_id,))]
        return cls(sample_id=sample_id, dataset_id=sample.dataset_id, width=sample.width, height=sample.height,
            quality_status=sample.quality_status, quality_source=sample.quality_source,
            annotations=annotations, errors=errors, availability=sample.annotation_availability,
            dataset_format=config.dataset.format,
            policy=AnnotationPolicy(**policy.model_dump(include=set(AnnotationPolicy.model_fields))),
            annotation_coordinates=pixel.descriptor.annotation_coordinates if pixel else 'UNKNOWN').resolve_geometry()

class AnnotationMatcher:
    def __init__(self, config: AnnotationMatchingConfig | None = None):
        self.config = config or AnnotationMatchingConfig()

    def compare(self, left: AnnotationSet, right: AnnotationSet, *, relation: Relation) -> AnnotationComparison:
        # Copy input values so historical facts cannot follow caller mutations.
        sides = [left.model_copy(deep=True), right.model_copy(deep=True)]
        left, right = sides
        policy_relation = left.policy.relation(right.policy)
        comparable = relation == 'EXACT' and policy_relation == 'SAME' and all(side.policy.annotation_role == 'REFERENCE' for side in sides)
        pending = []
        if relation != 'EXACT':
            pending.append('Original images are not verified EXACT')
        if policy_relation != 'SAME':
            pending.append('Annotation policies differ or require confirmation')
        if any(side.policy.annotation_role != 'REFERENCE' for side in sides):
            pending.append('Source roles are not both confirmed references')
        differences, matches = [], []

        def difference(kind, left_indices=(), right_indices=(), region=None, facts=None, extra_pending=(),
                       reference=None, suspected=None, conflict=False):
            content = dict(type=kind, left=[left.annotations[i] for i in left_indices],
                right=[right.annotations[i] for i in right_indices], region=region, policy_relation=policy_relation,
                facts=facts or {}, pending=[*pending, *extra_pending], reference_from_other=reference,
                suspected_missing=suspected, confirmed_conflict=conflict)
            frozen = {'samples':[side.sample_id for side in sides], **content}
            digest = hashlib.sha256(json.dumps(frozen, sort_keys=True, default=lambda x:x.model_dump(mode='json')).encode()).hexdigest()
            differences.append(AnnotationDifference(difference_id='difference_'+digest, **content))

        if left.quality_status != right.quality_status:
            difference('QUALITY_LABEL', facts={'left_quality':left.quality_status,'right_quality':right.quality_status,
                'left_source':left.quality_source,'right_source':right.quality_source},
                conflict=comparable and {left.quality_status,right.quality_status}=={'PASS','FAIL'})
        if pending:
            difference('POLICY_UNCONFIRMED', facts={'left_policy':left.policy.model_dump(), 'right_policy':right.policy.model_dump()})
        domain = ComparisonDomain.prepare(sides, relation, self.config)
        geometries, invalid = domain.sides, domain.invalid
        ignore_regions, masking = domain.ignore_regions, domain.masking
        for issue in domain.issues:
            indices = [issue.index] if issue.index is not None else []
            facts = {'reason': issue.reason, 'side': ['left', 'right'][issue.side], 'code': issue.code}
            if issue.source_errors:
                facts['errors'] = issue.source_errors
            difference('ANNOTATION_UNREADABLE', indices if issue.side == 0 else [], indices if issue.side == 1 else [], facts=facts)
        if domain.unavailable_reason is not None:
            inventory=AnnotationInventory.compare(left,right)
            if inventory.categories.intersection({ConflictCategory.EXTRA,ConflictCategory.MISSING}):
                difference('ANNOTATION_COUNT',facts={'left_count':sum(inventory.left.values()),'right_count':sum(inventory.right.values())})
            if ConflictCategory.CATEGORY in inventory.categories:
                difference('CATEGORY',facts={'comparison_kind':'CATEGORY_INVENTORY','left_categories':inventory.left,'right_categories':inventory.right})
            difference('POLICY_UNCONFIRMED', facts={'reason': domain.unavailable_reason},
                extra_pending=['Verify the original coordinate and ignore domain before geometric reconciliation'])
            captured = relation != 'EXACT' and not any(invalid) and all(side.annotation_coordinates == 'RAW' for side in sides)
            return AnnotationComparison(status='COMPLETE' if captured else 'UNAVAILABLE', policy_relation=policy_relation, matches=[],
                differences=differences, invalid_left=invalid[0], invalid_right=invalid[1], confirmed_conflict=any(d.confirmed_conflict for d in differences),
                ignore_regions=ignore_regions,masking=masking)
        a,b = geometries
        scores, boxes, segmentations = {},{},{}
        for i,first in a.items():
            for j,second in b.items():
                compatible = (first.annotation.annotation_type=='image') == (second.annotation.annotation_type=='image')
                box = bbox_iou(first.bounds,second.bounds) if compatible else 0.
                segmentation = first.segmentation_iou(second) if box else None
                boxes[i,j] = box
                segmentations[i,j] = segmentation
                scores[i,j] = (first.pixel_iou(second) if first.masked_domain or second.masked_domain else
                    segmentation if segmentation is not None else box) if compatible else 0.
        used_left,used_right = set(),set()

        def matched(i,j):
            used_left.add(i); used_right.add(j)
            score = scores[i,j]
            segmentation = segmentations[i,j]
            matches.append(InstanceMatch(left_id=a[i].annotation.annotation_id,right_id=b[j].annotation.annotation_id,
                bbox_iou=boxes[i,j],segmentation_iou=segmentation,geometry_equal=score==1,
                comparison_kind='IMAGE_LABEL' if a[i].annotation.annotation_type=='image' else
                    'SEGMENTATION' if segmentation is not None else 'LOCATION_ONLY'))
            region = union_region([a[i].bounds,b[j].bounds])
            if score < 1:
                difference('GEOMETRY',[i],[j],region,facts={'bbox_iou':boxes[i,j], 'segmentation_iou':segmentation},
                    extra_pending=['Confirm instance correspondence for low-overlap regions'] if score<self.config.minimum_iou else [],
                    conflict=comparable and score>=self.config.minimum_iou)
            first,second = left.annotations[i],right.annotations[j]
            if left.policy.category_mapping.get(first.raw_label,first.raw_label) != right.policy.category_mapping.get(second.raw_label,second.raw_label):
                difference('CATEGORY',[i],[j],region,conflict=comparable and score>=self.config.minimum_iou)

        location_scores = {pair:box if scores[pair]>0 or box>=self.config.minimum_iou else 0.
            for pair,box in boxes.items()}
        exact = {(i,j) for (i,j),score in scores.items() if score==1}
        assignment = AnnotationAssignment.solve({i: value.annotation.annotation_id for i, value in a.items()},
            {j: value.annotation.annotation_id for j, value in b.items()}, location_scores, exact)
        for i, j in assignment.pairs:
            matched(i, j)
        for lc, rc in assignment.groups:
            pieces = [a[i] for i in lc] if len(lc) > 1 else [b[j] for j in rc]
            combined = b[rc[0]] if len(lc) > 1 else a[lc[0]]
            difference('SPLIT_MERGE', lc, rc,
                union_region([a[i].bounds for i in lc] + [b[j].bounds for j in rc]),
                facts={'coverage_basis': 'visible_pixels' if combined.masked_domain or any(p.masked_domain for p in pieces) else
                    'segmentation' if combined.pixels is not None and all(p.pixels is not None for p in pieces) else 'bounding_extent',
                    'combined_coverage': combined.covered_fraction(pieces)})
            labels = [{side.policy.category_mapping.get(value.raw_label, value.raw_label) for value in values}
                for side, values in ((left, [a[i].annotation for i in lc]), (right, [b[j].annotation for j in rc]))]
            if labels[0] != labels[1]:
                difference('CATEGORY', lc, rc, union_region([a[i].bounds for i in lc] + [b[j].bounds for j in rc]),
                    facts={'left_categories': sorted(labels[0]), 'right_categories': sorted(labels[1])})
            used_left.update(lc)
            used_right.update(rc)
        for side_index,remaining in enumerate([set(a)-used_left,set(b)-used_right]):
            other=1-side_index
            for index in sorted(remaining):
                region=list(geometries[side_index][index].bounds)
                suspect=comparable and not invalid[other] and sides[other].supports_absence
                if invalid[other]:
                    difference('ANNOTATION_UNREADABLE',[index] if side_index==0 else [],[index] if side_index==1 else [],region,
                        facts={'reason':'Opposite annotation set is incomplete or unreadable'})
                else:
                    difference('ONE_SIDED_REGION',[index] if side_index==0 else [],[index] if side_index==1 else [],region,
                        reference=['left','right'][other],suspected=['left','right'][other] if suspect else None,
                        extra_pending=[] if suspect else ['Confirm annotation coverage before inferring a missing instance'],conflict=suspect)
        return AnnotationComparison(status='PARTIAL' if any(invalid) else 'COMPLETE',policy_relation=policy_relation,
            matches=matches,differences=differences,invalid_left=invalid[0],invalid_right=invalid[1],
            confirmed_conflict=any(d.confirmed_conflict for d in differences),ignore_regions=ignore_regions,masking=masking,
            coordinate_frame='RAW_EXACT' if relation=='EXACT' else 'RELATIVE_IMAGE')
