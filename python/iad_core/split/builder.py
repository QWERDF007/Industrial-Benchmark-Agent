import random
from typing import List, Dict, Optional, Tuple
from pydantic import BaseModel, Field

from iad_core.storage.models import Sample
from iad_core.task.config import SplitPolicyConfig
from iad_core.split.group import SplitGroup


class SplitResult(BaseModel):
    assignments: Dict[str, str]
    train_ids: List[str]
    val_ids: List[str]
    test_ids: List[str]
    group_assignments: Dict[str, str]
    total_samples: int
    train_count: int
    val_count: int
    test_count: int


def build_group_split(
    samples: List[Sample],
    groups: List[SplitGroup],
    sample_to_group: Dict[str, str],
    policy: Optional[SplitPolicyConfig] = None,
) -> SplitResult:
    """
    Deterministic Stratified Group Split.
    Assigns atomic groups to train / val / test.
    Priorities:
    1. Group atomicity: 0 cross-split leakage.
    2. Policy constraints: AUGMENTED origin samples strictly excluded from test.
    3. Stratification: Balanced representation of normal and anomaly groups across splits.
    4. Proximity to target ratios (train/val/test).
    5. Pure determinism via seed.
    """
    if policy is None:
        policy = SplitPolicyConfig()

    rng = random.Random(policy.seed)
    sorted_groups = sorted(groups, key=lambda g: g.group_id)

    aug_groups = [g for g in sorted_groups if g.has_augmented]
    non_aug_groups = [g for g in sorted_groups if not g.has_augmented]
    anomaly_groups = [g for g in non_aug_groups if g.has_anomaly]
    hard_normal_groups = [g for g in non_aug_groups if not g.has_anomaly and g.has_hard_normal]
    normal_groups = [g for g in non_aug_groups if not g.has_anomaly and not g.has_hard_normal and g.has_normal]
    other_groups = [g for g in non_aug_groups if not g.has_anomaly and not g.has_hard_normal and not g.has_normal]

    rng.shuffle(aug_groups)
    rng.shuffle(anomaly_groups)
    rng.shuffle(hard_normal_groups)
    rng.shuffle(normal_groups)
    rng.shuffle(other_groups)

    ratios = policy.ratios
    total_samples = len(samples)
    target_counts = {
        "train": total_samples * ratios.train,
        "val": total_samples * ratios.val,
        "test": total_samples * ratios.test,
    }

    current_counts = {"train": 0, "val": 0, "test": 0}
    group_assignments: Dict[str, str] = {}

    def assign_group(grp: SplitGroup, split_name: str):
        group_assignments[grp.group_id] = split_name
        current_counts[split_name] += len(grp.sample_ids)

    train_val_ratio = ratios.train / (ratios.train + ratios.val) if (ratios.train + ratios.val) > 0 else 0.75
    for grp in aug_groups:
        total_curr_tv = current_counts["train"] + current_counts["val"]
        if total_curr_tv == 0:
            assign_group(grp, "train")
        else:
            curr_train_share = current_counts["train"] / total_curr_tv
            if curr_train_share < train_val_ratio:
                assign_group(grp, "train")
            else:
                assign_group(grp, "val")

    def distribute_bucket(bucket: List[SplitGroup]):
        if not bucket:
            return

        remaining = list(bucket)
        if len(remaining) >= 3:
            assign_group(remaining.pop(), "test")
            assign_group(remaining.pop(), "val")
            assign_group(remaining.pop(), "train")

        for grp in remaining:
            splits = ["train", "val", "test"]
            best_split = min(
                splits,
                key=lambda s: (current_counts[s] / max(target_counts[s], 1e-6)),
            )
            assign_group(grp, best_split)

    distribute_bucket(anomaly_groups)
    distribute_bucket(hard_normal_groups)
    distribute_bucket(normal_groups)
    distribute_bucket(other_groups)

    assignments: Dict[str, str] = {}
    train_ids = []
    val_ids = []
    test_ids = []

    for s in sorted(samples, key=lambda x: x.sample_id):
        grp_id = sample_to_group[s.sample_id]
        split_name = group_assignments[grp_id]
        assignments[s.sample_id] = split_name
        if split_name == "train":
            train_ids.append(s.sample_id)
        elif split_name == "val":
            val_ids.append(s.sample_id)
        elif split_name == "test":
            test_ids.append(s.sample_id)

    return SplitResult(
        assignments=assignments,
        train_ids=train_ids,
        val_ids=val_ids,
        test_ids=test_ids,
        group_assignments=group_assignments,
        total_samples=len(assignments),
        train_count=len(train_ids),
        val_count=len(val_ids),
        test_count=len(test_ids),
    )
