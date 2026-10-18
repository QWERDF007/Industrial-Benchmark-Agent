from enum import Enum
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field


class EvaluationInvariantError(RuntimeError):
    """Raised when an evaluation invariant (e.g. missing CONFIRMED gold) is violated."""
    pass


class PredictionRecord(BaseModel):
    """
    Standard Prediction Contract (R602).
    Every prediction must have a unique sample_id per run, a finite score,
    and split membership.
    """
    sample_id: str
    image_score: float = Field(..., description="Anomaly score for the image (higher = more anomalous)")
    pixel_score_path: Optional[str] = Field(None, description="Path to pixel anomaly map (.npy/.png) if available")
    latency_ms: Optional[float] = Field(None, description="Inference latency in milliseconds")
    split_name: str = Field("test", description="'train', 'val', or 'test'")


class ThresholdStrategy(str, Enum):
    F1_MAX = "f1_max"
    RECALL_AT_FPR = "recall_at_fpr"
    PERCENTILE = "percentile"
    MANUAL = "manual"


class ThresholdResult(BaseModel):
    threshold: float
    strategy: ThresholdStrategy
    fit_split: str = "val"
    fit_samples_count: int
    best_f1: Optional[float] = None
    fpr_at_threshold: Optional[float] = None


class ImageMetrics(BaseModel):
    i_auroc: Optional[float] = None
    i_ap: Optional[float] = None
    recall_at_fpr_01: Optional[float] = None
    recall_at_fpr_05: Optional[float] = None
    threshold: float
    accuracy: float
    precision: float
    recall: float
    f1: float
    true_positive: int
    false_positive: int
    true_negative: int
    false_negative: int


class PixelMetrics(BaseModel):
    p_auroc: Optional[float] = None
    p_ap: Optional[float] = None
    p_aupro: Optional[float] = None
    status: str = "NOT_EVALUATED"


class HardNormalMetrics(BaseModel):
    hard_normal_count: int
    hard_normal_fpr: float = Field(..., description="False positive rate on hard normal samples at selected threshold")
    hard_normal_score_mean: float
    hard_normal_score_median: float
    normal_score_mean: float
    normal_score_median: float
    separation_margin: float


class DomainMetrics(BaseModel):
    metrics_by_domain: Dict[str, Dict[str, Any]] = Field(default_factory=dict)


class EvaluationRun(BaseModel):
    model_config = {"protected_namespaces": ()}
    run_id: str
    task_id: str
    build_id: str
    model_id: str
    status: str = "COMPLETED"
    threshold: ThresholdResult
    image_metrics: ImageMetrics
    pixel_metrics: PixelMetrics
    hard_normal_metrics: HardNormalMetrics
    domain_metrics: DomainMetrics
    val_class_counts: Dict[str, int] = Field(default_factory=dict)
    test_class_counts: Dict[str, int] = Field(default_factory=dict)
    implementation_name: Optional[str] = None
    implementation_source: Optional[str] = None
    implementation_revision: Optional[str] = None
    protocol: Optional[str] = None
    training_origin: Optional[str] = None
    train_selection_path: Optional[str] = None
    runtime_config: Dict[str, Any] = Field(default_factory=dict)
    predictions_path: str
    metrics_json_path: str
    report_md_path: str
    error_analysis_md_path: str
    elapsed_seconds: float


class EvaluationPlan(BaseModel):
    model_config = {"protected_namespaces": ()}
    task_id: str
    build_id: str
    model_ids: List[str]
    threshold_strategy: ThresholdStrategy = ThresholdStrategy.F1_MAX
    target_fpr: float = 0.01
    output_dir: Optional[str] = None

