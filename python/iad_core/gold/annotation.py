from typing import List
from iad_core.storage.models import Annotation, GeometryStatus
from iad_core.gold.schemas import GoldAnnotation


def filter_and_convert_gold_annotations(
    annotations: List[Annotation],
) -> List[GoldAnnotation]:
    """
    Export only valid geometries (VALID, CLIPPED, SCALED).
    Excludes INVALID geometries from gold benchmark localization annotations.
    """
    valid_statuses = {GeometryStatus.VALID, GeometryStatus.CLIPPED, GeometryStatus.SCALED}
    gold_annos = []
    for a in annotations:
        status_val = a.geometry_status
        if status_val in valid_statuses or str(status_val) in ("VALID", "CLIPPED", "SCALED"):
            gold_annos.append(
                GoldAnnotation(
                    annotation_id=a.annotation_id,
                    raw_label=a.raw_label,
                    phenomenon=a.phenomenon,
                    bbox=a.bbox,
                    polygon=a.polygon,
                    mask_path=a.mask_path,
                    geometry_status=status_val.value if hasattr(status_val, "value") else str(status_val),
                    source=a.source.value if hasattr(a.source, "value") else str(a.source),
                )
            )
    return gold_annos
