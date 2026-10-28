from abc import ABC, abstractmethod
from typing import List, Union, Literal
import numpy as np
from PIL import Image

EmbeddingPrecision = Literal['float32', 'float16']


class FeatureExtractor(ABC):
    """Abstract base class for vision feature extractors."""

    model_id: str
    profile_id: str
    dim: int

    @abstractmethod
    def encode_batch(
        self, images: List[Union[Image.Image, np.ndarray, str]]
    ) -> np.ndarray:
        """
        Encode a batch of images into L2-normalized feature vectors.

        Args:
            images: List of PIL Images, RGB numpy arrays (H, W, 3), or file paths.

        Returns:
            np.ndarray of shape [N, dim], float32 or float16, L2 normalized along axis=-1.
        """
        pass

    @staticmethod
    def normalize_embeddings(embeddings: np.ndarray, eps: float = 1e-12) -> np.ndarray:
        """L2 normalize embeddings along axis -1."""
        norm = np.linalg.norm(embeddings, axis=-1, keepdims=True)
        return embeddings / np.maximum(norm, eps)
