import hashlib
import io
import json
import math
from dataclasses import dataclass, field
from pathlib import Path
from typing import ClassVar, Literal, Sequence

import numpy as np
from PIL import Image, UnidentifiedImageError

from iad_core.consistency.models import PixelComparison, PixelDescriptor
from iad_core.duplicate.verification_models import RegionPixelStatistics


@dataclass(frozen=True)
class PixelContent:
    MAX_COMPARE_PIXELS: ClassVar[int] = 256*1024
    descriptor: PixelDescriptor
    _pixels: np.ndarray | None = field(default=None, repr=False, compare=False)

    @property
    def decoded_bytes(self) -> int:
        return self._pixels.nbytes if self._pixels is not None else 0

    @classmethod
    def read(cls, source: str | Path | Image.Image, *, max_decoded_bytes: int = 256 * 1024 * 1024) -> 'PixelContent':
        if max_decoded_bytes < 1:
            raise ValueError('Decoded image budget must be positive')
        owned = not isinstance(source, Image.Image)
        image = None
        try:
            image = Image.open(source) if owned else source
            width, height = image.size
            mode = image.mode
            if getattr(image, 'n_frames', 1) != 1:
                return cls(PixelDescriptor(decode_status='UNSUPPORTED', reason='Multi-frame images are not comparable'))
            if mode == 'P':
                mode = 'RGBA' if 'transparency' in image.info or image.palette.mode == 'RGBA' else 'RGB'
            integer16 = mode in ('I;16', 'I;16L', 'I;16B', 'I;16N') or (mode == 'I' and image.format == 'PNG')
            if mode not in ('L', 'LA', 'RGB', 'RGBA') and not integer16:
                return cls(PixelDescriptor(decode_status='UNSUPPORTED', reason=f'Unsupported raw pixel mode: {image.mode}'))
            channels = 1 if integer16 or mode == 'L' else len(mode)
            if width * height * channels * (2 if integer16 else 1) > max_decoded_bytes:
                return cls(PixelDescriptor(decode_status='UNSUPPORTED', reason='RESOURCE_LIMIT: decoded image exceeds byte budget'))
            orientation = image.getexif().get(274, 1)
            pixels = np.asarray(image.convert(mode) if image.mode == 'P' else image)
            pixels = np.ascontiguousarray(pixels, dtype='<u2' if integer16 else np.uint8)
            pixels.setflags(write=False)
            metadata = dict(compare_profile='raw-decoded-v1', width=width, height=height,
                channel_semantics='L' if integer16 else mode, dtype='uint16' if integer16 else 'uint8',
                bit_depth=16 if integer16 else 8)
            digest = hashlib.sha256(json.dumps(metadata, sort_keys=True).encode())
            digest.update(memoryview(pixels).cast('B'))
            return cls(PixelDescriptor(**metadata, decode_status='COMPLETE', pixel_key=digest.hexdigest(),
                annotation_coordinates='RAW' if orientation == 1 else 'EXIF_AMBIGUOUS'), pixels)
        except (OSError, ValueError, UnidentifiedImageError, Image.DecompressionBombError) as error:
            return cls(PixelDescriptor(decode_status='UNAVAILABLE', reason=str(error)))
        finally:
            if owned and image is not None:
                image.close()

    def compare(self, other: 'PixelContent', *, block_rows: int = 128) -> PixelComparison:
        if block_rows < 1:
            raise ValueError('Comparison block size must be positive')
        problem=self._comparison_problem(other)
        if problem:return problem
        bounds=[(0,0,self.descriptor.width,self.descriptor.height)]
        total,changed,maximum=self._statistics(other,bounds,block_rows)
        return PixelComparison(status='COMPLETE', exact_equal=changed == 0,
            compared_pixels=total,changed_pixels=changed,max_abs_diff=maximum)

    def with_annotation_coordinates(self,coordinates: Literal['RAW','EXIF_AMBIGUOUS']) -> 'PixelContent':
        return PixelContent(self.descriptor.model_copy(update={'annotation_coordinates':coordinates}),self._pixels)

    def identity_comparison(self,other: 'PixelContent') -> PixelComparison | None:
        if self._pixels is None or self._pixels is not other._pixels or self._comparison_problem(other):return None
        return PixelComparison(status='COMPLETE',exact_equal=True,compared_pixels=self.descriptor.width*self.descriptor.height,
            changed_pixels=0,max_abs_diff=0)

    def _comparison_problem(self, other: 'PixelContent') -> PixelComparison | None:
        for descriptor in (self.descriptor,other.descriptor):
            if descriptor.decode_status!='COMPLETE':
                return PixelComparison(status=descriptor.decode_status,reason=descriptor.reason)
        fields=('compare_profile','width','height','channel_semantics','dtype','bit_depth')
        if any(getattr(self.descriptor,name)!=getattr(other.descriptor,name) for name in fields):
            return PixelComparison(status='INCOMPATIBLE',exact_equal=False,reason='Different raw pixel shapes or representations')
        return None

    def _statistics(self, other: 'PixelContent', bounds: Sequence[tuple[int,int,int,int]], block_rows: int) -> tuple[int,int,int]:
        if self._pixels is other._pixels:
            return sum((x2-x1)*(y2-y1) for x1,y1,x2,y2 in bounds),0,0
        total=changed=maximum=0
        for x1,y1,x2,y2 in bounds:
            columns=min(x2-x1,self.MAX_COMPARE_PIXELS)
            rows=min(block_rows,max(1,self.MAX_COMPARE_PIXELS//columns))
            for row in range(y1,y2,rows):
                end=min(row+rows,y2)
                for column in range(x1,x2,columns):
                    stop=min(column+columns,x2)
                    left = self._pixels[row:end,column:stop]
                    right = other._pixels[row:end,column:stop]
                    if left.ndim == 3:
                        different = np.zeros(left.shape[:2], dtype=bool)
                        for channel in range(left.shape[2]):
                            difference = np.subtract(left[...,channel], right[...,channel], dtype=np.int32)
                            np.abs(difference, out=difference)
                            np.logical_or(different, difference != 0, out=different)
                            maximum = max(maximum, int(difference.max()))
                    else:
                        difference = np.subtract(left, right, dtype=np.int32)
                        np.abs(difference, out=difference)
                        different = difference != 0
                        maximum = max(maximum, int(difference.max()))
                    total+=different.size
                    changed += int(np.count_nonzero(different))
        return total,changed,maximum

    def region_statistics(self, other: 'PixelContent', regions: Sequence[Sequence[float]]) -> RegionPixelStatistics:
        if len(regions)>RegionPixelStatistics.MAX_REGIONS:
            return RegionPixelStatistics(status='UNSUPPORTED',regions=[],reason='RESOURCE_LIMIT: local region budget exceeded')
        clipped=[]
        for box in regions:
            if len(box)!=4 or not all(math.isfinite(value) for value in box) or box[0]>=box[2] or box[1]>=box[3]:
                raise ValueError('Regions require finite, ordered xyxy coordinates')
            x1,y1=max(0,math.floor(box[0])),max(0,math.floor(box[1]))
            x2,y2=min(self.descriptor.width,math.ceil(box[2])),min(self.descriptor.height,math.ceil(box[3]))
            if x1<x2 and y1<y2:clipped.append((x1,y1,x2,y2))
        problem=self._comparison_problem(other)
        if problem:
            return RegionPixelStatistics(status=problem.status,regions=clipped,reason=problem.reason)
        if not clipped:
            return RegionPixelStatistics(status='NOT_OBSERVABLE',regions=[],reason='No requested region overlaps the original image')
        rows=sorted({value for box in clipped for value in (box[1],box[3])})
        bounds=[]
        for y1,y2 in zip(rows,rows[1:]):
            intervals=sorted((x1,x2) for x1,top,x2,bottom in clipped if top<=y1 and bottom>=y2)
            merged=[]
            for x1,x2 in intervals:
                if merged and x1<=merged[-1][1]:merged[-1]=(merged[-1][0],max(x2,merged[-1][1]))
                else:merged.append((x1,x2))
            bounds.extend((x1,y1,x2,y2) for x1,x2 in merged)
        total,changed,maximum=self._statistics(other,bounds,128)
        return RegionPixelStatistics(status='COMPLETE',regions=clipped,compared_pixels=total,
            changed_pixels=changed,max_abs_diff=maximum)

    def image(self) -> Image.Image:
        if self._pixels is None:
            raise ValueError(self.descriptor.reason)
        return Image.fromarray(self._pixels)

    def png(self) -> bytes:
        image = self.image()
        output = io.BytesIO()
        image.save(output, format='PNG')
        return output.getvalue()
