import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Sequence

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.annotation_applicability import AnnotationApplicability
from iad_core.consistency.group_models import FrozenAnalysisGroup, VisualWindow
from iad_core.evidence.images import EvidenceImages, RegionView
from iad_core.evidence.images import PreparedImage
from iad_core.evidence.retained import RetainedImages
from iad_core.evidence.consistency_sources import EvidenceSourcesCapture


@dataclass(frozen=True)
class PreparedGroupInput:
    facts: dict
    images: list[PreparedImage]



@dataclass(frozen=True)
class PreparedSourceView:
    image: PreparedImage
    annotation: RegionView | None = None
    mapped_from: str | None = None
    window: VisualWindow | None = None


class GroupAnalysisInputs:
    MAX_PREPARED_BYTES = 64 * 1024 * 1024

    def __init__(self, runtime):
        self.runtime, self.db = runtime, runtime.db

    @staticmethod
    def input_fingerprint(instruction, images):
        return hashlib.sha256(json.dumps([instruction,[image.model_context() for image in images]],
            sort_keys=True,ensure_ascii=False).encode()).hexdigest()

    def prepare(self, group: FrozenAnalysisGroup, checkpoint: Callable[[], None], *, windows: Sequence[VisualWindow] = ()):
        service = self.runtime.consistency_service
        images, seen, sources, contexts = [], {}, {}, []
        retained, previews = RetainedImages(self.db), EvidenceImages(self.db.db_path)
        captured_sources = EvidenceSourcesCapture(retained)
        references = {member.image.sample.sample_id: member for member in group.members}
        if any(window.sample_id not in {group.anchor.sample_id, *references} for window in windows):
            raise ValueError('观察窗口仅限本页主图与候选')
        evidence_ids = list(dict.fromkeys([group.anchor.evidence_id,*[member.image.evidence_id for member in group.members],
            *[member.comparison.evidence_id for member in group.members if member.comparison]]))
        byte_count = 0
        for evidence_id in evidence_ids:
            checkpoint()
            saved = service.evidence(evidence_id)
            source_refs = {}
            for side in ('left','right'):
                source = getattr(saved.sources,side)
                source_key = 'source_'+hashlib.sha256(json.dumps([source.sample.sample_id,source.image.sha256,source.annotations.model_dump(mode='json')],sort_keys=True).encode()).hexdigest()
                source_refs[side] = source_key
                path = retained.path(source.image)
                sample = source.sample.model_copy(update={'image_path':path})
                annotations = captured_sources.annotations(source).annotations
                dataset_format = source.annotations.dataset_format
                prepared = []
                if source_key not in sources:
                    original = previews.capture(sample, 'overview', 'coverage', source_sha256=source.image.sha256,
                        full_resolution=True).with_source(sample, dataset_format, annotations)
                    regions = (previews.plan(sample,annotations,[]) if dataset_format == 'labelme'
                        and source.annotations.annotation_coordinates=='RAW' else [])
                    prepared = [PreparedSourceView(original),*[PreparedSourceView(previews.capture(sample,'roi',region.source,region.crop_bbox,source.image.sha256),annotation=region)
                        for region in regions]]
                    for region in regions:
                        linked = [annotation for annotation in annotations if annotation.annotation_type=='mask'
                            and annotation.geometry_status!='INVALID'
                            and annotation.annotation_id in {origin.annotation_id for origin in region.origins}]
                        if linked:
                            prepared.append(PreparedSourceView(previews.capture(sample,'roi',region.source,region.crop_bbox,source.image.sha256,
                                annotations=linked,annotation_mode='annotation_mask'),annotation=region))
                    for window in windows:
                        if window.sample_id == sample.sample_id:
                            prepared.extend(PreparedSourceView(previews.capture(sample,'roi','model',tile,source.image.sha256),window=window)
                                for tile in previews.tiles(sample,list(window.bbox),0,padding_pixels=window.padding))
                    sources[source_key] = {'sample_id':sample.sample_id,'name':sample.relative_path,
                        'dataset_format':dataset_format,
                        'scan_ref':source.scan_ref,
                        **({'image_label':original.image_label} if dataset_format == 'folder_classification' else {}),
                        'original_size':[sample.width,sample.height],'original_quality':sample.quality_status,
                        'quality_source':sample.quality_source,'policy':source.annotations.policy.model_dump(mode='json'),
                        'annotation_coordinates':source.annotations.annotation_coordinates,
                        'annotation_availability':source.annotations.availability.model_dump(mode='json'),
                        'annotations':[annotation.model_dump(mode='json',exclude={'mask_path'}) for annotation in annotations],
                        'issues':source.issues,'visual_inputs':[]}
                visual_inputs = sources[source_key]['visual_inputs']
                other = getattr(saved.sources, 'right' if side == 'left' else 'left')
                if (saved.result.verification.relation == 'EXACT' and dataset_format == 'labelme'
                        and source.annotations.annotation_coordinates == other.annotations.annotation_coordinates == 'RAW'):
                    available = {(tuple(item['crop_bbox']), item.get('window_from')) for item in visual_inputs}
                    for region in previews.plan(sample, [item for item in captured_sources.annotations(other).annotations
                            if not item.is_ignored], []):
                        if region.source == 'annotation' and (tuple(region.crop_bbox), other.sample.sample_id) not in available:
                            prepared.append(PreparedSourceView(previews.capture(sample,'roi','coverage',region.crop_bbox,source.image.sha256),
                                mapped_from=other.sample.sample_id))
                for view in prepared:
                    checkpoint()
                    image = view.image.with_source(sample, dataset_format, annotations)
                    identity = (image.evidence.representation,image.evidence.sha256)
                    if identity not in seen:
                        byte_count += Path(image.path).stat().st_size
                        if byte_count>self.MAX_PREPARED_BYTES:
                            raise ConsistencyError('RESOURCE_LIMIT','单批原图与标注裁剪超过准备资源预算，未发送不完整图组')
                        images.append(image);seen[identity]=image.evidence.evidence_id
                    visual_inputs.append({'evidence_id':seen[identity],'crop_bbox':image.evidence.crop_bbox,
                        'representation':image.evidence.representation,
                        'window_source':'visual_window' if view.window else 'mapped_window' if view.mapped_from is not None else
                            'annotation' if view.annotation and view.annotation.source=='annotation' else None,
                        'window_from':view.mapped_from,
                        'annotation_origins':[origin.model_dump(mode='json') for origin in view.annotation.origins] if view.annotation else [],
                        **({'requested_bbox':list(view.window.bbox),'padding':view.window.padding,'reason':view.window.reason} if view.window else {})})
            contexts.append({'evidence_id':evidence_id,'result_id':saved.result.result_id,
                'source_states':saved.source_states.model_dump(mode='json'),'sources':source_refs,
                'verification':saved.result.verification.model_dump(mode='json'),
                'annotation_observations':{side:observation.model_dump(mode='json') for side,observation in saved.annotation_observations.items()},
                'annotation_applicability':{side:AnnotationApplicability.compare(
                    captured_sources.annotations(getattr(saved.sources,side)),
                    captured_sources.annotations(getattr(saved.sources,'right' if side=='left' else 'left')),
                    saved.result.verification.relation,saved.parameters.matching).model_dump(mode='json') for side in ('left','right')},
                'differences':[difference.model_dump(mode='json') for difference in saved.result.annotation.differences]})
        facts = {'anchor': {'sample_id':group.anchor.sample.sample_id,'evidence_id':group.anchor.evidence_id,'side':group.anchor.side},
                'candidates': {identity:{'evidence_id':member.image.evidence_id,'side':member.image.side,
                    'comparison':member.comparison.model_dump(mode='json') if member.comparison else None}
                    for identity,member in references.items()}, 'sources':sources,'evidence': contexts}
        return PreparedGroupInput(facts, images)
