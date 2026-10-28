from dataclasses import dataclass

from iad_core.consistency.evidence_models import FrozenEvidence
from iad_core.consistency.geometry import InstanceGeometry
from iad_core.consistency.review_models import ConsistencyReviewSubmission
from iad_core.storage.models import Annotation


@dataclass(frozen=True)
class RegionPlan:
    sample_id: str
    before: Annotation | None
    after: Annotation | None

    @staticmethod
    def signature(annotation: Annotation) -> dict:
        return annotation.model_dump(include={'annotation_type', 'raw_label', 'bbox', 'polygon', 'mask_sha256', 'is_ignored'})

    @classmethod
    def build(cls, request: ConsistencyReviewSubmission, evidence: FrozenEvidence) -> list['RegionPlan']:
        if request.action.kind != 'PROPOSE_REGION_CHANGE':
            raise ValueError('Only region proposals have a region plan')
        sources = {source.sample.sample_id: source for source in (evidence.sources.left, evidence.sources.right)}
        selected = [difference for difference in evidence.result.annotation.differences if difference.difference_id in request.difference_ids]
        allowed = {annotation.annotation_id for difference in selected for annotation in [*difference.left, *difference.right]}
        seen = set()
        plans = []
        for change in request.action.changes:
            source = sources.get(change.sample_id)
            if source is None:
                raise ValueError('Region target must belong to this evidence')
            before = None
            if change.operation != 'add':
                before = next((annotation for annotation in source.annotations.annotations if annotation.annotation_id == change.annotation_id), None)
                if before is None or before.annotation_id not in allowed:
                    raise ValueError('Region target must belong to a selected frozen difference')
                if before.annotation_id in seen:
                    raise ValueError('A region cannot have multiple competing changes in one proposal')
                seen.add(before.annotation_id)
            after = None
            if change.operation != 'remove':
                category = change.category if change.operation in ('add', 'relabel') else before.raw_label
                if change.operation == 'relabel':
                    after = before.model_copy(update={'raw_label': category})
                else:
                    geometry = change.geometry
                    polygon = [list(point) for point in geometry.points] if geometry.kind == 'polygon' else None
                    box = list(geometry.coordinates) if geometry.kind == 'bbox' else [min(p[0] for p in polygon), min(p[1] for p in polygon), max(p[0] for p in polygon), max(p[1] for p in polygon)]
                    after = Annotation(annotation_id='proposed', sample_id=change.sample_id,
                        annotation_type=geometry.kind, raw_label=category, bbox=box, polygon=polygon,
                        is_ignored=before.is_ignored if before else False)
                InstanceGeometry.prepare(after, source.sample, 16 * 1024 * 1024)
                if before is not None and cls.signature(before) == cls.signature(after):
                    raise ValueError('Region proposal must change the frozen annotation')
                if before is None and any(cls.signature(annotation) == cls.signature(after) for annotation in source.annotations.annotations):
                    raise ValueError('Proposed added region already exists in the frozen source')
            plans.append(cls(change.sample_id, before, after))
        return plans

    def applied(self, evidence: FrozenEvidence) -> bool:
        source = next(source for source in (evidence.sources.left, evidence.sources.right) if source.sample.sample_id == self.sample_id)
        actual = [self.signature(annotation) for annotation in source.annotations.annotations]
        return ((self.after is None or self.signature(self.after) in actual)
            and (self.before is None or self.signature(self.before) not in actual))
