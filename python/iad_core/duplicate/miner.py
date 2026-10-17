import os
import json
import time
import logging
from typing import Optional, List, Dict, Any, Set, Tuple
from collections import defaultdict
import numpy as np
import faiss
from pydantic import BaseModel, Field

from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.feature.index import load_faiss_index
from iad_core.duplicate.verify import PairVerifier, VerificationResult

logger = logging.getLogger("iad_core.duplicate.miner")


class DuplicateGroup(BaseModel):
    group_id: str
    size: int
    sample_ids: List[str]
    origin_counts: Dict[str, int]
    is_cross_origin: bool
    max_similarity: float
    min_similarity: float
    avg_similarity: float
    is_verified: bool = False
    representative_pairs: List[Dict[str, Any]] = Field(default_factory=list)


class DuplicateMiningResult(BaseModel):
    task_id: str
    similarity_threshold: float
    total_samples: int
    candidate_group_count: int
    candidate_sample_count: int
    candidate_cross_origin_group_count: int
    verified_group_count: int
    verified_sample_count: int
    verified_cross_origin_group_count: int
    cross_origin_pairs: Dict[str, int]
    verified_cross_origin_pairs: Dict[str, int]
    candidate_groups_json_path: str
    verified_groups_json_path: str
    verified_pairs_json_path: str
    groups_json_path: str
    report_md_path: str
    elapsed_seconds: float

    @property
    def group_count(self) -> int:
        return self.candidate_group_count

    @property
    def duplicate_sample_count(self) -> int:
        return self.candidate_sample_count

    @property
    def cross_origin_group_count(self) -> int:
        return self.candidate_cross_origin_group_count


class UnionFind:
    def __init__(self, elements: List[str]):
        self.parent = {e: e for e in elements}
        self.rank = {e: 0 for e in elements}

    def find(self, x: str) -> str:
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x: str, y: str):
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return
        if self.rank[rx] < self.rank[ry]:
            self.parent[rx] = ry
        elif self.rank[rx] > self.rank[ry]:
            self.parent[ry] = rx
        else:
            self.parent[ry] = rx
            self.rank[rx] += 1


def _cluster_pairs_to_groups(
    pairs: List[Tuple[str, str, float, Optional[Dict[str, Any]]]],
    samples_map: Dict[str, Any],
    id_prefix: str,
    is_verified: bool,
    default_sim: float,
) -> Tuple[List[DuplicateGroup], Set[str], int, Dict[str, int]]:
    all_sample_ids = set()
    pair_scores: Dict[Tuple[str, str], float] = {}
    pair_extra: Dict[Tuple[str, str], Dict[str, Any]] = {}

    for s1, s2, sc, extra in pairs:
        all_sample_ids.add(s1)
        all_sample_ids.add(s2)
        pair_key = (min(s1, s2), max(s1, s2))
        pair_scores[pair_key] = sc
        if extra:
            pair_extra[pair_key] = extra

    uf = UnionFind(list(all_sample_ids))
    for s1, s2, _, _ in pairs:
        uf.union(s1, s2)

    raw_groups: Dict[str, List[str]] = defaultdict(list)
    for s_id in all_sample_ids:
        raw_groups[uf.find(s_id)].append(s_id)

    cross_origin_pairs: Dict[str, int] = defaultdict(int)
    groups_list: List[DuplicateGroup] = []
    cross_origin_group_count = 0

    sorted_roots = sorted(raw_groups.keys(), key=lambda r: len(raw_groups[r]), reverse=True)

    for g_idx, root in enumerate(sorted_roots, start=1):
        group_members = sorted(raw_groups[root])
        origin_counts: Dict[str, int] = defaultdict(int)

        for m in group_members:
            sample_obj = samples_map.get(m)
            origin_name = sample_obj.data_origin.value if sample_obj else "UNKNOWN"
            origin_counts[origin_name] += 1

        is_cross = len(origin_counts) > 1
        if is_cross:
            cross_origin_group_count += 1

        group_scores = []
        representative_pairs = []

        for i in range(len(group_members)):
            for j in range(i + 1, len(group_members)):
                m1, m2 = group_members[i], group_members[j]
                pk = (min(m1, m2), max(m1, m2))
                if pk in pair_scores:
                    sc = pair_scores[pk]
                    group_scores.append(sc)

                    s1_orig = samples_map[m1].data_origin.value if m1 in samples_map else "UNKNOWN"
                    s2_orig = samples_map[m2].data_origin.value if m2 in samples_map else "UNKNOWN"
                    if s1_orig != s2_orig:
                        pair_name = f"{min(s1_orig, s2_orig)} <-> {max(s1_orig, s2_orig)}"
                        cross_origin_pairs[pair_name] += 1

                    if len(representative_pairs) < 5:
                        p_data = {"sample_a": m1, "sample_b": m2, "similarity": round(sc, 4)}
                        if pk in pair_extra:
                            p_data.update(pair_extra[pk])
                        representative_pairs.append(p_data)

        if not group_scores:
            max_sim = min_sim = avg_sim = default_sim
        else:
            max_sim = float(np.max(group_scores))
            min_sim = float(np.min(group_scores))
            avg_sim = float(np.mean(group_scores))

        group_id = f"{id_prefix}_{g_idx:04d}"
        groups_list.append(
            DuplicateGroup(
                group_id=group_id,
                size=len(group_members),
                sample_ids=group_members,
                origin_counts=dict(origin_counts),
                is_cross_origin=is_cross,
                max_similarity=round(max_sim, 4),
                min_similarity=round(min_sim, 4),
                avg_similarity=round(avg_sim, 4),
                is_verified=is_verified,
                representative_pairs=representative_pairs,
            )
        )

    return groups_list, all_sample_ids, cross_origin_group_count, cross_origin_pairs


