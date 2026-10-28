from typing import List, Dict, Tuple, Optional, Set
from pydantic import BaseModel, Field

from iad_core.storage.models import Sample, DataOrigin
from iad_core.gold.schemas import GoldRecord, BinaryLabel


class SplitGroup(BaseModel):
    group_id: str
    sample_ids: List[str]
    physical_sample_ids: List[str] = Field(default_factory=list)
    capture_sequence_ids: List[str] = Field(default_factory=list)
    has_augmented: bool = False
    has_normal: bool = False
    has_hard_normal: bool = False
    has_anomaly: bool = False


class DisjointSetUnion:
    def __init__(self, elements: List[str]):
        self.parent = {e: e for e in elements}
        self.rank = {e: 0 for e in elements}

    def find(self, x: str) -> str:
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x: str, y: str):
        if x not in self.parent or y not in self.parent:
            return
        rx = self.find(x)
        ry = self.find(y)
        if rx != ry:
            if self.rank[rx] < self.rank[ry]:
                self.parent[rx] = ry
            elif self.rank[rx] > self.rank[ry]:
                self.parent[ry] = rx
            else:
                self.parent[ry] = rx
                self.rank[rx] += 1


def build_split_groups(
    samples: List[Sample],
    verified_pairs: Optional[List[Tuple[str, str]]] = None,
    verified_groups: Optional[List[List[str]]] = None,
    gold_records: Optional[Dict[str, GoldRecord]] = None,
    physical_sample_scope: str = "batch",
) -> Tuple[List[SplitGroup], Dict[str, str]]:
    """
    Build unified atomic split groups via Union-Find (DSU).
    Merges samples across:
    1. same physical_sample_id (scoped by physical_sample_scope: 'batch', 'global', 'run')
    2. same non-empty capture_sequence_id
    3. verified duplicate pairs and verified components
    Fallback: isolated samples retain individual group.
    
    Stratification labels (has_normal, has_hard_normal, has_anomaly) come strictly from
    GoldRecord when gold_records is provided.
    """
    sample_map = {s.sample_id: s for s in samples}
    sample_ids = list(sample_map.keys())
    relation_ids = {identity for pair in verified_pairs or [] for identity in pair}
    relation_ids.update(identity for group in verified_groups or [] for identity in group)
    dsu = DisjointSetUnion(sorted(set(sample_ids) | relation_ids))

    # 1. Union by physical_sample_id considering physical_sample_scope
    phys_map: Dict[str, List[str]] = {}
    for s in samples:
        if s.physical_sample_id:
            if physical_sample_scope == "batch" and s.batch_id:
                phys_key = f"{s.batch_id}_{s.physical_sample_id}"
            else:
                phys_key = s.physical_sample_id
            phys_map.setdefault(phys_key, []).append(s.sample_id)

    for p_id, s_ids in phys_map.items():
        first = s_ids[0]
        for other in s_ids[1:]:
            dsu.union(first, other)

    # 2. Union by capture_sequence_id
    seq_map: Dict[str, List[str]] = {}
    for s in samples:
        if s.capture_sequence_id:
            seq_map.setdefault(s.capture_sequence_id, []).append(s.sample_id)
    for sq_id, s_ids in seq_map.items():
        first = s_ids[0]
        for other in s_ids[1:]:
            dsu.union(first, other)

    # 3. Union by verified duplicate pairs
    if verified_pairs:
        for a, b in verified_pairs:
            dsu.union(a, b)

    # 4. Union by verified duplicate components
    if verified_groups:
        for comp in verified_groups:
            valid_comp = comp
            if len(valid_comp) > 1:
                first = valid_comp[0]
                for other in valid_comp[1:]:
                    dsu.union(first, other)

    # 5. Aggregate components
    components: Dict[str, List[str]] = {}
    for sid in sample_ids:
        root = dsu.find(sid)
        components.setdefault(root, []).append(sid)

    # 6. Format deterministic SplitGroup objects
    split_groups: List[SplitGroup] = []
    sample_to_group: Dict[str, str] = {}

    for root, members in components.items():
        sorted_members = sorted(members)
        rep_id = sorted_members[0]
        group_id = f"grp_{rep_id}"

        phys_ids = sorted(list({
            sample_map[m].physical_sample_id
            for m in sorted_members if sample_map[m].physical_sample_id
        }))
        seq_ids = sorted(list({
            sample_map[m].capture_sequence_id
            for m in sorted_members if sample_map[m].capture_sequence_id
        }))

        has_aug = any(
            (sample_map[m].data_origin == DataOrigin.AUGMENTED or
             str(sample_map[m].data_origin) == "AUGMENTED")
            for m in sorted_members
        )

        has_norm = False
        has_hard_norm = False
        has_anom = False

        if gold_records:
            for m in sorted_members:
                g = gold_records.get(m)
                if g and g.gold_status == "CONFIRMED":
                    if g.binary_label == BinaryLabel.NORMAL.value or g.binary_label == "NORMAL":
                        has_norm = True
                    if g.hard_normal:
                        has_hard_norm = True
                    if g.binary_label == BinaryLabel.ANOMALY.value or g.binary_label == "ANOMALY":
                        has_anom = True
        else:
            for m in sorted_members:
                q = str(sample_map[m].quality_status)
                if "PASS" in q:
                    has_norm = True
                if "HARD_NORMAL" in q:
                    has_hard_norm = True
                if "FAIL" in q:
                    has_anom = True

        for m in sorted_members:
            sample_to_group[m] = group_id

        split_groups.append(
            SplitGroup(
                group_id=group_id,
                sample_ids=sorted_members,
                physical_sample_ids=phys_ids,
                capture_sequence_ids=seq_ids,
                has_augmented=has_aug,
                has_normal=has_norm,
                has_hard_normal=has_hard_norm,
                has_anomaly=has_anom,
            )
        )

    split_groups.sort(key=lambda g: g.group_id)
    return split_groups, sample_to_group
