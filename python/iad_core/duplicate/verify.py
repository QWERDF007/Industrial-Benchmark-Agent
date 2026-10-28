from dataclasses import dataclass
from threading import Lock
from typing import Sequence

import numpy as np
from PIL import Image

from iad_core.duplicate.pixels import PixelContent
from iad_core.duplicate.verification_models import NearComparisonConfig, VerificationResult


@dataclass(frozen=True)
class PreparedPixels:
    values: np.ndarray
    crop: np.ndarray
    norm: float
    mean: float
    std: float
    fitted_size: tuple[int,int]
    padding: tuple[int,int]

    @classmethod
    def from_content(cls, content: PixelContent, target: tuple[int,int]):
        original=content.image()
        gray=(Image.fromarray((np.asarray(original,dtype=np.float32)/257).astype(np.uint8))
            if content.descriptor.dtype=='uint16' else original.convert('L'))
        width,height=gray.size
        scale=min(target[0]/width,target[1]/height)
        fitted=(max(1,int(width*scale)),max(1,int(height*scale)))
        padding=((target[0]-fitted[0])//2,(target[1]-fitted[1])//2)
        canvas=Image.new('L',target,0)
        canvas.paste(gray.resize(fitted,Image.Resampling.BICUBIC),padding)
        values=np.asarray(canvas,dtype=np.float32)/255
        crop=values[3:-3,3:-3]
        return cls(values,crop,float(np.linalg.norm(crop)),float(crop.mean()),float(crop.std()),fitted,padding)


@dataclass(frozen=True)
class VerificationStats:
    thumbnail_preparations: int
    retained_thumbnail_bytes: int


class PairVerifier:
    def __init__(self, config: NearComparisonConfig | None = None):
        self.config=config or NearComparisonConfig()
        self._thumbnail_source: PixelContent | None = None
        self._thumbnail: PreparedPixels | None = None
        self._thumbnail_preparations = 0
        self._thumbnail_lock = Lock()

    def stats(self) -> VerificationStats:
        with self._thumbnail_lock:
            return VerificationStats(self._thumbnail_preparations,self._thumbnail.values.nbytes if self._thumbnail else 0)

    def verify(self, path_a: str, path_b: str, dino_cosine: float | None = None,
               *, regions: Sequence[Sequence[float]] | None = None) -> VerificationResult:
        return self.verify_pixels(PixelContent.read(path_a),PixelContent.read(path_b),dino_cosine,regions=regions)

    def verify_pixels(self, left: PixelContent, right: PixelContent, dino_cosine: float | None = None,
                      *, regions: Sequence[Sequence[float]] | None = None) -> VerificationResult:
        pixel=left.identity_comparison(right) or left.compare(right)
        local=left.region_statistics(right,regions) if regions is not None else None
        if pixel.exact_equal:
            return VerificationResult(verified=True,relation='EXACT',pixel=pixel,local=local,dino_cosine=dino_cosine,
                pixel_cosine=1,ncc=1,mean_abs_diff=0,high_diff_ratio=0,best_shift=(0,0),
                details={'basis':'Original pixels are identical; thumbnail identity metrics are implied, not separately measured'})
        if pixel.exact_equal is None:
            return VerificationResult(verified=False,relation='UNCHECKED',pixel=pixel,local=local,
                dino_cosine=dino_cosine,details={'error':pixel.reason})
        config=self.config
        with self._thumbnail_lock:
            if self._thumbnail_source is not left or self._thumbnail.values.shape != config.target_size[::-1]:
                self._thumbnail=PreparedPixels.from_content(left,config.target_size)
                self._thumbnail_source=left
                self._thumbnail_preparations+=1
            a=self._thumbnail
            self._thumbnail_preparations+=1
        b=PreparedPixels.from_content(right,config.target_size)
        best_mad=float(np.abs(a.crop-b.crop).mean())
        best_shift=(0,0)
        height,width=a.crop.shape
        if config.enable_translation_search and .001<=best_mad<=.05:
            for dy in range(-3,4):
                for dx in range(-3,4):
                    shifted=b.values[3+dy:3+dy+height,3+dx:3+dx+width]
                    mad=float(np.abs(a.crop-shifted).mean())
                    if mad<best_mad:best_mad,best_shift=mad,(dy,dx)
        dy,dx=best_shift
        other=b.values[3+dy:3+dy+height,3+dx:3+dx+width]
        difference=np.abs(a.crop-other)
        mad=float(difference.mean())
        hdr=float((difference>config.diff_pixel_threshold).mean())
        norm=float(np.linalg.norm(other))
        cosine=(1. if a.norm==norm else 0.) if not a.norm or not norm else float(np.sum(a.crop*other)/(a.norm*norm))
        mean,std=float(other.mean()),float(other.std())
        ncc=(1. if abs(a.mean-mean)<1e-3 else 0.) if a.std<1e-6 or std<1e-6 else float(np.mean((a.crop-a.mean)*(other-mean))/(a.std*std))
        cosine,ncc=float(np.clip(cosine,-1,1)),float(np.clip(ncc,-1,1))
        accepted=(cosine>=config.pixel_cosine_threshold and ncc>=config.ncc_threshold
            and mad<=config.max_mean_abs_diff and hdr<=config.max_high_diff_ratio)
        return VerificationResult(verified=accepted,relation='NEAR_CANDIDATE' if accepted else 'VISUAL_REFERENCE',
            pixel=pixel,local=local,dino_cosine=dino_cosine,pixel_cosine=cosine,ncc=ncc,
            mean_abs_diff=mad,high_diff_ratio=hdr,best_shift=best_shift,details={
                'config':config.model_dump(mode='json'),'conversion':'luminance; alpha discarded; uint16 scaled by 1/257',
                'resampling':'BICUBIC','padding':'zero','border_excluded':3,'shift_coordinates':'thumbnail dy,dx',
                'left':{'original_size':[left.descriptor.width,left.descriptor.height],'fitted_size':list(a.fitted_size),'padding':list(a.padding)},
                'right':{'original_size':[right.descriptor.width,right.descriptor.height],'fitted_size':list(b.fitted_size),'padding':list(b.padding)}})


def verify_pair(path_a: str, path_b: str, *, config: NearComparisonConfig | None = None,
                dino_cosine: float | None = None) -> VerificationResult:
    return PairVerifier(config).verify(path_a,path_b,dino_cosine)
