import os
import logging
from typing import Tuple, Dict, Any, Optional
import numpy as np
from PIL import Image
from pydantic import BaseModel, Field

logger = logging.getLogger("iad_benchmark.features.verify")


class VerificationResult(BaseModel):
    verified: bool
    pixel_cosine: float
    ncc: float
    details: Dict[str, Any] = Field(default_factory=dict)


class PairVerifier:
    """
    Lightweight, deterministic pixel-level pair verifier for near-duplicate candidates.
    Uses Normalized Cross Correlation (NCC) and Pixel Cosine Similarity.
    Zero-GPU overhead with in-memory feature cache for extreme speed.
    """

    def __init__(
        self,
        target_size: Tuple[int, int] = (128, 128),
        pixel_cosine_threshold: float = 0.95,
        ncc_threshold: float = 0.90,
    ):
        self.target_size = target_size
        self.pixel_cosine_threshold = pixel_cosine_threshold
        self.ncc_threshold = ncc_threshold
        self._cache: Dict[str, Tuple[np.ndarray, float, float, float, Optional[np.ndarray]]] = {}

    def _get_vector(self, image_path: str):
        if image_path in self._cache:
            return self._cache[image_path]
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")

        with Image.open(image_path) as img:
            # Resize with aspect ratio preserved onto square center canvas
            img = img.convert("L")  # Grayscale for robust luminance comparison
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
            arr = np.asarray(canvas, dtype=np.float32).flatten()

        norm = float(np.linalg.norm(arr))
        mean = float(np.mean(arr))
        std = float(np.std(arr))
        centered = (arr - mean) if std >= 1e-6 else None
        item = (arr, norm, mean, std, centered)
        self._cache[image_path] = item
        return item

    def verify(self, path_a: str, path_b: str) -> VerificationResult:
        """
        Verify whether two images are true visual duplicates / near-duplicates.
        """
        try:
            flat_a, norm_a, mean_a, std_a, centered_a = self._get_vector(path_a)
            flat_b, norm_b, mean_b, std_b, centered_b = self._get_vector(path_b)
        except Exception as e:
            logger.warning(f"Failed to load pair ({path_a}, {path_b}): {e}")
            return VerificationResult(
                verified=False,
                pixel_cosine=0.0,
                ncc=0.0,
                details={"error": str(e)},
            )

        # 1. Pixel Cosine Similarity
        if norm_a == 0 or norm_b == 0:
            cos_sim = 1.0 if norm_a == norm_b else 0.0
        else:
            cos_sim = float(np.dot(flat_a, flat_b) / (norm_a * norm_b))

        # 2. Normalized Cross Correlation (NCC)
        if std_a < 1e-6 or std_b < 1e-6 or centered_a is None or centered_b is None:
            ncc = 1.0 if abs(mean_a - mean_b) < 1.0 else 0.0
        else:
            ncc = float(np.mean(centered_a * centered_b) / (std_a * std_b))

        cos_sim = float(np.clip(cos_sim, -1.0, 1.0))
        ncc = float(np.clip(ncc, -1.0, 1.0))

        is_verified = (cos_sim >= self.pixel_cosine_threshold) and (ncc >= self.ncc_threshold)

        return VerificationResult(
            verified=is_verified,
            pixel_cosine=round(cos_sim, 4),
            ncc=round(ncc, 4),
            details={
                "target_size": list(self.target_size),
                "pixel_cosine_threshold": self.pixel_cosine_threshold,
                "ncc_threshold": self.ncc_threshold,
            },
        )


def verify_pair(
    path_a: str,
    path_b: str,
    target_size: Tuple[int, int] = (128, 128),
    pixel_cosine_threshold: float = 0.95,
    ncc_threshold: float = 0.90,
) -> VerificationResult:
    """Convenience helper to verify an image pair."""
    verifier = PairVerifier(
        target_size=target_size,
        pixel_cosine_threshold=pixel_cosine_threshold,
        ncc_threshold=ncc_threshold,
    )
    return verifier.verify(path_a, path_b)
