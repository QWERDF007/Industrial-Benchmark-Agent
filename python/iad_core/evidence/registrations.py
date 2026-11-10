from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import Field, StrictInt, model_validator

from iad_core.advisory.analysis import AnalysisModel, NonBlankText, VisualEvidence
from iad_core.evidence.images import EvidenceImages, PreparedImage, file_sha256, image_pixel_sha256
from iad_core.evidence.sources import SampleContent

if TYPE_CHECKING:
    from iad_core.workbench.analysis_manifest import AnalysisRegistration


class RegistrationMedia(AnalysisModel):
    sample_id: str
    dataset_id: str
    image: VisualEvidence
    model_context: dict
    path: str
    required: bool = True


class PreparedRegistration(AnalysisModel):
    sample_id: str
    images: list[RegistrationMedia]
    pixel_sha256: str | None = None
    error: str | None = None

    @property
    def evidence_id(self) -> str | None:
        return next((item.image.evidence_id for item in self.images if item.image.is_whole_image), None)

    def page(self, offset: int = 0, limit: int | None = None, *, images: list[RegistrationMedia] | None = None) -> 'RegistrationMediaPage':
        selected = self.images if images is None else images
        end = None if limit is None else offset + limit
        return RegistrationMediaPage(sample_id=self.sample_id, evidence_id=self.evidence_id,
            total=len(selected), offset=offset, images=selected[offset:end], error=self.error)


class RegistrationMediaQuery(AnalysisModel):
    sample_id: NonBlankText
    offset: int = Field(default=0, ge=0, strict=True)
    limit: int | None = Field(default=None, ge=1, strict=True)


class EvidenceReferenceQuery(AnalysisModel):
    evidence_id: NonBlankText


class RegistrationCropQuery(RegistrationMediaQuery):
    bbox: list[StrictInt] = Field(min_length=4, max_length=4)

    @model_validator(mode='after')
    def nonempty_window(self):
        if self.bbox[0] >= self.bbox[2] or self.bbox[1] >= self.bbox[3]:
            raise ValueError('裁窗须为非空的半开区间[x0,y0,x1,y1]')
        return self


class RegistrationMediaPage(AnalysisModel):
    sample_id: str
    evidence_id: str | None = None
    total: int
    offset: int
    images: list[RegistrationMedia]
    error: str | None


class RegistrationImages:
    """Prepare the frozen whole image and every annotation ROI for all native workflows."""

    def __init__(self, db_path: str):
        self.images = EvidenceImages(db_path)

    @staticmethod
    def _source_digest(record: AnalysisRegistration) -> str:
        digest=file_sha256(record.sample.image_path)
        content=SampleContent.describe(record.sample,record.annotations,digest)
        if record.source_fingerprint and content.fingerprint != record.source_fingerprint:
            raise ValueError('源图或标注版本与冻结清单不一致')
        return digest

    def crop(self, record: AnalysisRegistration, bbox: list[int], *, single_window: bool = False) -> PreparedRegistration:
        sample=record.sample
        digest=self._source_digest(record)
        box=[max(0,bbox[0]),max(0,bbox[1]),min(sample.width,bbox[2]),min(sample.height,bbox[3])]
        if box[0]>=box[2] or box[1]>=box[3]:
            raise ValueError('裁窗与原图没有有效交集')
        images=[]
        for tile in [box] if single_window else self.images.tiles(sample,box,0):
            image=self.images.capture(sample,'roi','model',tile,digest,full_resolution=True).with_source(
                sample,record.dataset_format,record.annotations)
            images.append(RegistrationMedia(sample_id=sample.sample_id,dataset_id=sample.dataset_id,image=image.evidence,
                path=image.path,model_context=image.model_context(),required=False))
        return PreparedRegistration(sample_id=sample.sample_id,images=images)

    def prepare(self, record: AnalysisRegistration, max_side: int | None, *, raw_annotations: bool = False) -> PreparedRegistration:
        sample = record.sample
        result = PreparedRegistration(sample_id=sample.sample_id, images=[])
        prepared = []
        try:
            digest = self._source_digest(record)
            overview = self.images.capture(sample, 'overview', 'global', source_sha256=digest,
                max_side=max_side, full_resolution=True)
            prepared.append(overview.with_source(sample, record.dataset_format, record.annotations))
            result.pixel_sha256 = image_pixel_sha256(sample.image_path, digest)
            if sample.annotation_availability.status == 'UNREADABLE':
                raise ValueError('原图可读，必需标注文件不可读')
            if record.dataset_format == 'labelme':
                if raw_annotations:
                    from iad_core.consistency.annotation_views import annotation_views
                    regions = annotation_views(sample, record.annotations)
                    required = {item.annotation_id for item in record.annotations if not item.is_ignored}
                    if required != {origin.annotation_id for region in regions for origin in region.origins}:
                        raise ValueError('原始标注无法生成全部必要的10%局部，不能跳过审核')
                else:
                    regions = [region for region in self.images.plan(sample, record.annotations, [])
                        if any(origin.annotation_id is not None for origin in region.origins)]
                for region in regions:
                    if raw_annotations:
                        image = self.images.capture(sample, 'roi', 'annotation', region.crop_bbox, digest, full_resolution=True)
                        ids = {origin.annotation_id for origin in region.origins}
                        prepared.append(image.with_source(sample, record.dataset_format,
                            [annotation for annotation in record.annotations if annotation.annotation_id in ids]))
                        continue
                    for image in self.images.capture_regions(sample, [region], record.annotations, digest):
                        ids = {origin.annotation_id for origin in image.origins}
                        prepared.append(PreparedImage(image.image, self.images.path(image.image), record.dataset_format,
                            tuple(annotation for annotation in record.annotations if annotation.annotation_id in ids)))
        except (OSError, ValueError) as error:
            result.error = str(error)
        result.images = [RegistrationMedia(sample_id=sample.sample_id, dataset_id=sample.dataset_id, image=image.evidence,
            path=image.path, model_context=image.model_context()) for image in prepared]
        return result
