import os
import sys
import logging
from typing import List, Union, Optional
import numpy as np
from PIL import Image
import torch
import torchvision.transforms as T

from app.features.base import FeatureExtractor

logger = logging.getLogger("iad_benchmark.features.dino")

DEFAULT_WEIGHTS_PATH = "/data1/lzw/anomaly-detection/Dinomaly2/backbones/weights/dinov2_vitb14_reg4_pretrain.pth"
DINOMALY_REPO_PATH = "/data1/lzw/anomaly-detection/Dinomaly2"


class DINOFeatureExtractor(FeatureExtractor):
    """
    DINOv2 Feature Extractor for image-level embeddings.
    """

    def __init__(
        self,
        model_id: str = "dinov2_vitb14_reg",
        preprocess_key: str = "dinov2_224_norm",
        weights_path: Optional[str] = None,
        device: str = "cuda:0" if torch.cuda.is_available() else "cpu",
        dtype: str = "fp16",
        img_size: int = 224,
    ):
        self.model_id = model_id
        self.preprocess_key = preprocess_key
        self.dim = 768
        self.device = torch.device(device)
        self.dtype_str = dtype
        self.img_size = img_size
        self.weights_path = weights_path or DEFAULT_WEIGHTS_PATH

        self.torch_dtype = (
            torch.float16 if (dtype == "fp16" and "cuda" in str(self.device)) else torch.float32
        )

        # Standard DINOv2 preprocessing transform
        self.transform = T.Compose(
            [
                T.Resize((self.img_size, self.img_size), interpolation=T.InterpolationMode.BICUBIC),
                T.ToTensor(),
                T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ]
        )

        self._model = None

    def _ensure_model_loaded(self):
        if self._model is not None:
            return

        if DINOMALY_REPO_PATH not in sys.path and os.path.exists(DINOMALY_REPO_PATH):
            sys.path.insert(0, DINOMALY_REPO_PATH)

        try:
            from dinov2.hub.backbones import dinov2_vitb14_reg
            model = dinov2_vitb14_reg(pretrained=False)
            if self.weights_path and os.path.exists(self.weights_path):
                logger.info(f"Loading DINOv2 weights from {self.weights_path}")
                state_dict = torch.load(self.weights_path, map_location="cpu")
                model.load_state_dict(state_dict, strict=True)
            else:
                logger.warning(
                    f"Weights path {self.weights_path} not found. Initialized with uncalibrated weights."
                )
        except Exception as e:
            logger.error(f"Failed to import/load dinov2 from {DINOMALY_REPO_PATH}: {e}")
            raise RuntimeError(f"Could not initialize DINOFeatureExtractor: {e}")

        model = model.to(device=self.device, dtype=self.torch_dtype)
        model.eval()
        self._model = model

    def encode_batch(
        self, images: List[Union[Image.Image, np.ndarray, str]]
    ) -> np.ndarray:
        if not images:
            return np.empty((0, self.dim), dtype=np.float16 if self.dtype_str == "fp16" else np.float32)

        self._ensure_model_loaded()

        tensor_list = []
        for img in images:
            if isinstance(img, str):
                pil_img = Image.open(img).convert("RGB")
            elif isinstance(img, np.ndarray):
                pil_img = Image.fromarray(img).convert("RGB")
            elif isinstance(img, Image.Image):
                pil_img = img.convert("RGB")
            else:
                raise TypeError(f"Unsupported image type: {type(img)}")

            tensor_list.append(self.transform(pil_img))

        batch_tensor = torch.stack(tensor_list, dim=0).to(
            device=self.device, dtype=self.torch_dtype
        )

        with torch.no_grad():
            features = self._model(batch_tensor)
            # Ensure float32 for normalization stability
            features = torch.nn.functional.normalize(features.float(), p=2, dim=-1)

        out_np = features.cpu().numpy()

        target_dtype = np.float16 if self.dtype_str == "fp16" else np.float32
        out_np = out_np.astype(target_dtype)

        # Check NaN / Inf
        if np.isnan(out_np).any() or np.isinf(out_np).any():
            raise ValueError("Feature extractor produced NaN or Inf values in embeddings")

        return out_np


class MockFeatureExtractor(FeatureExtractor):
    """
    Lightweight, deterministic feature extractor for fast tests and CPU verification.
    """

    def __init__(
        self,
        model_id: str = "mock_vit_768",
        preprocess_key: str = "mock_224",
        dim: int = 768,
        dtype: str = "fp16",
    ):
        self.model_id = model_id
        self.preprocess_key = preprocess_key
        self.dim = dim
        self.dtype_str = dtype

    def encode_batch(
        self, images: List[Union[Image.Image, np.ndarray, str]]
    ) -> np.ndarray:
        if not images:
            return np.empty((0, self.dim), dtype=np.float16 if self.dtype_str == "fp16" else np.float32)

        vectors = []
        for img in images:
            if isinstance(img, str):
                pil_img = Image.open(img).convert("RGB")
            elif isinstance(img, np.ndarray):
                pil_img = Image.fromarray(img).convert("RGB")
            else:
                pil_img = img.convert("RGB")

            # Deterministic pseudo-embedding based on resized pixels and image stats
            resized = pil_img.resize((16, 16))
            arr = np.asarray(resized, dtype=np.float32) / 255.0  # (16, 16, 3) = 768 floats
            vec = arr.flatten()
            if len(vec) < self.dim:
                vec = np.pad(vec, (0, self.dim - len(vec)))
            else:
                vec = vec[: self.dim]

            # Add a deterministic high-frequency component so distinct images differ
            seed = int(np.sum(vec[:10]) * 1000) % (2**31 - 1)
            rng = np.random.RandomState(seed)
            noise = rng.normal(0, 0.05, size=self.dim)
            vec = vec + noise
            vectors.append(vec)

        arr = np.stack(vectors, axis=0)
        norm = np.linalg.norm(arr, axis=-1, keepdims=True)
        arr = arr / np.maximum(norm, 1e-12)

        target_dtype = np.float16 if self.dtype_str == "fp16" else np.float32
        return arr.astype(target_dtype)