def mine_near_duplicates(
    task_id: str,
    similarity_threshold: float = 0.98,
    top_k_neighbors: int = 50,
    index_dir: Optional[str] = None,
    db_path: str = "data/benchmark.db",
    output_dir: Optional[str] = None,
    verifier: Optional[PairVerifier] = None,
) -> DuplicateMiningResult:
    start_time = time.time()
    idx_dir = index_dir or os.path.join("runs", "features", task_id)
    index, sample_ids, metadata = load_faiss_index(idx_dir)

    total_samples = len(sample_ids)
    if total_samples == 0:
        raise ValueError(f"No samples found in index at {idx_dir}")

    db = Database(db_path)
    sample_repo = SampleRepository(db)
    samples_map = {s.sample_id: s for s in sample_repo.get_many(sample_ids)}

    logger.info(
        f"Searching nearest neighbors for {total_samples} samples (k={top_k_neighbors}, threshold={similarity_threshold})..."
    )

    k = min(top_k_neighbors + 1, total_samples)
    num_vectors = index.ntotal
    dim = index.d
    all_embeddings = np.empty((num_vectors, dim), dtype=np.float32)
    for i in range(num_vectors):
        all_embeddings[i] = index.reconstruct(i)

    batch_size = 1000
    candidate_pairs: List[Tuple[str, str, float, Optional[Dict[str, Any]]]] = []
    seen_edges: Set[Tuple[str, str]] = set()

    for start_idx in range(0, num_vectors, batch_size):
        end_idx = min(start_idx + batch_size, num_vectors)
        batch_vecs = all_embeddings[start_idx:end_idx]
        dists, inds = index.search(batch_vecs, k)

        for b_offset in range(end_idx - start_idx):
            i = start_idx + b_offset
            src_id = sample_ids[i]
            for score, j in zip(dists[b_offset], inds[b_offset]):
                if j < 0 or i == j:
                    continue
                if score >= similarity_threshold:
                    tgt_id = sample_ids[j]
                    pair_key = (min(src_id, tgt_id), max(src_id, tgt_id))
                    if pair_key not in seen_edges:
                        seen_edges.add(pair_key)
                        candidate_pairs.append((pair_key[0], pair_key[1], float(score), None))

    logger.info(f"Found {len(candidate_pairs)} candidate duplicate pairs above threshold {similarity_threshold}")

    candidate_groups, cand_sample_ids, cand_cross_count, cand_cross_pairs = _cluster_pairs_to_groups(
        pairs=candidate_pairs,
        samples_map=samples_map,
        id_prefix="cand_group",
        is_verified=False,
        default_sim=similarity_threshold,
    )

    if verifier is None:
        verifier = PairVerifier()

    logger.info(f"Verifying {len(candidate_pairs)} candidate pairs using PairVerifier...")
    verified_pairs: List[Tuple[str, str, float, Optional[Dict[str, Any]]]] = []
    saved_verified_pair_records: List[Dict[str, Any]] = []

    for s1, s2, cos_score, _ in candidate_pairs:
        obj_a = samples_map.get(s1)
        obj_b = samples_map.get(s2)
        if not obj_a or not obj_b:
            continue

        v_res = verifier.verify(obj_a.image_path, obj_b.image_path, dino_cosine=cos_score)
        if v_res.verified:
            extra = {
                "dino_cosine": cos_score,
                "pixel_cosine": v_res.pixel_cosine,
                "ncc": v_res.ncc,
                "mean_abs_diff": v_res.mean_abs_diff,
                "high_diff_ratio": v_res.high_diff_ratio,
                "best_shift": list(v_res.best_shift),
            }
            verified_pairs.append((s1, s2, cos_score, extra))
            saved_verified_pair_records.append({
                "sample_id_a": min(s1, s2),
                "sample_id_b": max(s1, s2),
                "dino_cosine": round(float(cos_score), 4),
                "pixel_cosine": v_res.pixel_cosine,
                "ncc": v_res.ncc,
                "mean_abs_diff": v_res.mean_abs_diff,
                "high_diff_ratio": v_res.high_diff_ratio,
                "best_shift": list(v_res.best_shift),
                "verified": True,
            })

    logger.info(f"Verified {len(verified_pairs)} / {len(candidate_pairs)} pairs as true near-duplicates")

    verified_groups, ver_sample_ids, ver_cross_count, ver_cross_pairs = _cluster_pairs_to_groups(
        pairs=verified_pairs,
        samples_map=samples_map,
        id_prefix="ver_group",
        is_verified=True,
        default_sim=similarity_threshold,
    )

    out_dir = output_dir or os.path.join("runs", "near_duplicate", task_id)
    os.makedirs(out_dir, exist_ok=True)
    candidate_json_path = os.path.join(out_dir, "candidate_groups.json")
    verified_json_path = os.path.join(out_dir, "verified_groups.json")
    verified_pairs_json_path = os.path.join(out_dir, "verified_pairs.json")
    groups_json_path = os.path.join(out_dir, "groups.json")
    report_md_path = os.path.join(out_dir, "duplicate_report.md")

    cand_data = {
        "task_id": task_id,
        "type": "CANDIDATE",
        "similarity_threshold": similarity_threshold,
        "total_samples": total_samples,
        "group_count": len(candidate_groups),
        "duplicate_sample_count": len(cand_sample_ids),
        "cross_origin_group_count": cand_cross_count,
        "cross_origin_pairs": dict(cand_cross_pairs),
        "groups": [g.model_dump() for g in candidate_groups],
    }
    with open(candidate_json_path, "w", encoding="utf-8") as f:
        json.dump(cand_data, f, indent=2, ensure_ascii=False)

    with open(groups_json_path, "w", encoding="utf-8") as f:
        json.dump(cand_data, f, indent=2, ensure_ascii=False)

    ver_data = {
        "task_id": task_id,
        "type": "VERIFIED",
        "similarity_threshold": similarity_threshold,
        "total_samples": total_samples,
        "group_count": len(verified_groups),
        "duplicate_sample_count": len(ver_sample_ids),
        "cross_origin_group_count": ver_cross_count,
        "cross_origin_pairs": dict(ver_cross_pairs),
        "groups": [g.model_dump() for g in verified_groups],
    }
    with open(verified_json_path, "w", encoding="utf-8") as f:
        json.dump(ver_data, f, indent=2, ensure_ascii=False)

    ver_pairs_data = {
        "task_id": task_id,
        "type": "DIRECT_VERIFIED_PAIRS",
        "similarity_threshold": similarity_threshold,
        "total_samples": total_samples,
        "total_verified_pairs": len(saved_verified_pair_records),
        "pairs": saved_verified_pair_records,
    }
    with open(verified_pairs_json_path, "w", encoding="utf-8") as f:
        json.dump(ver_pairs_data, f, indent=2, ensure_ascii=False)

    elapsed = time.time() - start_time

    md_content = generate_duplicate_report_markdown(
        task_id=task_id,
        threshold=similarity_threshold,
        total_samples=total_samples,
        candidate_groups=candidate_groups,
        cand_sample_ids=cand_sample_ids,
        cand_cross_pairs=cand_cross_pairs,
        verified_groups=verified_groups,
        ver_sample_ids=ver_sample_ids,
        ver_cross_pairs=ver_cross_pairs,
        samples_map=samples_map,
        elapsed=elapsed,
    )
    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    logger.info(
        f"Near-duplicate mining finished in {elapsed:.2f}s. Candidates: {len(candidate_groups)} groups; Verified: {len(verified_groups)} groups."
    )

    return DuplicateMiningResult(
        task_id=task_id,
        similarity_threshold=similarity_threshold,
        total_samples=total_samples,
        candidate_group_count=len(candidate_groups),
        candidate_sample_count=len(cand_sample_ids),
        candidate_cross_origin_group_count=cand_cross_count,
        verified_group_count=len(verified_groups),
        verified_sample_count=len(ver_sample_ids),
        verified_cross_origin_group_count=ver_cross_count,
        cross_origin_pairs=dict(cand_cross_pairs),
        verified_cross_origin_pairs=dict(ver_cross_pairs),
        candidate_groups_json_path=candidate_json_path,
        verified_groups_json_path=verified_json_path,
        verified_pairs_json_path=verified_pairs_json_path,
        groups_json_path=groups_json_path,
        report_md_path=report_md_path,
        elapsed_seconds=round(elapsed, 2),
    )


