from dataclasses import dataclass

import cv2
import numpy as np
from PIL import Image
from iad_core.duplicate.verification_models import Registration
from iad_core.evidence.images import normalized_preview


@dataclass(frozen=True)
class ImageCorrespondence:
    matrix: np.ndarray | None
    facts: Registration

    @classmethod
    def estimate(cls, main_path: str, candidate_path: str) -> 'ImageCorrespondence':
        arrays, scales = [], []
        for path in (main_path, candidate_path):
            with Image.open(path) as image:
                image = normalized_preview(image).convert('L')
                original = image.size
                image.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
                arrays.append(np.asarray(image))
                scales.append(np.diag([original[0] / image.width, original[1] / image.height, 1.]))
        detector = cv2.SIFT_create(nfeatures=4000)
        keypoints, descriptors = zip(*(detector.detectAndCompute(image, None) for image in arrays))
        if any(value is None for value in descriptors):
            return cls(None, Registration(**{'status': 'unregistered', 'reason': '可定位的局部特征不足，不能证明几何对应。'}))
        matches = cv2.BFMatcher().knnMatch(descriptors[1], descriptors[0], k=2)
        good = [pair[0] for pair in matches if len(pair) == 2 and pair[0].distance < .75 * pair[1].distance]
        if len(good) < 8:
            return cls(None, Registration(**{'status': 'unregistered', 'reason': '可信局部匹配不足。', 'matches': len(good)}))
        candidate = np.float64([keypoints[1][match.queryIdx].pt for match in good])
        main = np.float64([keypoints[0][match.trainIdx].pt for match in good])
        matrix, inliers = cv2.findHomography(candidate, main, cv2.RANSAC, 3.)
        if matrix is None or inliers is None or int(inliers.sum()) < 8:
            return cls(None, Registration(**{'status': 'unregistered', 'reason': '未获得足够一致的几何对应。', 'matches': len(good)}))
        matrix = scales[0] @ matrix @ np.linalg.inv(scales[1])
        matrix /= matrix[2, 2]
        if not np.isfinite(matrix).all() or abs(np.linalg.det(matrix)) < 1e-9:
            return cls(None, Registration(**{'status': 'unregistered', 'reason': '几何映射不可逆。'}))
        with Image.open(main_path) as image:
            a = np.asarray(normalized_preview(image).convert('L'))
        with Image.open(candidate_path) as image:
            b = np.asarray(normalized_preview(image).convert('L'))
        aligned = cv2.warpPerspective(b, matrix, (a.shape[1], a.shape[0]))
        valid = cv2.warpPerspective(np.ones(b.shape, np.uint8), matrix, (a.shape[1], a.shape[0]), flags=cv2.INTER_NEAREST)
        residual = cv2.absdiff(a, aligned)
        residual[valid == 0] = 0
        points = candidate * np.diag(scales[1])[:2]
        projected = cv2.perspectiveTransform(points.reshape(1,-1,2),matrix)[0]
        errors = np.linalg.norm(projected-main*np.diag(scales[0])[:2],axis=1)[inliers.ravel().astype(bool)]
        return cls(matrix, Registration(**{'status': 'registered', 'candidate_to_main': matrix.tolist(),
            'matches': len(good), 'inliers': int(inliers.sum()), 'main_visible_fraction': float(np.mean(valid != 0)),
            'mean_absolute_residual': float(residual[valid != 0].mean()) if valid.any() else None,
            'reprojection_error_px': float(np.quantile(errors,.95)),
            'reason': '配准与残差仅是视觉线索，不证明真实缺陷相同。'}))

    def map_bounds(self, box, source_size, target_size, *, to_main=False):
        if self.matrix is None:
            raise ValueError('没有可信几何映射，不能生成对侧局部')
        else:
            points = self.project(box, to_main=to_main)
        low, high = np.floor(points.min(axis=0)).astype(int), np.ceil(points.max(axis=0)).astype(int)
        low = np.maximum(low, 0)
        high = np.minimum(high, target_size)
        return [int(low[0]), int(low[1]), int(high[0]), int(high[1])]

    def project(self, box, *, to_main=True):
        if self.matrix is None:
            raise ValueError('没有可信几何映射，不能映射标注坐标')
        x1, y1, x2, y2 = box
        matrix = self.matrix if to_main else np.linalg.inv(self.matrix)
        points = cv2.perspectiveTransform(np.float64([[[x1, y1], [x2, y1], [x2, y2], [x1, y2]]]), matrix)[0]
        if not np.isfinite(points).all():
            raise ValueError('几何映射在当前对象区域不可用')
        return points
