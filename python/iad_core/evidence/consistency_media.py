import io
import math

from PIL import Image, ImageDraw

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.evidence_models import EvidenceMedia, EvidenceSources, FrozenEvidence
from iad_core.consistency.annotation_models import AnnotationComparison
from iad_core.evidence.consistency_sources import EvidenceSourcesCapture
from iad_core.evidence.images import EvidenceImages, OVERVIEW_MAX_SIDE
from iad_core.evidence.files import ImageFiles
from iad_core.evidence.retained import RetainedImages
from iad_core.evidence.views import padded_bbox
from iad_core.storage.database import Database


class ConsistencyMedia:
    def __init__(self, db: Database):
        self.images=RetainedImages(db)
        self.sources=EvidenceSourcesCapture(self.images)
        self.previews=EvidenceImages(db.db_path)

    @staticmethod
    def describe(evidence_sources: EvidenceSources, annotation: AnnotationComparison) -> list[EvidenceMedia]:
        media=[]
        for side in ('left','right'):
            source=getattr(evidence_sources,side)
            unavailable=bool(source.issues or source.annotations.errors or source.annotations.annotation_coordinates!='RAW'
                or any(item.geometry_status=='INVALID' for item in source.annotations.annotations))
            normalization='UINT16_FULL_RANGE_DISPLAY' if source.descriptor.dtype=='uint16' else 'UINT8_DISPLAY'
            full=(0,0,source.sample.width,source.sample.height)
            for representation in ('original','preview','annotation_overlay','annotation_mask'):
                available=not unavailable or representation in ('original','preview')
                media.append(EvidenceMedia(media_id=f'{side}-{representation}',side=side,representation=representation,bbox=full,
                    normalization='RAW' if representation=='original' else 'UINT8_DISPLAY' if representation=='annotation_mask' else normalization,available=available,
                    reason=None if available else 'Annotations were incomplete, unreadable or their coordinate domain was unknown at capture'))
            for annotation_id in source.masks:
                media.append(EvidenceMedia(media_id=f'{side}-mask-{annotation_id}',side=side,representation='annotation_mask',bbox=full,
                    annotation_id=annotation_id,normalization='UINT8_DISPLAY',available=not unavailable,
                    reason='Annotation coordinates were unavailable at capture' if unavailable else None))
            for difference in annotation.differences:
                if difference.region is None:continue
                raw_box=[math.floor(difference.region[0]),math.floor(difference.region[1]),math.ceil(difference.region[2]),math.ceil(difference.region[3])]
                box=tuple(padded_bbox(source.sample,raw_box,.2))
                if box[0]>=box[2] or box[1]>=box[3]:continue
                reference=side if difference.reference_from_other==side else None
                for representation in ('preview','reference_overlay' if reference else 'annotation_overlay'):
                    available=not unavailable or representation=='preview'
                    media.append(EvidenceMedia(media_id=f'{side}-{difference.difference_id}-{representation}',side=side,
                        representation=representation,bbox=box,difference_id=difference.difference_id,normalization=normalization,
                        reference_from_other=reference if representation=='reference_overlay' else None,available=available,
                        reason=None if available else 'Annotations were incomplete or unreadable at capture'))
        return media

    def render(self, evidence: FrozenEvidence, media: EvidenceMedia) -> dict:
        if not media.available:raise ConsistencyError('ANNOTATION_UNREADABLE',media.reason)
        source=getattr(evidence.sources,media.side)
        original=self.images.path(source.image)
        if media.representation=='original':return {'path':original,'media_type':'image/png'}
        annotations=self.sources.annotations(source).annotations if media.representation in ('annotation_overlay','annotation_mask','reference_overlay') else None
        if media.annotation_id is not None:annotations=[item for item in annotations if item.annotation_id==media.annotation_id]
        sample=source.sample.model_copy(update={'image_path':original})
        prepared=self.previews.capture(sample,'overview' if tuple(media.bbox)==(0,0,sample.width,sample.height) else 'roi',
            'annotation' if annotations is not None else 'coverage',bbox=list(media.bbox),source_sha256=source.image.sha256,
            annotations=annotations,annotation_mode='annotation_mask' if media.representation=='annotation_mask' else 'annotation_overlay',max_side=OVERVIEW_MAX_SIDE)
        path=self.previews.path(prepared.evidence)
        if media.representation=='reference_overlay':
            difference=next(value for value in evidence.result.annotation.differences if value.difference_id==media.difference_id)
            with Image.open(path) as original:
                image=original.copy()
            sx,sy=image.width/(media.bbox[2]-media.bbox[0]),image.height/(media.bbox[3]-media.bbox[1])
            x1,y1,x2,y2=[(value-media.bbox[index%2])* (sx if index%2==0 else sy) for index,value in enumerate(difference.region)]
            draw=ImageDraw.Draw(image)
            for start in range(math.floor(x1),math.ceil(x2),10):
                for y in (y1,y2):draw.line((start,y,min(start+6,x2),y),fill='red',width=2)
            for start in range(math.floor(y1),math.ceil(y2),10):
                for x in (x1,x2):draw.line((x,start,x,min(start+6,y2)),fill='red',width=2)
            output=io.BytesIO();image.save(output,'PNG')
            path,_=ImageFiles(self.previews.root).store(output.getvalue())
        return {'path':path,'media_type':'image/png'}
