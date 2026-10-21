import json
import os
from typing import List, Tuple


def load_verified_duplicates(task_id: str) -> Tuple[List[Tuple[str, str]], List[List[str]]]:
    """Helper to load verified pairs and groups for a task if existing."""
    verified_pairs: List[Tuple[str, str]] = []
    verified_groups: List[List[str]] = []

    pairs_file = os.path.join("runs", "near_duplicate", task_id, "verified_pairs.json")
    if os.path.exists(pairs_file):
        with open(pairs_file, "r", encoding="utf-8") as f:
            pair_data = json.load(f)
            pairs_list = pair_data.get("pairs", []) if isinstance(pair_data, dict) else pair_data
            for p in pairs_list:
                if isinstance(p, dict) and (p.get("verified", False) or p.get("is_verified", False)):
                    verified_pairs.append((p["sample_id_a"], p["sample_id_b"]))

    groups_file = os.path.join("runs", "near_duplicate", task_id, "verified_groups.json")
    if os.path.exists(groups_file):
        with open(groups_file, "r", encoding="utf-8") as f:
            grp_data = json.load(f)
            groups_list = grp_data.get("groups", []) if isinstance(grp_data, dict) else grp_data
            for g in groups_list:
                if isinstance(g, dict):
                    s_ids = g.get("sample_ids", [])
                    if len(s_ids) > 1:
                        verified_groups.append(s_ids)

    return verified_pairs, verified_groups
