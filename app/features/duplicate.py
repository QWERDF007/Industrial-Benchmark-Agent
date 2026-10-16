import os
import json
import time
import logging
from typing import Optional, List, Dict, Any, Set, Tuple
from collections import defaultdict
import numpy as np
import faiss
from pydantic import BaseModel, Field

from app.storage.database import Database
from app.storage.repositories import SampleRepository
from app.features.index import load_faiss_index

logger = logging.getLogger("iad_benchmark.features.duplicate")


class DuplicateGroup(BaseModel):
    group_id: str
    size: int
    sample_ids: List[str]
    origin_counts: Dict[str, int]
    is_cross_origin: bool
    max_similarity: float
    min_similarity: float
    avg_similarity: float
    representative_pairs: List[Dict[str, Any]] = Field(default_factory=list)


class DuplicateMiningResult(BaseModel):
    task_id: str
    similarity_threshold: float
    total_samples: int
    group_count: int
    duplicate_sample_count: int
    cross_origin_group_count: int
    cross_origin_pairs: Dict[str, int]
    groups_json_path: str
    report_md_path: str
    elapsed_seconds: float


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


def mine_near_duplicates(
    task_id: str,
    similarity_threshold: float = 0.98,
    top_k_neighbors: int = 50,
    index_dir: Optional[str] = None,
    db_path: str = "data/benchmark.db",
    output_dir: Optional[str] = None,
) -> DuplicateMiningResult:
    """
    Mine near-duplicate candidate groups from FAISS index based on cosine similarity threshold.
    Outputs groups.json and duplicate_report.md.
    Does NOT modify database labels or delete files.
    """
    start_time = time.time()
    idx_dir = index_dir or os.path.join("runs", "features", task_id)
    index, sample_ids, metadata = load_faiss_index(idx_dir)

    total_samples = len(sample_ids)
    if total_samples == 0:
        raise ValueError(f"No samples found in index at {idx_dir}")

    db = Database(db_path)
    sample_repo = SampleRepository(db)
    samples_map = {s.sample_id: s for s in sample_repo.get_many(sample_ids)}

    # Batch search top-k nearest neighbors
    logger.info(
        f"Searching nearest neighbors for {total_samples} samples (k={top_k_neighbors}, threshold={similarity_threshold})..."
    )

    # Reconstruct vectors if index supports it, otherwise extract
    k = min(top_k_neighbors + 1, total_samples)
    
    # We can query index using all embeddings
    # Extract all vectors from IndexFlatIP
    num_vectors = index.ntotal
    dim = index.d
    all_embeddings = np.empty((num_vectors, dim), dtype=np.float32)
    for i in range(num_vectors):
        all_embeddings[i] = index.reconstruct(i)

    # Search in batches to avoid GPU/CPU memory spike
    batch_size = 1000
    matched_pairs: List[Tuple[str, str, float]] = []
    edges: Set[Tuple[str, str]] = set()

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
                    if pair_key not in edges:
                        edges.add(pair_key)
                        matched_pairs.append((pair_key[0], pair_key[1], float(score)))

    logger.info(f"Found {len(matched_pairs)} candidate duplicate pairs above threshold {similarity_threshold}")

    # Cluster pairs into components using Union-Find
    all_duplicate_sample_ids = set()
    for s1, s2, _ in matched_pairs:
        all_duplicate_sample_ids.add(s1)
        all_duplicate_sample_ids.add(s2)

    uf = UnionFind(list(all_duplicate_sample_ids))
    for s1, s2, _ in matched_pairs:
        uf.union(s1, s2)

    # Group sample IDs by root
    raw_groups: Dict[str, List[str]] = defaultdict(list)
    for s_id in all_duplicate_sample_ids:
        root = uf.find(s_id)
        raw_groups[root].append(s_id)

    # Pair lookup for calculating group similarity stats
    pair_scores: Dict[Tuple[str, str], float] = {
        (min(s1, s2), max(s1, s2)): sc for s1, s2, sc in matched_pairs
    }

    # Cross origin stats
    cross_origin_pair_stats: Dict[str, int] = defaultdict(int)
    groups_list: List[DuplicateGroup] = []
    cross_origin_group_count = 0

    # Sort groups by size descending
    sorted_group_roots = sorted(raw_groups.keys(), key=lambda r: len(raw_groups[r]), reverse=True)

    for g_idx, root in enumerate(sorted_group_roots, start=1):
        group_members = sorted(raw_groups[root])
        origin_counts: Dict[str, int] = defaultdict(int)

        for m in group_members:
            sample_obj = samples_map.get(m)
            origin_name = sample_obj.data_origin.value if sample_obj else "UNKNOWN"
            origin_counts[origin_name] += 1

        is_cross = len(origin_counts) > 1
        if is_cross:
            cross_origin_group_count += 1

        # Collect internal pair scores
        group_pair_scores = []
        representative_pairs = []
        for i in range(len(group_members)):
            for j in range(i + 1, len(group_members)):
                m1, m2 = group_members[i], group_members[j]
                pk = (min(m1, m2), max(m1, m2))
                if pk in pair_scores:
                    sc = pair_scores[pk]
                    group_pair_scores.append(sc)
                    # Track cross origin pairs
                    s1_orig = samples_map[m1].data_origin.value if m1 in samples_map else "UNKNOWN"
                    s2_orig = samples_map[m2].data_origin.value if m2 in samples_map else "UNKNOWN"
                    if s1_orig != s2_orig:
                        pair_name = f"{min(s1_orig, s2_orig)} <-> {max(s1_orig, s2_orig)}"
                        cross_origin_pair_stats[pair_name] += 1

                    if len(representative_pairs) < 5:
                        representative_pairs.append(
                            {"sample_a": m1, "sample_b": m2, "similarity": round(sc, 4)}
                        )

        if not group_pair_scores:
            max_sim = min_sim = avg_sim = similarity_threshold
        else:
            max_sim = float(np.max(group_pair_scores))
            min_sim = float(np.min(group_pair_scores))
            avg_sim = float(np.mean(group_pair_scores))

        group_id = f"dup_group_{g_idx:04d}"
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
                representative_pairs=representative_pairs,
            )
        )

    # Output directory
    out_dir = output_dir or os.path.join("runs", "near_duplicate", task_id)
    os.makedirs(out_dir, exist_ok=True)
    groups_json_path = os.path.join(out_dir, "groups.json")
    report_md_path = os.path.join(out_dir, "duplicate_report.md")

    # Serialize groups.json
    groups_data = {
        "task_id": task_id,
        "similarity_threshold": similarity_threshold,
        "total_samples": total_samples,
        "group_count": len(groups_list),
        "duplicate_sample_count": len(all_duplicate_sample_ids),
        "cross_origin_group_count": cross_origin_group_count,
        "cross_origin_pairs": dict(cross_origin_pair_stats),
        "groups": [g.model_dump() for g in groups_list],
    }
    with open(groups_json_path, "w", encoding="utf-8") as f:
        json.dump(groups_data, f, indent=2, ensure_ascii=False)

    # Generate Markdown Report
    elapsed = time.time() - start_time
    md_content = generate_duplicate_report_markdown(
        task_id=task_id,
        threshold=similarity_threshold,
        total_samples=total_samples,
        groups=groups_list,
        cross_origin_pairs=cross_origin_pair_stats,
        samples_map=samples_map,
        elapsed=elapsed,
    )
    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    logger.info(
        f"Near-duplicate mining finished in {elapsed:.2f}s. Found {len(groups_list)} groups ({len(all_duplicate_sample_ids)} samples)."
    )

    return DuplicateMiningResult(
        task_id=task_id,
        similarity_threshold=similarity_threshold,
        total_samples=total_samples,
        group_count=len(groups_list),
        duplicate_sample_count=len(all_duplicate_sample_ids),
        cross_origin_group_count=cross_origin_group_count,
        cross_origin_pairs=dict(cross_origin_pair_stats),
        groups_json_path=groups_json_path,
        report_md_path=report_md_path,
        elapsed_seconds=round(elapsed, 2),
    )


