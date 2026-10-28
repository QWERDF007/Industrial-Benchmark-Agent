from pathlib import Path

from iad_core.consistency.annotations import AnnotationSet
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.evidence_models import FrozenEvidenceSource
from iad_core.consistency.retrieval_sources import SourceImage
from iad_core.duplicate.index import PixelIndexEntry
from iad_core.duplicate.pixels import PixelContent
from iad_core.evidence.masks import MaskImages
from iad_core.evidence.retained import RetainedImages
from iad_core.storage.models import ReviewDecisionRecord, Sample


class EvidenceSourcesCapture:
    def __init__(self, images: RetainedImages):
        self.images=images

    def freeze(self, sample: Sample, annotations: AnnotationSet, review: ReviewDecisionRecord | None,
               published: PixelIndexEntry | None) -> tuple[FrozenEvidenceSource,PixelContent]:
        source=SourceImage.read(sample.image_path,published)
        blob,pixels=self.images.capture(source,published)
        if pixels.descriptor.decode_status!='COMPLETE':raise ConsistencyError('UNSUPPORTED_IMAGE',pixels.descriptor.reason)
        if (sample.width,sample.height)!=(pixels.descriptor.width,pixels.descriptor.height):
            raise ConsistencyError('SOURCE_UNAVAILABLE','Original dimensions changed; rescan before comparison')
        masks,issues={},[]
        for annotation in annotations.annotations:
            if annotation.annotation_type!='mask' or annotation.geometry_status=='INVALID':continue
            try:
                if not annotation.mask_path or not annotation.mask_sha256:raise ValueError('Mask pixels are unavailable')
                payload=Path(annotation.mask_path).read_bytes()
                MaskImages.decode(payload,annotation.mask_sha256,sample)
                masks[annotation.annotation_id]=self.images.store(payload)
            except (OSError,ValueError) as error:
                issues.append(f'{annotation.annotation_id}: {error}')
        return FrozenEvidenceSource(sample=sample,annotations=annotations.model_copy(update={
            'annotation_coordinates':pixels.descriptor.annotation_coordinates}),review=review,
            source_sha256=source.sha256,scan_ref=published.scan_ref if published else None,
            content_group_id=published.content_group_id if published else None,
            descriptor=pixels.descriptor,image=blob,masks=masks,issues=issues),pixels

    def annotations(self, source: FrozenEvidenceSource) -> AnnotationSet:
        annotations=[]
        for annotation in source.annotations.annotations:
            if annotation.annotation_type=='mask':
                blob=source.masks.get(annotation.annotation_id)
                annotation=annotation.model_copy(update={'mask_path':self.images.path(blob) if blob else None})
            annotations.append(annotation)
        return source.annotations.model_copy(update={'annotations':annotations},deep=True)

