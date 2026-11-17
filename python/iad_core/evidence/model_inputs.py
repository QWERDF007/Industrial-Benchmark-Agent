import hashlib
import io
import json
import os
import tempfile
from pathlib import Path

from filelock import FileLock
from PIL import Image
from pydantic import Field

from iad_core.advisory.analysis import AnalysisModel, VisualEvidence
from iad_core.evidence.files import ImageFiles
from iad_core.storage.models import Annotation


MODEL_IMAGE_GUIDANCE = '图像按本场设置限制最大边，保持比例且不放大。original_size和annotations使用原图坐标；sent_size为本幅实际发送尺寸，view_annotations为本幅送图坐标，original_to_sent给出原图到本幅图片的六参数变换。局部先从原图裁取再缩放；裁窗请求仍使用原图坐标。'


class ModelImageInput(AnalysisModel):
    path: str
    sha256: str = Field(pattern='^[a-f0-9]{64}$')
    sent_size: tuple[int, int]

    def context(self, evidence: VisualEvidence, annotations: tuple[Annotation, ...]) -> dict:
        x0, y0, x1, y1 = evidence.crop_bbox
        width, height = self.sent_size
        sx, sy = width / (x1-x0), height / (y1-y0)
        projected = []
        for annotation in annotations:
            view = annotation.model_dump(mode='json', include={'annotation_id','annotation_type','raw_label','is_ignored'})
            if annotation.bbox:
                left, top, right, bottom = annotation.bbox
                if right <= x0 or bottom <= y0 or left >= x1 or top >= y1:
                    continue
                view['bbox'] = [max(0,(left-x0)*sx),max(0,(top-y0)*sy),
                    min(width,(right-x0)*sx),min(height,(bottom-y0)*sy)]
            if annotation.polygon:
                view['polygon'] = [[(x-x0)*sx,(y-y0)*sy] for x,y in annotation.polygon]
            projected.append(view)
        return {'sent_size':list(self.sent_size),'annotation_coordinates':'ORIGINAL',
            'original_to_sent':[sx,0,-x0*sx,0,sy,-y0*sy],
            'view_annotation_coordinates':'SENT_IMAGE','view_annotations':projected}


class ModelImageInputs:
    VERSION = 'model-input-png-v1'

    def __init__(self, db_path: str):
        self.root = Path(db_path).resolve().parent / 'cache' / 'model-inputs'
        self.files = ImageFiles(self.root)

    def _cached(self, index: Path) -> ModelImageInput | None:
        if not index.is_file():
            return None
        descriptor = json.loads(index.read_text())
        path = self.files.find(descriptor['sha256'])
        return ModelImageInput.model_validate({**descriptor,'path':path}) if path else None

    def prepare(self, image: VisualEvidence, path: str, max_side: int) -> ModelImageInput:
        if max_side < 1:
            raise ValueError('图像最大边必须为正整数')
        if max(image.sent_size) <= max_side:
            return ModelImageInput(path=path,sha256=image.sha256,sent_size=tuple(image.sent_size))
        key = hashlib.sha256(f'{self.VERSION}:{image.sha256}:{max_side}:{image.representation}'.encode()).hexdigest()
        index = self.root / (key + '.json')
        cached = self._cached(index)
        if cached is not None:
            return cached
        self.root.mkdir(parents=True,exist_ok=True)
        with FileLock(str(index)+'.lock'):
            cached = self._cached(index)
            if cached is not None:
                return cached
            with Image.open(path) as original:
                image_pixels = original.convert('I') if original.mode.startswith('I;16') else original
                image_pixels.thumbnail((max_side,max_side),
                    Image.Resampling.NEAREST if image.representation=='annotation_mask' else Image.Resampling.LANCZOS,
                    reducing_gap=3.0)
                encoded = io.BytesIO()
                if image_pixels.mode != original.mode:
                    image_pixels = image_pixels.convert(original.mode)
                image_pixels.save(encoded,'PNG',compress_level=3)
                size = image_pixels.size
            output, digest = self.files.store(encoded.getvalue())
            result = ModelImageInput(path=output,sha256=digest,sent_size=size)
            temporary = None
            try:
                with tempfile.NamedTemporaryFile(mode='w',dir=self.root,suffix='.tmp',delete=False) as stream:
                    temporary = Path(stream.name)
                    stream.write(result.model_dump_json(exclude={'path'}))
                os.replace(temporary,index)
            finally:
                if temporary is not None:
                    temporary.unlink(missing_ok=True)
            return result