def generate_duplicate_report_markdown(
    task_id: str,
    threshold: float,
    total_samples: int,
    groups: List[DuplicateGroup],
    cross_origin_pairs: Dict[str, int],
    samples_map: Dict[str, Any],
    elapsed: float,
) -> str:
    dup_sample_count = sum(g.size for g in groups)
    dup_sample_unique = len(set(s for g in groups for s in g.sample_ids))
    cross_groups = [g for g in groups if g.is_cross_origin]

    md = f"""# Visual Near-Duplicate Audit Report: {task_id}

> 本报告由 Industrial AD Benchmark Agent (Step 2 Near-Duplicate Mining) 自动生成。  
> ⚠️ **重要原则**: 本阶段产出为**近重复候选分组 (Candidate Groups)**，用于辅助人工审计与基准去泄漏设计。系统**未自动修改任何图像的质检标签**，亦**未自动删除任何样本**。

## 1. 挖掘摘要 (Summary)

- **Task ID**: `{task_id}`
- **余弦相似度候选阈值 (Similarity Threshold)**: `>= {threshold}`
- **任务总样本数 (Total Samples)**: {total_samples:,}
- **近重复候选群组数 (Duplicate Groups)**: {len(groups):,}
- **涉近重复样本总数 (Duplicate Samples)**: {dup_sample_unique:,} ({dup_sample_unique / max(total_samples, 1):.2%})
- **跨来源近重复群组数 (Cross-Origin Groups)**: {len(cross_groups):,}
- **挖掘耗时 (Elapsed Time)**: {elapsed:.2f} s

## 2. 跨数据来源交叉碰撞统计 (Cross-Origin Cross-over)

| 数据来源交叉碰撞 (Cross-Origin Pair) | 碰撞对数 (Pair Count) | 潜在风险说明 |
|---|---:|---|
"""
    if cross_origin_pairs:
        for pair_name, cnt in sorted(cross_origin_pairs.items(), key=lambda x: x[1], reverse=True):
            risk_desc = "历史训练集与测试集重复，存在重大评测泄漏风险" if "LEGACY_TRAIN" in pair_name and "LEGACY_TEST" in pair_name else (
                "原图与数据增强图极度相似，必须划分至同一 Split" if "AUGMENTED" in pair_name else "多源跨域重复"
            )
            md += f"| `{pair_name}` | {cnt:,} | {risk_desc} |\n"
    else:
        md += "| 无跨来源近重复碰撞 | 0 | 未检测到跨来源近重复 |\n"

    md += """
## 3. 高危与代表性近重复群组 (Top Suspicious Groups)

选取跨来源或成员数较多的候选群组展示，供质检与评测专家人工复核：

"""
    # Show top 15 groups prioritizing cross-origin then size
    top_display_groups = sorted(groups, key=lambda g: (g.is_cross_origin, g.size, g.max_similarity), reverse=True)[:15]

    for g in top_display_groups:
        origin_str = ", ".join(f"{k}: {v}" for k, v in g.origin_counts.items())
        cross_badge = "🚨 **[跨来源泄漏风险]**" if g.is_cross_origin else "ℹ️ 同源近重复"
        md += f"### 群组 `{g.group_id}` ({cross_badge})\n\n"
        md += f"- **成员数量**: {g.size} 张图片\n"
        md += f"- **来源分布**: {origin_str}\n"
        md += f"- **相似度范围**: {g.min_similarity:.4f} ~ {g.max_similarity:.4f} (均值 {g.avg_similarity:.4f})\n"
        md += "- **样本成员列表 (前 5 条)**:\n"
        for s_id in g.sample_ids[:5]:
            s_obj = samples_map.get(s_id)
            rel_path = s_obj.relative_path if s_obj else s_id
            qual = s_obj.quality_status.value if s_obj else "UNKNOWN"
            orig = s_obj.data_origin.value if s_obj else "UNKNOWN"
            batch = s_obj.batch_id if s_obj else "N/A"
            md += f"  - `{s_id}` | 路径: `{rel_path}` | 状态: `{qual}` | 来源: `{orig}` | 批次: `{batch}`\n"
        if len(g.sample_ids) > 5:
            md += f"  - *(其余 {len(g.sample_ids) - 5} 个样本略，详见 groups.json)*\n"
        md += "\n"

    md += """---
**后续处理建议 (Step 3 / Benchmark Split)**:
1. 涉及 `LEGACY_TRAIN <-> LEGACY_TEST` 的群组应统一划入同一分集或从评测集中剥离；
2. 涉及 `AUGMENTED` 的样本不可作为独立无偏样本参与测试集评估；
3. 本报告全部候选已写入 `groups.json`，支持外部工具按 `group_id` 进行自动化过滤。
"""
    return md
