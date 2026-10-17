import logging
from typing import List, Dict, Optional, Any
import numpy as np
from sklearn.metrics import roc_auc_score, average_precision_score, roc_curve

from iad_core.evaluation.contracts import (
    PredictionRecord,
    ImageMetrics,
    PixelMetrics,
    HardNormalMetrics,
    DomainMetrics,
)

logger = logging.getLogger("iad_core.evaluation.metrics")


def compute_image_metrics(
    scores: np.ndarray,
    binary_labels: np.ndarray,  # 0: Normal / Hard Normal, 1: Anomaly
    threshold: float,
) -> ImageMetrics:
    """
    Compute binary classification & ranking metrics at the image level.
    """
    n_samples = len(scores)
    if n_samples == 0:
        return ImageMetrics(
            threshold=threshold,
            accuracy=0.0,
            precision=0.0,
            recall=0.0,
            f1=0.0,
            true_positive=0,
            false_positive=0,
            true_negative=0,
            false_negative=0,
        )

    # I-AUROC and I-AP
    n_pos = int(np.sum(binary_labels == 1))
    n_neg = int(np.sum(binary_labels == 0))

    i_auroc = None
    i_ap = None
    recall_at_fpr_01 = None
    recall_at_fpr_05 = None

    if n_pos > 0 and n_neg > 0:
        try:
            i_auroc = float(roc_auc_score(binary_labels, scores))
        except Exception as e:
            logger.warning(f"Failed to compute I-AUROC: {e}")

        try:
            i_ap = float(average_precision_score(binary_labels, scores))
        except Exception as e:
            logger.warning(f"Failed to compute I-AP: {e}")

        # Recall at FPR = 1% and 5%
        fpr, tpr, _ = roc_curve(binary_labels, scores)
        # Recall @ FPR <= 0.01
        idx_01 = np.where(fpr <= 0.01)[0]
        if len(idx_01) > 0:
            recall_at_fpr_01 = float(tpr[idx_01[-1]])
        else:
            recall_at_fpr_01 = 0.0

        idx_05 = np.where(fpr <= 0.05)[0]
        if len(idx_05) > 0:
            recall_at_fpr_05 = float(tpr[idx_05[-1]])
        else:
            recall_at_fpr_05 = 0.0

    preds = (scores >= threshold).astype(int)
    tp = int(np.sum((preds == 1) & (binary_labels == 1)))
    fp = int(np.sum((preds == 1) & (binary_labels == 0)))
    tn = int(np.sum((preds == 0) & (binary_labels == 0)))
    fn = int(np.sum((preds == 0) & (binary_labels == 1)))

    acc = float((tp + tn) / n_samples) if n_samples > 0 else 0.0
    prec = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    rec = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    f1 = float(2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

    return ImageMetrics(
        i_auroc=i_auroc,
        i_ap=i_ap,
        recall_at_fpr_01=recall_at_fpr_01,
        recall_at_fpr_05=recall_at_fpr_05,
        threshold=threshold,
        accuracy=acc,
        precision=prec,
        recall=rec,
        f1=f1,
        true_positive=tp,
        false_positive=fp,
        true_negative=tn,
        false_negative=fn,
    )


def compute_hard_normal_metrics(
    normal_scores: np.ndarray,
    hard_normal_scores: np.ndarray,
    threshold: float,
) -> HardNormalMetrics:
    """
    Compute Hard Normal FPR and distribution statistics (R611).
    """
    n_hn = len(hard_normal_scores)
    n_norm = len(normal_scores)

    if n_hn == 0:
        norm_mean = float(np.mean(normal_scores)) if n_norm > 0 else 0.0
        norm_med = float(np.median(normal_scores)) if n_norm > 0 else 0.0
        return HardNormalMetrics(
            hard_normal_count=0,
            hard_normal_fpr=0.0,
            hard_normal_score_mean=0.0,
            hard_normal_score_median=0.0,
            normal_score_mean=norm_mean,
            normal_score_median=norm_med,
            separation_margin=0.0,
        )

    hn_mean = float(np.mean(hard_normal_scores))
    hn_med = float(np.median(hard_normal_scores))
    norm_mean = float(np.mean(normal_scores)) if n_norm > 0 else 0.0
    norm_med = float(np.median(normal_scores)) if n_norm > 0 else 0.0

    hn_fp = int(np.sum(hard_normal_scores >= threshold))
    hn_fpr = float(hn_fp / n_hn)
    separation_margin = float(hn_med - norm_med)

    return HardNormalMetrics(
        hard_normal_count=n_hn,
        hard_normal_fpr=hn_fpr,
        hard_normal_score_mean=hn_mean,
        hard_normal_score_median=hn_med,
        normal_score_mean=norm_mean,
        normal_score_median=norm_med,
        separation_margin=separation_margin,
    )


def compute_domain_metrics(
    test_predictions: List[PredictionRecord],
    gold_labels: Dict[str, str],
    sample_domains: Dict[str, str],
    threshold: float,
) -> DomainMetrics:
    """
    Stratify test metrics by domain (batch, shift, production_date) (R611).
    """
    domain_groups: Dict[str, List[Tuple[float, int]]] = {}

    for p in test_predictions:
        sid = p.sample_id
        if sid not in gold_labels:
            continue
        domain = sample_domains.get(sid, "UNKNOWN")
        is_anomaly = 1 if gold_labels[sid] == "ANOMALY" else 0
        if domain not in domain_groups:
            domain_groups[domain] = []
        domain_groups[domain].append((p.image_score, is_anomaly))

    res: Dict[str, Dict[str, Any]] = {}
    for dom, pairs in domain_groups.items():
        dom_scores = np.array([p[0] for p in pairs], dtype=np.float32)
        dom_labels = np.array([p[1] for p in pairs], dtype=np.int32)
        dom_im = compute_image_metrics(dom_scores, dom_labels, threshold)
        res[dom] = {
            "sample_count": len(pairs),
            "anomaly_count": int(np.sum(dom_labels == 1)),
            "normal_count": int(np.sum(dom_labels == 0)),
            "accuracy": dom_im.accuracy,
            "precision": dom_im.precision,
            "recall": dom_im.recall,
            "f1": dom_im.f1,
            "i_auroc": dom_im.i_auroc,
            "false_positive": dom_im.false_positive,
            "false_negative": dom_im.false_negative,
        }

    return DomainMetrics(metrics_by_domain=res)


def compute_pixel_metrics(
    predictions: List[PredictionRecord],
    ground_truth_masks: Optional[Dict[str, np.ndarray]] = None,
) -> PixelMetrics:
    """
    Compute pixel-level metrics (P-AUROC, P-AP, P-AUPRO) (R610).
    Returns NOT_EVALUATED if masks are not available or not evaluated.
    """
    if not ground_truth_masks:
        return PixelMetrics(status="NOT_EVALUATED")

    # If masks are present and prediction maps are loadable, compute pixel metrics
    # In industrial v1 with bounding boxes / non-mask tasks, default to NOT_EVALUATED
    return PixelMetrics(status="NOT_EVALUATED")
