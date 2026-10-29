import hashlib
import json
from contextlib import nullcontext
from typing import Literal

import numpy as np
from pydantic import Field
from scipy.optimize import linear_sum_assignment

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.annotation_models import AnnotationComparison, AnnotationDifference, AnnotationMatchingConfig, InstanceMatch
from iad_core.consistency.geometry import bbox_iou, union_region
from iad_core.consistency.comparison_domain import ComparisonDomain
from iad_core.consistency.models import Identifier, Relation
from iad_core.consistency.policy import AnnotationPolicy
from iad_core.dataset.registry import DatasetRegistry
from iad_core.duplicate.index import PixelIndex
from iad_core.storage.database import Database
from iad_core.storage.models import Annotation, QualityStatus
from iad_core.storage.repositories import AnnotationRepository, SampleRepository


class AnnotationSet(AnalysisModel):
    sample_id: Identifier
    dataset_id: Identifier
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    quality_status: QualityStatus
    quality_source: str | None
    annotations: list[Annotation]
    policy: AnnotationPolicy = Field(default_factory=AnnotationPolicy)
    errors: list[str] = Field(default_factory=list)
    annotation_coordinates: Literal['RAW', 'EXIF_AMBIGUOUS', 'UNKNOWN'] = 'RAW'

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
            policy = DatasetRegistry(db).get(sample.dataset_id, connection=connection).annotations
            pixel = PixelIndex(db).get(sample_id, connection=connection)
            annotations = AnnotationRepository(db).list_by_sample(sample_id, connection=connection)
            errors = [row[0] for row in connection.execute('''SELECT message FROM import_issues
                WHERE sample_id=? AND upper(issue_type) IN ('ANNOTATION_PARSE_ERROR','INVALID_MASK')''', (sample_id,))]
        return cls(sample_id=sample_id, dataset_id=sample.dataset_id, width=sample.width, height=sample.height,
            quality_status=sample.quality_status, quality_source=sample.quality_source,
            annotations=annotations, errors=errors,
            policy=AnnotationPolicy(**policy.model_dump(include=set(AnnotationPolicy.model_fields))),
            annotation_coordinates=pixel.descriptor.annotation_coordinates if pixel else 'UNKNOWN')

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
            facts = {'reason': issue.reason, 'side': ['left', 'right'][issue.side]}
            if issue.source_errors:
                facts['errors'] = issue.source_errors
            difference('ANNOTATION_UNREADABLE', indices if issue.side == 0 else [], indices if issue.side == 1 else [], facts=facts)
        if domain.unavailable_reason is not None:
            difference('POLICY_UNCONFIRMED', facts={'reason': domain.unavailable_reason},
                extra_pending=['Verify the original coordinate and ignore domain before geometric reconciliation'])
            return AnnotationComparison(status='UNAVAILABLE', policy_relation=policy_relation, matches=[],
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
        exact_components=list(self.components(exact))
        plausible_components=list(self.components({pair for pair,score in location_scores.items() if score>0}))
        for left_component,right_component in exact_components:
            if left_component & used_left or right_component & used_right:
                continue
            if len(left_component)==len(right_component)==1:
                continue
            else:
                left_component,right_component=next((lc,rc) for lc,rc in plausible_components
                    if lc & left_component or rc & right_component)
                difference('AMBIGUOUS_MATCH',sorted(left_component),sorted(right_component),
                    union_region([a[i].bounds for i in left_component]+[b[j].bounds for j in right_component]),
                    facts={'reason':'Multiple instances have identical geometry'},extra_pending=['Confirm instance correspondence'])
                used_left.update(left_component);used_right.update(right_component)
        for left_component,right_component in exact_components:
            if len(left_component)==len(right_component)==1 and not (left_component & used_left or right_component & used_right):
                matched(next(iter(left_component)),next(iter(right_component)))
        # Containment components identify merged/split extents before one-to-one assignment.
        containment=set()
        for i,first in a.items():
            for j,second in b.items():
                if (first.annotation.annotation_type=='image') != (second.annotation.annotation_type=='image'):
                    continue
                if i in used_left and j in used_right:
                    continue
                x1,y1=max(first.bounds[0],second.bounds[0]),max(first.bounds[1],second.bounds[1])
                x2,y2=min(first.bounds[2],second.bounds[2]),min(first.bounds[3],second.bounds[3])
                intersection=max(0,x2-x1)*max(0,y2-y1)
                small=min((first.bounds[2]-first.bounds[0])*(first.bounds[3]-first.bounds[1]),
                    (second.bounds[2]-second.bounds[0])*(second.bounds[3]-second.bounds[1]))
                segmentation=segmentations[i,j]
                if first.masked_domain or second.masked_domain:
                    overlap=first.pixel_iou(second)
                    intersection=overlap*(first.pixel_area+second.pixel_area)/(1+overlap)
                    small=min(first.pixel_area,second.pixel_area)
                elif segmentation is not None:
                    intersection=segmentation*(first.area+second.area)/(1+segmentation)
                    small=min(first.area,second.area)
                if small>0 and intersection/small >= self.config.split_coverage:
                    containment.add((i,j))
        for lc,rc in self.components(containment):
            if (len(lc)>1 and len(rc)==1) or (len(rc)>1 and len(lc)==1):
                pieces=[a[i] for i in lc] if len(lc)>1 else [b[j] for j in rc]
                if any(bbox_iou(first.bounds,second.bounds) > 1-self.config.split_coverage
                       for k,first in enumerate(pieces) for second in pieces[k+1:]):
                    continue
                combined=next(iter(b[j] for j in rc)) if len(lc)>1 else next(iter(a[i] for i in lc))
                coverage=combined.covered_fraction(pieces)
                if coverage < self.config.split_coverage:
                    continue
                all_regions=[a[i].bounds for i in lc]+[b[j].bounds for j in rc]
                difference('SPLIT_MERGE',sorted(lc),sorted(rc),union_region(all_regions),
                    facts={'coverage_basis':'visible_pixels' if combined.masked_domain or any(p.masked_domain for p in pieces) else
                        'segmentation' if combined.pixels is not None and all(p.pixels is not None for p in pieces) else 'bounding_extent',
                        'combined_coverage':coverage},extra_pending=['Confirm split or merge annotation convention'])
                used_left.update(lc);used_right.update(rc)
        rows,cols=sorted(set(a)-used_left),sorted(set(b)-used_right)
        candidate={(i,j) for i in rows for j in cols if location_scores[i,j]>0}
        for lc,rc in self.components(candidate):
            indices_left,indices_right=sorted(lc),sorted(rc)
            if len(lc)!=len(rc) and (len(lc)==1 or len(rc)==1):
                difference('AMBIGUOUS_MATCH',indices_left,indices_right,
                    union_region([a[i].bounds for i in lc]+[b[j].bounds for j in rc]),
                    facts={'reason':'Overlapping instances require split or merge correspondence'},
                    extra_pending=['Confirm instance correspondence before inferring a missing annotation'])
                used_left.update(lc);used_right.update(rc)
                continue
            matrix=self.cost_matrix(indices_left,indices_right,location_scores)
            chosen_rows,chosen_cols=linear_sum_assignment(matrix)
            optimum=float(matrix[chosen_rows,chosen_cols].sum())
            chosen=[(int(i),int(j)) for i,j in zip(chosen_rows,chosen_cols) if i<len(indices_left) and j<len(indices_right) and matrix[i,j]<1e5]
            ambiguous=any(min(a[indices_left[i]].area,b[indices_right[j]].area)<=self.config.tiny_area for i,j in chosen)
            for i,j in chosen:
                alternative=matrix.copy();alternative[i,j]=1e6
                ar,ac=linear_sum_assignment(alternative)
                if float(alternative[ar,ac].sum())-optimum<=self.config.ambiguity_tolerance:
                    ambiguous=True
                    break
            if ambiguous:
                difference('AMBIGUOUS_MATCH',indices_left,indices_right,
                    union_region([a[i].bounds for i in lc]+[b[j].bounds for j in rc]),
                    facts={'reason':'Tiny regions or multiple equally plausible assignments'},extra_pending=['Confirm instance correspondence'])
                used_left.update(lc);used_right.update(rc)
            else:
                for i,j in chosen:
                    matched(indices_left[i],indices_right[j])
        for side_index,remaining in enumerate([set(a)-used_left,set(b)-used_right]):
            other=1-side_index
            for index in sorted(remaining):
                region=list(geometries[side_index][index].bounds)
                if geometries[side_index][index].area<=self.config.tiny_area:
                    difference('AMBIGUOUS_MATCH',[index] if side_index==0 else [],[index] if side_index==1 else [],region,
                        facts={'reason':'Tiny unmatched instance has insufficient geometric evidence'},extra_pending=['Confirm the tiny instance before inferring a missing annotation'])
                    continue
                suspect=comparable and not invalid[other] and sides[other].policy.annotation_coverage=='EXHAUSTIVE'
                if invalid[other]:
                    difference('ANNOTATION_UNREADABLE',[index] if side_index==0 else [],[index] if side_index==1 else [],region,
                        facts={'reason':'Opposite annotation set is incomplete or unreadable'})
                else:
                    difference('ONE_SIDED_REGION',[index] if side_index==0 else [],[index] if side_index==1 else [],region,
                        reference=['left','right'][other],suspected=['left','right'][other] if suspect else None,
                        extra_pending=[] if suspect else ['Confirm annotation coverage before inferring a missing instance'],conflict=suspect)
        return AnnotationComparison(status='PARTIAL' if any(invalid) else 'COMPLETE',policy_relation=policy_relation,
            matches=matches,differences=differences,invalid_left=invalid[0],invalid_right=invalid[1],
            confirmed_conflict=any(d.confirmed_conflict for d in differences),ignore_regions=ignore_regions,masking=masking)

    def cost_matrix(self, rows, cols, scores) -> np.ndarray:
        n,m=len(rows),len(cols)
        matrix=np.full((n+m,n+m),1e6)
        matrix[n:,m:]=0
        for i,row in enumerate(rows):
            matrix[i,m+i]=.5
            for j,col in enumerate(cols):
                if scores[row,col]>0:
                    matrix[i,j]=1-scores[row,col]
        for j in range(m):
            matrix[n+j,j]=.5
        return matrix

    @staticmethod
    def components(edges):
        adjacency={}
        for i,j in edges:
            adjacency.setdefault(('left',i),set()).add(('right',j))
            adjacency.setdefault(('right',j),set()).add(('left',i))
        while adjacency:
            pending=[min(adjacency)];left,right=set(),set()
            while pending:
                side,index=pending.pop()
                neighbors=adjacency.pop((side,index),None)
                if neighbors is None:
                    continue
                (left if side=='left' else right).add(index)
                pending.extend(neighbors)
            yield left,right
