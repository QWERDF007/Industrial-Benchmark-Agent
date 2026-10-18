from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field, asdict

from iad_core.storage.models import Sample
from iad_core.gold.schemas import GoldRecord
from iad_core.evaluation.contracts import EvaluationInvariantError


@dataclass
class TrainSelectionResult:
    """
    Result of Gold-aware training sample selection (NV-05, NS-05).
    Guarantees strict separation of normal and anomaly training samples.
    """
    train_normal: List[Sample]
    train_anomaly: List[Sample]
    train_total_count: int
    normal_count: int
    hard_normal_count: int
    anomaly_count: int
    normal_sample_ids: List[str]
    hard_normal_sample_ids: List[str]
    anomaly_sample_ids: List[str]
    include_hard_normal_in_train: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "train_total_count": self.train_total_count,
            "train_normal_count": self.normal_count,
            "train_hard_normal_count": self.hard_normal_count,
            "train_anomaly_count": self.anomaly_count,
            "include_hard_normal_in_train": self.include_hard_normal_in_train,
            "normal_sample_ids": list(self.normal_sample_ids),
            "hard_normal_sample_ids": list(self.hard_normal_sample_ids),
            "anomaly_sample_ids": list(self.anomaly_sample_ids),
        }


def select_training_samples(
    train_samples: List[Sample],
    gold_map: Dict[str, GoldRecord],
    include_hard_normal_in_train: bool = True,
) -> TrainSelectionResult:
    """
    Strictly partitions training samples by CONFIRMED Gold binary_label.
    Unsupervised baselines (PatchCore, Feature KNN) MUST ONLY consume train_normal.

    Raises:
        EvaluationInvariantError: If any sample lacks CONFIRMED Gold or if train_normal is empty.
    """
    train_normal_list: List[Sample] = []
    train_anomaly_list: List[Sample] = []
    normal_ids: List[str] = []
    hn_ids: List[str] = []
    anomaly_ids: List[str] = []

    for s in train_samples:
        g = gold_map.get(s.sample_id)
        if not g or g.gold_status != "CONFIRMED":
            raise EvaluationInvariantError(
                f"Sample '{s.sample_id}' in Train split lacks CONFIRMED Gold record! "
                f"Gold status: {getattr(g, 'gold_status', None)}"
            )

        if g.binary_label == "ANOMALY":
            train_anomaly_list.append(s)
            anomaly_ids.append(s.sample_id)
        elif g.binary_label == "NORMAL":
            is_hn = bool(g.hard_normal)
            if is_hn:
                hn_ids.append(s.sample_id)
                if include_hard_normal_in_train:
                    train_normal_list.append(s)
                    normal_ids.append(s.sample_id)
            else:
                train_normal_list.append(s)
                normal_ids.append(s.sample_id)
        else:
            raise EvaluationInvariantError(
                f"Sample '{s.sample_id}' has invalid binary_label: '{g.binary_label}'"
            )

    if not train_normal_list:
        raise EvaluationInvariantError(
            "No normal training samples found. Unsupervised AD requires at least one normal training sample."
        )

    return TrainSelectionResult(
        train_normal=train_normal_list,
        train_anomaly=train_anomaly_list,
        train_total_count=len(train_samples),
        normal_count=len(normal_ids),
        hard_normal_count=len(hn_ids),
        anomaly_count=len(anomaly_ids),
        normal_sample_ids=normal_ids,
        hard_normal_sample_ids=hn_ids,
        anomaly_sample_ids=anomaly_ids,
        include_hard_normal_in_train=include_hard_normal_in_train,
    )
