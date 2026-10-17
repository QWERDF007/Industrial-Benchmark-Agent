import json
import logging
from typing import List, Dict, Tuple
from collections import defaultdict
import numpy as np

from app.storage.database import Database

logger = logging.getLogger("iad_benchmark.candidates.annotation_signal")


def compute_annotation_signals(
    sample_ids: List[str],
    db: Database,
) -> np.ndarray:
    """
    Extract lightweight annotation signals from database annotations.
    Signal combines annotation presence, bbox count, and bbox area ratio.
    CRITICAL: Annotation signal is purely a ranking priority feature;
    it does NOT equal defect/FAIL.
    """
    n_samples = len(sample_ids)
    if n_samples == 0:
        return np.empty((0,), dtype=np.float32)

    # Fetch sample resolutions
    sample_res_map: Dict[str, Tuple[int, int]] = {}
    with db.connection() as conn:
        cursor = conn.cursor()
        batch_size = 1000
        for b_start in range(0, n_samples, batch_size):
            b_ids = sample_ids[b_start : b_start + batch_size]
            placeholders = ",".join("?" for _ in b_ids)
            cursor.execute(
                f"SELECT sample_id, width, height FROM samples WHERE sample_id IN ({placeholders})",
                b_ids,
            )
            for row in cursor.fetchall():
                sample_res_map[row[0]] = (row[1], row[2])

        # Fetch annotations
        ann_stats: Dict[str, List[float]] = defaultdict(list)
        for b_start in range(0, n_samples, batch_size):
            b_ids = sample_ids[b_start : b_start + batch_size]
            placeholders = ",".join("?" for _ in b_ids)
            cursor.execute(
                f"""
                SELECT sample_id, bbox_json 
                FROM annotations 
                WHERE sample_id IN ({placeholders})
                  AND geometry_status IN ('VALID', 'CLIPPED', 'SCALED')
                """,
                b_ids,
            )
            for s_id, bbox_json in cursor.fetchall():
                area = 0.0
                if bbox_json:
                    try:
                        bbox = json.loads(bbox_json)
                        # bbox: [xmin, ymin, xmax, ymax]
                        if len(bbox) >= 4:
                            w = max(0.0, float(bbox[2]) - float(bbox[0]))
                            h = max(0.0, float(bbox[3]) - float(bbox[1]))
                            area = w * h
                    except Exception:
                        area = 0.0
                ann_stats[s_id].append(area)

    scores = np.empty((n_samples,), dtype=np.float32)
    for idx, s_id in enumerate(sample_ids):
        areas = ann_stats.get(s_id, [])
        count = len(areas)
        if count == 0:
            scores[idx] = 0.0
            continue

        w, h = sample_res_map.get(s_id, (1000, 1000))
        img_area = max(1.0, float(w * h))
        total_bbox_area = sum(areas)
        area_ratio = min(1.0, total_bbox_area / img_area)

        # Has annotation (0.4), count factor (0.3), area factor (0.3)
        c_score = min(1.0, count / 5.0)
        a_score = min(1.0, area_ratio * 10.0)
        scores[idx] = float(0.4 + 0.3 * c_score + 0.3 * a_score)

    return np.clip(scores, 0.0, 1.0).astype(np.float32)
