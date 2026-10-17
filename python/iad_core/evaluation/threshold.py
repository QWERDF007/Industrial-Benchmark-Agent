import logging
from typing import List, Dict, Optional, Tuple
import numpy as np
from sklearn.metrics import precision_recall_curve, roc_curve

from iad_core.evaluation.contracts import PredictionRecord, ThresholdStrategy, ThresholdResult

logger = logging.getLogger("iad_core.evaluation.threshold")


class ThresholdSelector:
    """
    Val-only Threshold Selector (R608).
    STRICT SECURITY REQUIREMENT:
    Threshold selection algorithms can ONLY consume Validation split predictions!
    Test split prediction scores are strictly prohibited and hidden from this class.
    """

    @staticmethod
    def select_threshold(
        val_predictions: List[PredictionRecord],
        val_labels: Dict[str, int],  # sample_id -> 0 (Normal) or 1 (Anomaly)
        strategy: ThresholdStrategy = ThresholdStrategy.F1_MAX,
        target_fpr: float = 0.01,
        manual_threshold: Optional[float] = None,
    ) -> ThresholdResult:
        """
        Fit decision threshold on Validation set only.
        """
        # Validate input split
        for p in val_predictions:
            if p.split_name == "test":
                raise ValueError("SECURITY VIOLATION: Test split predictions passed to ThresholdSelector!")

        valid_pairs = []
        for p in val_predictions:
            if p.sample_id in val_labels:
                score = p.image_score
                if np.isnan(score) or np.isinf(score):
                    raise ValueError(f"Non-finite prediction score for sample {p.sample_id}: {score}")
                valid_pairs.append((score, val_labels[p.sample_id]))

        if not valid_pairs:
            raise ValueError("No valid validation prediction/label pairs available for threshold selection.")

        scores = np.array([item[0] for item in valid_pairs], dtype=np.float32)
        y_true = np.array([item[1] for item in valid_pairs], dtype=np.int32)
        n_samples = len(scores)

        if strategy == ThresholdStrategy.MANUAL:
            if manual_threshold is None:
                raise ValueError("manual_threshold must be provided when strategy is MANUAL.")
            th = manual_threshold
            best_f1 = None
            fpr_at_th = float(np.mean((scores >= th) & (y_true == 0))) if np.any(y_true == 0) else 0.0

        elif strategy == ThresholdStrategy.F1_MAX:
            if np.all(y_true == 0) or np.all(y_true == 1):
                # Only single class in Val set, use median or 95th percentile
                th = float(np.percentile(scores, 95))
                best_f1 = 0.0
                fpr_at_th = float(np.mean(scores >= th))
            else:
                # Calculate precision, recall, thresholds
                precisions, recalls, thresholds = precision_recall_curve(y_true, scores)
                # Compute F1 scores
                f1_scores = np.zeros_like(thresholds)
                for i in range(len(thresholds)):
                    p_val = precisions[i]
                    r_val = recalls[i]
                    if p_val + r_val > 0:
                        f1_scores[i] = 2 * p_val * r_val / (p_val + r_val)
                    else:
                        f1_scores[i] = 0.0

                best_idx = int(np.argmax(f1_scores))
                th = float(thresholds[best_idx])
                best_f1 = float(f1_scores[best_idx])
                y_pred = (scores >= th).astype(int)
                fp = np.sum((y_pred == 1) & (y_true == 0))
                tn = np.sum((y_pred == 0) & (y_true == 0))
                fpr_at_th = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

        elif strategy == ThresholdStrategy.RECALL_AT_FPR:
            if not np.any(y_true == 0):
                th = float(np.min(scores))
                fpr_at_th = 0.0
                best_f1 = 1.0
            else:
                fpr, tpr, thresholds = roc_curve(y_true, scores)
                # Find max threshold where FPR <= target_fpr
                valid_indices = np.where(fpr <= target_fpr)[0]
                if len(valid_indices) > 0:
                    best_idx = valid_indices[-1]
                    th = float(thresholds[best_idx])
                    fpr_at_th = float(fpr[best_idx])
                else:
                    th = float(np.max(scores))
                    fpr_at_th = 0.0

                y_pred = (scores >= th).astype(int)
                tp = np.sum((y_pred == 1) & (y_true == 1))
                fp = np.sum((y_pred == 1) & (y_true == 0))
                fn = np.sum((y_pred == 0) & (y_true == 1))
                prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
                rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
                best_f1 = float(2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

        elif strategy == ThresholdStrategy.PERCENTILE:
            normal_scores = scores[y_true == 0]
            if len(normal_scores) > 0:
                th = float(np.percentile(normal_scores, 99.0))
            else:
                th = float(np.percentile(scores, 95.0))
            fpr_at_th = float(np.mean((scores >= th) & (y_true == 0))) if len(normal_scores) > 0 else 0.0
            best_f1 = None
        else:
            raise ValueError(f"Unknown threshold strategy: {strategy}")

        logger.info(
            f"Selected threshold={th:.4f} via '{strategy.value}' on {n_samples} Val samples (fit_f1={best_f1}, fit_fpr={fpr_at_th})"
        )

        return ThresholdResult(
            threshold=round(th, 6),
            strategy=strategy,
            fit_split="val",
            fit_samples_count=n_samples,
            best_f1=round(best_f1, 4) if best_f1 is not None else None,
            fpr_at_threshold=round(fpr_at_th, 4) if fpr_at_th is not None else None,
        )
