import hashlib
import json
from typing import Literal

import cv2
import numpy as np
from PIL import Image
from pydantic import Field, model_validator

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.identity_geometry import ImageCorrespondence
from iad_core.duplicate.verification_models import Registration
from iad_core.evidence.images import EvidenceImages, normalized_preview


class IdentityInputPage(AnalysisModel):
    scope: Literal['overview', 'local']
    windows: list[int]


class IdentityInputPlan(AnalysisModel):
    geometry: Registration
    windows: list[tuple[tuple[int, int, int, int], tuple[int, int, int, int]]] = Field(min_length=1)
    pages: list[IdentityInputPage] | None = None

    @model_validator(mode='after')
    def validate_pages(self):
        if self.pages is not None and (sum(page.scope == 'overview' for page in self.pages) != 1
                or any(len(page.windows) != (1 if page.scope == 'local' else 0) for page in self.pages)
                or sorted(index for page in self.pages for index in page.windows) != list(range(len(self.windows)))):
            raise ValueError('冻结验证页必须完整且不重复地覆盖全部局部窗口')
        return self


class IdentityInputs:
    def __init__(self, db):
        self.db = db

    def freeze(self, run_id, anchor_id, candidate_id, sources, samples, prompts):
        fingerprint = hashlib.sha256(json.dumps([prompts, [source.model_dump(mode='json') for source in sources]],
            sort_keys=True).encode()).hexdigest()
        with self.db.connection() as connection:
            saved = connection.execute('''SELECT fingerprint,plan_json FROM consistency_identity_inputs
                WHERE job_id=? AND anchor_id=? AND candidate_id=?''', (run_id, anchor_id, candidate_id)).fetchone()
        if saved:
            if saved['fingerprint'] != fingerprint:
                raise ValueError('图像内容验证的冻结来源或提示词发生变化')
            return IdentityInputPlan.model_validate_json(saved['plan_json'])
        geometry = ImageCorrespondence.estimate(*(sample.image_path for sample in samples))
        images = EvidenceImages(self.db.db_path)
        sizes = [(sample.width, sample.height) for sample in samples]
        windows = [(tile, geometry.map_bounds(tile, *sizes)) for tile in
            images.tiles(samples[0], [0, 0, *sizes[0]], 0, max_side=768)]
        for side, source in enumerate(sources):
            for annotation in source.annotations.annotations:
                if not annotation.bbox or annotation.is_ignored:
                    continue
                for tile in images.tiles(samples[side], annotation.bbox, .2, max_side=768):
                    mapped = geometry.map_bounds(tile, sizes[side], sizes[1 - side], to_main=side == 1)
                    windows.append((tile, mapped) if side == 0 else (mapped, tile))
        residual = geometry.difference
        if residual is None and sizes[0] == sizes[1]:
            with Image.open(samples[0].image_path) as left, Image.open(samples[1].image_path) as right:
                residual = cv2.absdiff(np.asarray(normalized_preview(left).convert('L')),
                    np.asarray(normalized_preview(right).convert('L')))
        if residual is not None and np.any(residual):
            changed = (residual >= max(1., float(np.percentile(residual[residual > 0], 90)))).astype(np.uint8)
            _, _, regions, _ = cv2.connectedComponentsWithStats(changed)
            for x, y, width, height, _ in sorted(regions[1:], key=lambda region: int(region[4]), reverse=True)[:8]:
                for tile in images.tiles(samples[0], [int(x), int(y), int(x + width), int(y + height)], .2,
                        padding_pixels=16, max_side=768):
                    windows.append((tile, geometry.map_bounds(tile, *sizes)))
        windows = list(dict.fromkeys((tuple(main), tuple(candidate)) for main, candidate in windows
            if main[0] < main[2] and main[1] < main[3] and candidate[0] < candidate[2] and candidate[1] < candidate[3]))
        plan = IdentityInputPlan(geometry=geometry.facts, windows=windows)
        with self.db.connection() as connection:
            connection.execute('''INSERT INTO consistency_identity_inputs(job_id,anchor_id,candidate_id,fingerprint,plan_json)
                VALUES(?,?,?,?,?) ON CONFLICT(job_id,anchor_id,candidate_id) DO NOTHING''',
                (run_id, anchor_id, candidate_id, fingerprint, plan.model_dump_json()))
            saved = connection.execute('''SELECT plan_json FROM consistency_identity_inputs
                WHERE job_id=? AND anchor_id=? AND candidate_id=?''', (run_id, anchor_id, candidate_id)).fetchone()
        return IdentityInputPlan.model_validate_json(saved[0])
