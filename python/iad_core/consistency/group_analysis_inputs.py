import hashlib
import json
from dataclasses import dataclass
from pathlib import Path

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.group_models import FrozenAnalysisGroup
from iad_core.consistency.review import ConsistencyReview
from iad_core.dataset.registry import DatasetRegistry
from iad_core.evidence.images import EvidenceImages
from iad_core.evidence.images import PreparedImage
from iad_core.evidence.retained import RetainedImages
from iad_core.evidence.consistency_sources import EvidenceSourcesCapture
from iad_core.workbench.jobs import JobContext


@dataclass(frozen=True)
class PreparedGroupInput:
    prompt: str
    facts: dict
    images: list[PreparedImage]

    def instruction(self, facts: dict) -> str:
        return self.prompt + '\n冻结图组：' + json.dumps(facts, ensure_ascii=False, separators=(',', ':'))


class GroupAnalysisInputs:
    MAX_PREPARED_BYTES = 64 * 1024 * 1024

    def __init__(self, runtime):
        self.runtime, self.db = runtime, runtime.db

    @staticmethod
    def fingerprint(group: FrozenAnalysisGroup):
        return hashlib.sha256(group.model_dump_json().encode()).hexdigest()

    @staticmethod
    def input_fingerprint(instruction, images):
        return hashlib.sha256(json.dumps([instruction,[image.model_context() for image in images]],
            sort_keys=True,ensure_ascii=False).encode()).hexdigest()

    def prepare(self, context: JobContext, group: FrozenAnalysisGroup):
        service = self.runtime.consistency_service
        images, seen, sources, contexts = [], {}, {}, []
        retained, previews = RetainedImages(self.db), EvidenceImages(self.db.db_path)
        captured_sources = EvidenceSourcesCapture(retained)
        references = {member.image.sample.sample_id: member for member in group.members}
        evidence_ids = list(dict.fromkeys([group.anchor.evidence_id,*[member.image.evidence_id for member in group.members],
            *[member.comparison.evidence_id for member in group.members if member.comparison]]))
        byte_count = 0
        for evidence_id in evidence_ids:
            context.checkpoint()
            saved = service.evidence(evidence_id)
            source_refs = {}
            for side in ('left','right'):
                source = getattr(saved.sources,side)
                source_key = 'source_'+hashlib.sha256(json.dumps([source.sample.sample_id,source.image.sha256,source.annotations.model_dump(mode='json')],sort_keys=True).encode()).hexdigest()
                source_refs[side] = source_key
                if source_key in sources:
                    continue
                path = retained.path(source.image)
                sample = source.sample.model_copy(update={'image_path':path})
                annotations = captured_sources.annotations(source).annotations
                dataset_format = DatasetRegistry(self.db).get(sample.dataset_id).dataset.format
                original = previews.capture(sample, 'overview', 'coverage', source_sha256=source.image.sha256,
                    full_resolution=True).with_source(sample, dataset_format, annotations)
                regions = (previews.plan(sample,annotations,[]) if dataset_format == 'labelme'
                    and source.annotations.annotation_coordinates=='RAW' else [])
                prepared = [(original,None),*[(previews.capture(sample,'roi',region.source,region.crop_bbox,source.image.sha256),region)
                    for region in regions]]
                for region in regions:
                    linked = [annotation for annotation in annotations if annotation.annotation_type=='mask'
                        and annotation.geometry_status!='INVALID'
                        and annotation.annotation_id in {origin.annotation_id for origin in region.origins}]
                    if linked:
                        prepared.append((previews.capture(sample,'roi',region.source,region.crop_bbox,source.image.sha256,
                            annotations=linked,annotation_mode='annotation_mask'),region))
                visual_inputs = []
                for image,region in prepared:
                    context.checkpoint()
                    image = image.with_source(sample, dataset_format, annotations)
                    identity = (image.evidence.representation,image.evidence.sha256)
                    if identity not in seen:
                        byte_count += Path(image.path).stat().st_size
                        if byte_count>self.MAX_PREPARED_BYTES:
                            raise ConsistencyError('RESOURCE_LIMIT','单批原图与标注裁剪超过准备资源预算，未发送不完整图组')
                        images.append(image);seen[identity]=image.evidence.evidence_id
                    visual_inputs.append({'evidence_id':seen[identity],'crop_bbox':image.evidence.crop_bbox,
                        'representation':image.evidence.representation,
                        'annotation_origins':[origin.model_dump(mode='json') for origin in region.origins] if region else []})
                sources[source_key] = {'sample_id':sample.sample_id,'name':sample.relative_path,
                    'dataset_format':dataset_format,
                    **({'image_label':original.image_label} if dataset_format == 'folder_classification' else {}),
                    'original_size':[sample.width,sample.height],'original_quality':sample.quality_status,
                    'quality_source':sample.quality_source,'policy':source.annotations.policy.model_dump(mode='json'),
                    'annotation_coordinates':source.annotations.annotation_coordinates,
                    'annotations':[annotation.model_dump(mode='json',exclude={'mask_path'}) for annotation in annotations],
                    'issues':source.issues,'visual_inputs':visual_inputs}
            contexts.append({'evidence_id':evidence_id,'result_id':saved.result.result_id,
                'source_states':saved.source_states.model_dump(mode='json'),'sources':source_refs,
                'verification':saved.result.verification.model_dump(mode='json'),
                'differences':[difference.model_dump(mode='json') for difference in saved.result.annotation.differences],
                'review':ConsistencyReview(self.db).context(evidence_id).model_dump(mode='json')})
        facts = {'anchor': {'sample_id':group.anchor.sample.sample_id,'evidence_id':group.anchor.evidence_id,'side':group.anchor.side},
                'candidates': {identity:{'evidence_id':member.image.evidence_id,'side':member.image.side,
                    'comparison':member.comparison.model_dump(mode='json') if member.comparison else None}
                    for identity,member in references.items()}, 'sources':sources,'evidence': contexts}
        return PreparedGroupInput(context.payload['request']['analysis_instruction'], facts, images)