def generate_duplicate_report_markdown(
    task_id: str,
    threshold: float,
    total_samples: int,
    candidate_groups: List[DuplicateGroup],
    cand_sample_ids: Set[str],
    cand_cross_pairs: Dict[str, int],
    verified_groups: List[DuplicateGroup],
    ver_sample_ids: Set[str],
    ver_cross_pairs: Dict[str, int],
    samples_map: Dict[str, Any],
    elapsed: float,
) -> str:
    cand_coverage = len(cand_sample_ids) / max(total_samples, 1)
    ver_coverage = len(ver_sample_ids) / max(total_samples, 1)

    md = f"""# Visual Near-Duplicate Audit Report: {task_id}

> 本报告由 Industrial AD Benchmark Core v2 自动生成。  
> ⚠️ **核心原则**: 本报告产出分层为 **Candidate（高召回候选）** 与 **Verified（高置信二次验证）**。系统**未自动修改任何图像的质检标签**，亦**未自动删除任何样本**。

## 1. 挖掘与验证双层摘要 (Two-Tier Summary)

| 指标维度 | 候选层 (Candidate Level) | 确认层 (Verified Level) | 语义说明 |
|---|---:|---:|---|
| **判断依据** | DINOv2 Cosine `>= {threshold}` | DINOv2 + NCC/Pixel Cosine 验证 | 候选负责全量召回，验证负责高置信收敛 |
| **群组数量 (Groups)** | {len(candidate_groups):,} | {len(verified_groups):,} | 连通分量聚类群组数 |
| **涉及样本数 (Samples)** | {len(cand_sample_ids):,} | {len(ver_sample_ids):,} | 群组包含的总图片数 |
| **样本覆盖率 (Coverage)** | **{cand_coverage:.2%}** | **{ver_coverage:.2%}** | 占数据集总样本 ({total_samples:,}) 比例 |
| **跨来源群组 (Cross-Origin)** | {sum(1 for g in candidate_groups if g.is_cross_origin):,} | {sum(1 for g in verified_groups if g.is_cross_origin):,} | 跨历史 Train/Test/Augmented 碰撞群组 |

- **总耗时**: {elapsed:.2f} s

## 2. 跨数据来源交叉碰撞对比 (Cross-Origin Comparison)

| 数据来源交叉碰撞 (Cross-Origin Pair) | 候选对数 (Candidate Pairs) | 确认对数 (Verified Pairs) | 潜在风险说明 |
|---|---:|---:|---|
"""
    all_pairs = sorted(set(list(cand_cross_pairs.keys()) + list(ver_cross_pairs.keys())))
    if all_pairs:
        for p in all_pairs:
            c_cnt = cand_cross_pairs.get(p, 0)
            v_cnt = ver_cross_pairs.get(p, 0)
            risk = "历史训练集与测试集重复，存在重大评测泄漏风险" if "LEGACY_TRAIN" in p and "LEGACY_TEST" in p else (
                "原图与数据增强图极度相似，必须划分至同一 Split" if "AUGMENTED" in p else "跨域样本高度相似"
            )
            md += f"| `{p}` | {c_cnt:,} | **{v_cnt:,}** | {risk} |\n"
    else:
        md += "| 无跨来源近重复碰撞 | 0 | 0 | 未检测到跨来源碰撞 |\n"

    md += """
## 3. 高置信近重复群组 (Top Verified Duplicate Groups)

展示经过像素级 NCC 与 Pixel Cosine 二次验证确认的近重复群组：

"""
    top_ver = sorted(verified_groups, key=lambda g: (g.is_cross_origin, g.size, g.max_similarity), reverse=True)[:15]

    if not top_ver:
        md += "*未发现满足二次验证阈值的严格近重复群组。*\n\n"
    else:
        for g in top_ver:
            orig_str = ", ".join(f"{k}: {v}" for k, v in g.origin_counts.items())
            cross_badge = "🚨 **[跨来源泄漏]**" if g.is_cross_origin else "ℹ️ 同源近重复"
            md += f"### 群组 `{g.group_id}` ({cross_badge})\n\n"
            md += f"- **成员数量**: {g.size} 张图片\n"
            md += f"- **来源分布**: {orig_str}\n"
            md += f"- **DINO 相似度**: {g.min_similarity:.4f} ~ {g.max_similarity:.4f} (均值 {g.avg_similarity:.4f})\n"
            if g.representative_pairs:
                rep = g.representative_pairs[0]
                md += f"- **二次验证指标**: Pixel Cosine = {rep.get('pixel_cosine', 'N/A')}, NCC = {rep.get('ncc', 'N/A')}\n"
            md += "- **代表性成员样本**:\n"
            for s_id in g.sample_ids[:5]:
                s_obj = samples_map.get(s_id)
                rel_path = s_obj.relative_path if s_obj else s_id
                qual = s_obj.quality_status.value if s_obj else "UNKNOWN"
                orig = s_obj.data_origin.value if s_obj else "UNKNOWN"
                batch = s_obj.batch_id if s_obj else "N/A"
                md += f"  - `{s_id}` | 路径: `{rel_path}` | 状态: `{qual}` | 来源: `{orig}` | 批次: `{batch}`\n"
            if len(g.sample_ids) > 5:
                md += f"  - *(其余 {len(g.sample_ids) - 5} 个样本略，详见 verified_groups.json)*\n"
            md += "\n"

    md += """---
**说明**:
1. `candidate_groups.json`: 涵盖所有视觉相似度高的候选，用于评估粗粒度数据分布及高召回排查；
2. `verified_groups.json`: 经过严格 NCC / 像素比对的真近重复，作为后续 Step 4 Split 去泄漏的核心阻断依据；
3. 本报告严格遵守无破坏原则，未自动修改数据库中的质量标签。
"""
    return md
