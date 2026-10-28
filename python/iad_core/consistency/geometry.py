import math
from dataclasses import dataclass
from functools import cached_property

import numpy as np
from PIL import Image, ImageDraw

from iad_core.evidence.masks import ImageDimensions, MaskImages
from iad_core.storage.models import Annotation
from iad_core.consistency.annotation_models import AnnotationMasking


def bbox_iou(left, right) -> float:
    intersection = max(0., min(left[2], right[2])-max(left[0], right[0])) * max(0., min(left[3], right[3])-max(left[1], right[1]))
    union = (left[2]-left[0])*(left[3]-left[1]) + (right[2]-right[0])*(right[3]-right[1]) - intersection
    return intersection / union if union else 0.


def union_region(regions) -> list[float]:
    return [min(r[0] for r in regions), min(r[1] for r in regions), max(r[2] for r in regions), max(r[3] for r in regions)]


@dataclass(frozen=True)
class InstanceGeometry:
    annotation: Annotation
    bounds: tuple[float, float, float, float]
    pixels: np.ndarray | None = None
    origin: tuple[int, int] = (0, 0)
    masked_domain: bool = False

    @cached_property
    def area(self) -> float:
        return float(np.count_nonzero(self.pixels)) if self.pixels is not None else (self.bounds[2]-self.bounds[0])*(self.bounds[3]-self.bounds[1])

    @classmethod
    def prepare(cls, annotation: Annotation, sample: ImageDimensions, max_roi_pixels: int) -> 'InstanceGeometry':
        if annotation.geometry_status == 'INVALID':
            raise ValueError('Imported annotation geometry is invalid')
        if annotation.annotation_type == 'image':
            return cls(annotation, (0.,0.,float(sample.width),float(sample.height)))
        mask = None
        polygon = annotation.polygon if annotation.annotation_type == 'polygon' else None
        if annotation.annotation_type == 'mask':
            mask = MaskImages.load(annotation, sample)
            bounds = mask.getbbox()
        elif polygon is not None:
            if len(polygon) < 3 or any(len(p) != 2 or not all(math.isfinite(v) for v in p) for p in polygon):
                raise ValueError('Polygon must have at least three finite points')
            if any(not (0 <= x <= sample.width and 0 <= y <= sample.height) for x,y in polygon):
                raise ValueError('Polygon coordinates are outside the original image')
            bounds = (min(p[0] for p in polygon), min(p[1] for p in polygon),
                min(sample.width,max(p[0] for p in polygon)+1), min(sample.height,max(p[1] for p in polygon)+1))
        else:
            bounds = annotation.bbox
        if bounds is None or len(bounds) != 4 or not all(math.isfinite(v) for v in bounds):
            raise ValueError('Region requires finite xyxy coordinates')
        x1,y1,x2,y2 = bounds
        if not (0 <= x1 < x2 <= sample.width and 0 <= y1 < y2 <= sample.height):
            raise ValueError('Region coordinates are outside the original image')
        pixels = None
        origin = (math.floor(x1), math.floor(y1))
        if mask is not None or polygon is not None:
            roi = (*origin, math.ceil(x2), math.ceil(y2))
            if (roi[2]-roi[0])*(roi[3]-roi[1]) > max_roi_pixels:
                raise ValueError('RESOURCE_LIMIT: annotation ROI exceeds the configured pixel budget')
            if mask is not None:
                raster = mask.crop(roi)
                mask.close()
            else:
                raster = Image.new('L', (roi[2]-roi[0],roi[3]-roi[1]))
                ImageDraw.Draw(raster).polygon([(x-origin[0],y-origin[1]) for x,y in polygon], fill=255)
            pixels = np.asarray(raster) != 0
            if not np.any(pixels):
                raise ValueError('Region contains no foreground pixels')
            pixels.setflags(write=False)
        return cls(annotation, tuple(bounds), pixels, origin)

    def segmentation_iou(self, other: 'InstanceGeometry') -> float | None:
        if (self.pixels is None or other.pixels is None
                or self.annotation.annotation_type not in ('mask', 'polygon')
                or other.annotation.annotation_type not in ('mask', 'polygon')):
            return None
        return self.pixel_iou(other)

    @property
    def pixel_area(self) -> int:
        if self.pixels is not None:
            return int(np.count_nonzero(self.pixels))
        x1,y1,x2,y2 = self.bounds
        return max(0,math.ceil(x2-.5)-math.ceil(x1-.5))*max(0,math.ceil(y2-.5)-math.ceil(y1-.5))

    def raster(self, bounds: tuple[int,int,int,int]) -> np.ndarray:
        x1,y1,x2,y2 = bounds
        if self.pixels is None:
            xs = np.arange(x1,x2,dtype=np.float64)+.5
            ys = np.arange(y1,y2,dtype=np.float64)+.5
            return ((ys>=self.bounds[1]) & (ys<self.bounds[3]))[:,None] & ((xs>=self.bounds[0]) & (xs<self.bounds[2]))[None,:]
        result = np.zeros((y2-y1,x2-x1),dtype=bool)
        left,top = max(x1,self.origin[0]),max(y1,self.origin[1])
        right,bottom = min(x2,self.origin[0]+self.pixels.shape[1]),min(y2,self.origin[1]+self.pixels.shape[0])
        if right>left and bottom>top:
            result[top-y1:bottom-y1,left-x1:right-x1] = self.pixels[top-self.origin[1]:bottom-self.origin[1],left-self.origin[0]:right-self.origin[0]]
        return result

    def pixel_iou(self, other: 'InstanceGeometry') -> float:
        x1,y1 = math.floor(max(self.bounds[0],other.bounds[0])),math.floor(max(self.bounds[1],other.bounds[1]))
        x2,y2 = math.ceil(min(self.bounds[2],other.bounds[2])),math.ceil(min(self.bounds[3],other.bounds[3]))
        intersection = 0
        if x2 > x1 and y2 > y1:
            bounds = (x1,y1,x2,y2)
            intersection = int(np.count_nonzero(self.raster(bounds) & other.raster(bounds)))
        union = self.pixel_area+other.pixel_area-intersection
        return intersection/union if union else 0.

    def exclude(self, ignores: list['InstanceGeometry'], max_roi_pixels: int) -> tuple['InstanceGeometry | None', AnnotationMasking | None]:
        overlapping = [region for region in ignores if bbox_iou(self.bounds,region.bounds)>0]
        if not overlapping:
            return self,None
        bounds = (math.floor(self.bounds[0]),math.floor(self.bounds[1]),math.ceil(self.bounds[2]),math.ceil(self.bounds[3]))
        if (bounds[2]-bounds[0])*(bounds[3]-bounds[1])>max_roi_pixels:
            raise ValueError('RESOURCE_LIMIT: ignored-region comparison exceeds the ROI budget')
        original = self.raster(bounds)
        excluded = np.zeros_like(original)
        applied = []
        for region in overlapping:
            pixels = region.raster(bounds)
            if np.any(pixels & original):
                excluded |= pixels
                applied.append(region.annotation.annotation_id)
        if not applied:
            return self,None
        visible = original & ~excluded
        count = int(np.count_nonzero(visible))
        masking = AnnotationMasking(annotation_id=self.annotation.annotation_id,total_pixels=int(np.count_nonzero(original)),
            visible_pixels=count,ignore_annotation_ids=applied)
        if count==0:
            return None,masking
        xs,ys = np.flatnonzero(visible.any(axis=0)),np.flatnonzero(visible.any(axis=1))
        x1,y1,x2,y2 = int(xs[0]),int(ys[0]),int(xs[-1])+1,int(ys[-1])+1
        pixels = visible[y1:y2,x1:x2].copy()
        pixels.setflags(write=False)
        origin = (bounds[0]+x1,bounds[1]+y1)
        return InstanceGeometry(self.annotation,(*origin,bounds[0]+x2,bounds[1]+y2),pixels,origin,True),masking

    def covered_fraction(self, pieces: list['InstanceGeometry']) -> float:
        if self.pixels is not None and (all(piece.pixels is not None for piece in pieces) or self.masked_domain or any(piece.masked_domain for piece in pieces)):
            covered = np.zeros_like(self.pixels)
            for piece in pieces:
                x1,y1=max(self.origin[0],math.floor(piece.bounds[0])),max(self.origin[1],math.floor(piece.bounds[1]))
                x2,y2=min(self.origin[0]+self.pixels.shape[1],math.ceil(piece.bounds[2])),min(self.origin[1]+self.pixels.shape[0],math.ceil(piece.bounds[3]))
                if x2>x1 and y2>y1:
                    covered[y1-self.origin[1]:y2-self.origin[1],x1-self.origin[0]:x2-self.origin[0]] |= piece.raster((x1,y1,x2,y2))
            return float(np.count_nonzero(covered & self.pixels))/self.area
        rectangles = [(max(self.bounds[0],p.bounds[0]),max(self.bounds[1],p.bounds[1]),
            min(self.bounds[2],p.bounds[2]),min(self.bounds[3],p.bounds[3])) for p in pieces]
        xs = sorted({x for r in rectangles for x in (r[0],r[2])})
        area=0.
        for x1,x2 in zip(xs,xs[1:]):
            intervals=sorted((r[1],r[3]) for r in rectangles if r[0]<=x1 and r[2]>=x2 and r[3]>r[1])
            top=bottom=None
            length=0.
            for y1,y2 in intervals:
                if top is None or y1>bottom:
                    if top is not None:
                        length += bottom-top
                    top,bottom=y1,y2
                else:
                    bottom=max(bottom,y2)
            if top is not None:
                length += bottom-top
            area += (x2-x1)*length
        return area/((self.bounds[2]-self.bounds[0])*(self.bounds[3]-self.bounds[1]))
