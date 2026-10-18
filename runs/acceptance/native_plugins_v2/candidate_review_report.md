# 多源候选合并与统一人审队列报告 (Candidate Review & Unified Queue Report)

## 1. 业务目标与架构规范 (V2-S06, V2-S07, F-03, F-06)
- **多源独立输入**：候选样本来源涵盖 `DINO`（向量距离/离群度）、`LLM`（多模态模型视觉假设/建议）、`AUDIT`（几何截断/标注缺失/近重复冲突）。
- **统一真凭据模型**：`candidate_merge` 输出至 `runs/candidates/<task_id>/merged_candidates.json`，保留每一样本的全部 `sources`、`source_scores` 和 `priority_reason`。
- **人审队列统一展现**：`ReviewQueueService` 严格优先加载 `merged_candidates.json`，非 DINO 挖掘的 LLM-only 和 Audit-only 样本 100% 进入 Web Review Queue (`/api/review/{task_id}/queue`)。
- **只读与权威边界不变性**：Agent 工具及 LLM 建议（`audit_suggestions` 表）仅具备建议权；人工决策（`ReviewDecisionRecord`）只能由人类操作员通过 `/api/review/{session_id}/decision` 写入。

## 2. 候选多源分布统计 (Multi-Source Breakdown)

| 来源通道 (Source) | 挖掘样本数 | 必审阻断标记 (`is_required`) | 典型代表特征 |
|---|---|---|---|
| **DINO** | 25 | 是 (True) | 高法向距离、密度离群度 > 0.85 |
| **LLM-only** | 12 | 否 (False) | 微弱气泡、正常纹理与胶线反光区分 |
| **AUDIT-only** | 8 | 是 (True) | 标注 BBox 越界被裁剪、元数据缺失 |
| **DINO + LLM (重合)** | 6 | 是 (True) | 既有高向量离群，又有大模型观察假说 |
| **总计去重候选** | **51** | — | — |

## 3. 人审交互与 Web 队列真实执行
1. **API 数据格式**：`/api/review/{task_id}/queue` 返回完整元数据：
   ```json
   {
     "candidate_id": "cand_kj_0102",
     "sample_id": "kj_sample_0102",
     "priority": "HIGH",
     "priority_score": 0.88,
     "priority_reason": "DINO distance outlier (0.91) + LLM hypothesis",
     "sources": ["DINO", "LLM"],
     "source_scores": {"DINO": 0.91, "LLM": 0.85},
     "is_required": true
   }
   ```
2. **Web UI 渲染**：`apps/iad-harness/public/index.html` 实时渲染徽章（`DINO` 蓝色、`LLM` 青色、`AUDIT` 黄色）与优先级原因。
3. **决策提交与闭环**：操作员提交 `HARD_NORMAL` 决策后，会话写入审计日志 `review_duration_ms`，阻断解除。
4. **建议不可覆写**：针对相同 `sample_id` 保存多条建议时，追加生成新版本，禁止覆写已有历史，禁止直接篡改 Ground Truth。
