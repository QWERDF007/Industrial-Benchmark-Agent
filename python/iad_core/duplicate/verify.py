import os
import logging
from typing import Tuple, Dict, Any, Optional
import numpy as np
from PIL import Image
from pydantic import BaseModel, Field

logger = logging.getLogger("iad_core.duplicate.verify")


class VerificationResult(BaseModel):
    """
    Detailed verification metrics for an image pair evaluated by PairVerifier V2.
    """
    verified: bool
    dino_cosine: Optional[float] = None
    pixel_cosine: float
    ncc: float
    mean_abs_diff: float
    high_diff_ratio: float
    best_shift: Tuple[int, int] = (0, 0)
    details: Dict[str, Any] = Field(default_factory=dict)


class PairVerifier:
    """
    Deterministic pixel-level PairVerifier V2 for near-duplicate candidates.
    Evaluates:
    - Normalized Cross Correlation (NCC)
    - Pixel Cosine Similarity
    - Mean Absolute Difference (MAD)
    - High Difference Pixel Ratio (HDR)
    - ±3px translation search to compensate for micro-jitter
    Uses 256x256 input resolution with in-memory array cache for sub-millisecond execution.
    """

    def __init__(
        self,
        target_size: Tuple[int, int] = (256, 256),
        pixel_cosine_threshold: float = 0.990,
        ncc_threshold: float = 0.980,
        max_mean_abs_diff: float = 0.0060,
        max_high_diff_ratio: float = 0.0015,
        diff_pixel_threshold: float = 0.08,
        enable_translation_search: bool = True,
    ):
        self.target_size = target_size
        self.pixel_cosine_threshold = pixel_cosine_threshold
        self.ncc_threshold = ncc_threshold
        self.max_mean_abs_diff = max_mean_abs_diff
        self.max_high_diff_ratio = max_high_diff_ratio
        self.diff_pixel_threshold = diff_pixel_threshold
        self.enable_translation_search = enable_translation_search
        self._cache: Dict[str, Tuple[np.ndarray, np.ndarray, float, float, float]] = {}

    def _get_image_data(self, image_path: str) -> Tuple[np.ndarray, np.ndarray, float, float, float]:
        if image_path in self._cache:
            return self._cache[image_path]

        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")

        with Image.open(image_path) as img:
            img = img.convert("L")
            w, h = img.size
            tw, th = self.target_size
            scale = min(tw / w, th / h)
            nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
            resample = getattr(getattr(Image, "Resampling", Image), "BICUBIC", Image.BICUBIC)
            resized = img.resize((nw, nh), resample)

            canvas = Image.new("L", (tw, th), color=0)
            pad_left = (tw - nw) // 2
            pad_top = (th - nh) // 2
            canvas.paste(resized, (pad_left, pad_top))
            arr = np.asarray(canvas, dtype=np.float32) / 255.0

        center_crop = arr[3:-3, 3:-3]
        norm = float(np.linalg.norm(center_crop))
        mean = float(np.mean(center_crop))
        std = float(np.std(center_crop))

        item = (arr, center_crop, norm, mean, std)
        self._cache[image_path] = item
        return item

    def verify(
        self, path_a: str, path_b: str, dino_cosine: Optional[float] = None
    ) -> VerificationResult:
        try:
            arr_a, crop_a, norm_a, mean_a, std_a = self._get_image_data(path_a)
            arr_b, crop_b, norm_b, mean_b, std_b = self._get_image_data(path_b)
        except Exception as e:
            logger.warning(f"Failed to load pair ({path_a}, {path_b}): {e}")
            return VerificationResult(
                verified=False,
                dino_cosine=dino_cosine,
                pixel_cosine=0.0,
                ncc=0.0,
                mean_abs_diff=1.0,
                high_diff_ratio=1.0,
                best_shift=(0, 0),
                details={"error": str(e)},
            )

        base_diff = np.abs(crop_a - crop_b)
        base_mad = float(np.mean(base_diff))
        best_mad = base_mad
        best_shift = (0, 0)

        if self.enable_translation_search and (0.001 <= base_mad <= 0.05):
            for dy in range(-3, 4):
                for dx in range(-3, 4):
                    shifted_b = arr_b[3 + dy : 3 + dy + 250, 3 + dx : 3 + dx + 250]
                    m = float(np.mean(np.abs(crop_a - shifted_b)))
                    if m < best_mad:
                        best_mad = m
                        best_shift = (dy, dx)

        dy, dx = best_shift
        opt_b = arr_b[3 + dy : 3 + dy + 250, 3 + dx : 3 + dx + 250]
        final_diff = np.abs(crop_a - opt_b)
        mad = float(np.mean(final_diff))
        hdr = float(np.mean(final_diff > self.diff_pixel_threshold))

        norm_opt_b = float(np.linalg.norm(opt_b))
        if norm_a == 0 or norm_opt_b == 0:
            cos_sim = 1.0 if norm_a == norm_opt_b else 0.0
        else:
            cos_sim = float(np.dot(crop_a.flatten(), opt_b.flatten()) / (norm_a * norm_opt_b))

        std_opt_b = float(np.std(opt_b))
        mean_opt_b = float(np.mean(opt_b))
        if std_a < 1e-6 or std_opt_b < 1e-6:
            ncc = 1.0 if abs(mean_a - mean_opt_b) < 1e-3 else 0.0
        else:
            centered_a = crop_a - mean_a
            centered_b = opt_b - mean_opt_b
            ncc = float(np.mean(centered_a * centered_b) / (std_a * std_opt_b))

        cos_sim = float(np.clip(cos_sim, -1.0, 1.0))
        ncc = float(np.clip(ncc, -1.0, 1.0))

        is_verified = (
            (cos_sim >= self.pixel_cosine_threshold)
            and (ncc >= self.ncc_threshold)
            and (mad <= self.max_mean_abs_diff)
            and (hdr <= self.max_high_diff_ratio)
        )

        return VerificationResult(
            verified=is_verified,
            dino_cosine=dino_cosine,
            pixel_cosine=round(cos_sim, 4),
            ncc=round(ncc, 4),
            mean_abs_diff=round(mad, 4),
            high_diff_ratio=round(hdr, 4),
            best_shift=best_shift,
            details={
                "target_size": list(self.target_size),
                "pixel_cosine_threshold": self.pixel_cosine_threshold,
                "ncc_threshold": self.ncc_threshold,
                "max_mean_abs_diff": self.max_mean_abs_diff,
                "max_high_diff_ratio": self.max_high_diff_ratio,
            },
        )


def verify_pair(
    path_a: str,
    path_b: str,
    target_size: Tuple[int, int] = (256, 256),
    pixel_cosine_threshold: float = 0.990,
    ncc_threshold: float = 0.980,
    max_mean_abs_diff: float = 0.0060,
    max_high_diff_ratio: float = 0.0015,
    dino_cosine: Optional[float] = None,
) -> VerificationResult:
    verifier = PairVerifier(
        target_size=target_size,
        pixel_cosine_threshold=pixel_cosine_threshold,
        ncc_threshold=ncc_threshold,
        max_mean_abs_diff=max_mean_abs_diff,
        max_high_diff_ratio=max_high_diff_ratio,
    )
    return verifier.verify(path_a, path_b, dino_cosine=dino_cosine)
