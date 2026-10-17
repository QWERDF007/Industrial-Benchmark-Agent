import os
from typing import List, Dict, Any
from collections import defaultdict
from iad_core.candidate.schemas import CandidateRecord, CandidateMiningResult


def generate_candidate_mining_markdown(
    task_id: str,
    result: CandidateMiningResult,
    records: List[CandidateRecord],
) -> str:
    origin_counts: Dict[str, int] = defaultdict(int)
    batch_counts: Dict[str, int] = defaultdict(int)
    for r in records:
        origin_counts[r.data_origin] += 1
        b_key = r.batch_id or "unknown"
        batch_counts[b_key] += 1

    warning_text = ""
    if result.low_reference_warning:
        warning_text = f"""
> ⚠️ **警告**: 当前任务可信基准良品 (Reference Normal) 数量不足 ({result.reference_count} 个，建议 >= 30 个)。
> 当前 Normal Distance 分数基于有限良品计算，建议优先审核前排样本扩充 Reference Normal 集！
"""

    md = f"""# Hard Normal Candidate Mining Report: {task_id}

> 本报告由 Industrial AD Benchmark Core v2 自动生成。  
> ⚠️ **核心原则**: 本报告仅提供按视觉稀有度、法向距离与异常信号排序的**待审核候选集 (Candidate Queue)**。系统**未做任何自动打标**，保留原始标签。
{warning_text}
## 1. 挖掘与排序概览 (Mining Overview)

- **Task ID**: `{task_id}`
- **策略名称 (Policy Name)**: `{result.policy_name}`
- **候选样本池 (Candidate Pool)**: {result.pool_size:,} 个样本
- **选取 Top-K**: {result.top_k:,} 个样本
- **多样性抑制后实际入选 (Diverse Selected)**: {result.selected_count:,} 个样本
- **多样性抑制阈值 (Diversity Threshold)**: `{result.diversity_threshold}`
- **基准良品总数 (Reference Normal Count)**: {result.reference_count:,} 个
- **运算耗时 (Elapsed Time)**: {result.elapsed_seconds:.2f} s (100% 复用特征缓存，0 次重新推理)

### 1.1 基准良品构成 (Reference Normal Breakdown)

| 良品参考来源 | 样本数 | 占比 |
|---|---:|---:|
| 原始确定良品 (Raw Confirmed PASS) | {result.reference_breakdown.get('raw_pass', 0):,} | {result.reference_breakdown.get('raw_pass', 0) / max(1, result.reference_count):.2%} |
| 人工审核良品 (Review Confirmed PASS) | {result.reference_breakdown.get('review_pass', 0):,} | {result.reference_breakdown.get('review_pass', 0) / max(1, result.reference_count):.2%} |
| 审核高难良品 (Review HARD_NORMAL) | {result.reference_breakdown.get('hard_normal', 0):,} | {result.reference_breakdown.get('hard_normal', 0) / max(1, result.reference_count):.2%} |
| **总计有效基准 (Total Reference)** | **{result.reference_count:,}** | 100.0% |

### 1.2 评分权重配置 (Scoring Weights)

- `normal_distance` (良品法向距离权重): **{result.weights.normal_distance:.2f}**
- `density_outlier` (局部密度离群权重): **{result.weights.density_outlier:.2f}**
- `domain_novelty` (批次跨域新颖度权重): **{result.weights.domain_novelty:.2f}**
- `annotation_signal` (标注几何特征权重): **{result.weights.annotation_signal:.2f}**

## 2. 候选样本特征分布 (Candidate Distribution)

### 2.1 数据来源分布 (Data Origin)

| 数据来源 (Origin) | 候选样本数 | 占比 |
|---|---:|---:|
"""
    for orig, cnt in sorted(origin_counts.items(), key=lambda x: x[1], reverse=True):
        md += f"| `{orig}` | {cnt:,} | {cnt / max(1, len(records)):.2%} |\n"

    md += """
### 2.2 生产批次分布 TOP 10 (Production Date / Batch)

| 批次标识 (Batch ID) | 候选样本数 |
|---|---:|
"""
    for b_id, cnt in sorted(batch_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        md += f"| `{b_id}` | {cnt:,} |\n"

    md += """
## 3. 高优先级候选样本 TOP 20 (Top Priority Candidates)

以下样本外观特征与常规正常模式偏离较大，且通过了视觉多样性抑制，优先进入人工审核队列：

| 排名 | 综合得分 | Normal Dist | Density Outlier | Domain Novelty | Ann Signal | 来源 | 批次 | 样本相对路径 |
|---:|---:|---:|---:|---:|---:|---|---|---|
"""
    for r in records[:20]:
        s = r.signals
        md += f"| {r.rank} | **{r.candidate_score:.4f}** | {s.normal_distance:.3f} | {s.density_outlier:.3f} | {s.domain_novelty:.3f} | {s.annotation_signal:.3f} | `{r.data_origin}` | `{r.batch_id or 'N/A'}` | `{r.relative_path}` |\n"

    md += """
---
**后续审核指导 (Review Guidance)**:
1. 优先对上述前排样本进行研判并给出决策 (`PASS`, `HARD_NORMAL`, `FAIL`, `UNCERTAIN`, `SKIP`)；
2. 标注为 `HARD_NORMAL` 的样本将作为高质量复杂正常参考，反哺后续 Benchmark 基准。
"""
    return md
