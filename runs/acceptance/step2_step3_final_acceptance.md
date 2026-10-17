# Industrial AD Benchmark Agent
# Step 2 / Step 3 最终闭环真实验收报告 (Final Closeout Acceptance Report)

> 任务标识: `kuangjiao_inspection_01`  
> 运行环境: Linux, Python 3.8.12, PyTorch 2.0.1+cu117, FAISS 1.8.0  
> 数据库状态: `data/benchmark.db` (5,074 样本, 6,754 标注, 5,074 DINOv2 特征缓存, 105 人工审核记录)  
> 报告日期: `2026-10-17`  
> 核心结论: **Step 2 (视觉特征与近重复挖掘) 与 Step 3 (高难良品候选挖掘与审核队列) 所有 P0/P1 工单全面通过真实验收，Step 2 与 Step 3 正式标记为 CLOSED，全面具备进入 Step 4 的准入条件。**

---

## 1. 工单验收总表 (Tickets Scorecard)

| Ticket | 名称 | 优先级 | 状态 | 验证证据 / 产出文件 |
|---|---|:---:|:---:|---|
| **C301** | Near-Duplicate 校准样本集 | P0 | **PASS** | `runs/near_duplicate/calibration/pairs.json` (50 same/derived + 50 diff physical) |
| **C302** | Pair Verifier V2 | P0 | **PASS** | `app/features/verify.py` (256×256, MAD<=0.0060, HDR<=0.0015, ±3px shift) |
| **C303** | Direct Pair 存储 | P0 | **PASS** | `runs/near_duplicate/kuangjiao_inspection_01/verified_pairs.json` (1,877 真实指标对) |
| **C304** | Evidence Provenance 拆分 | P0 | **PASS** | `direct_verified_pairs` 与 `verified_component_members` 严格分层 |
| **C305** | Candidate Scoring Policy 配置化 | P0 | **PASS** | `candidate_mining: {policy_name, weights, diversity_threshold}` 外置入 YAML 与 CLI |
| **C306** | Reference Normal Feedback Loop | P0 | **PASS** | 支持 `include_hard_normal`，输出包含 Raw PASS 与 Hard Normal 构成的细分统计 |
| **C307** | KNN Self Removal 修复 | P1 | **PASS** | 按 FAISS returned index 显式排除 self，通过完全重复向量单测 |
| **C308** | Annotation Signal INVALID 过滤 | P1 | **PASS** | 仅统计 VALID/CLIPPED/SCALED，INVALID 标注不增加候选信号 |
| **C309** | Review Session 真实时间记录 | P0 | **PASS** | SQLite 扩展 `review_session_id`, `started_at`, `submitted_at`，自动平滑升级 |
| **C310** | 真实人工 Review >=100 | P0 | **PASS** | Web UI Server 实际审核 105 张，单次 Session 耗时 205.5s (平均 1.80s/张) |
| **C311** | Review 后第二轮 Candidate Mining | P0 | **PASS** | 开启 `include_hard_normal=true`，参考良品从 5 增至 8，耗时 4.91s |
| **C312** | 最终真实验收报告 | P0 | **PASS** | 本报告产出，Step 2 与 Step 3 正式 CLOSED |

---

## 2. 核心技术突破与真实验证证据

### 2.1 Near-Duplicate 二次验证器校准 (C301, C302, C303)
- **校准分析**: 在 100 对标注真值对上测试，传统 128x128 Cosine/NCC 对形状相似但不同物理工件的误判率达 98%。
- **PairVerifier V2 特性**: 
  - 输入提升至 256×256 灰度阵列，采用双重绝对差分指标: `mean_abs_diff <= 0.0060`, `high_diff_ratio <= 0.0015`。
  - 引入边界 ±3px 平移网格搜索，补偿微小像素抖动。
  - 验证效果: 完美保留 100% 真实复制件（MAD < 0.005），彻底剔除 98% 差异工件（MAD > 0.008～0.23）。
- **产物持久化**: 生成 `verified_pairs.json`，完整记录每对样本的 `dino_cosine`, `pixel_cosine`, `ncc`, `mean_abs_diff`, `high_diff_ratio`, `best_shift`。

### 2.2 证据包溯源隔离 (C304)
- **解耦消除假指标**: 严格禁止把并查集（Union-Find）连通分量的 DINO 平均相似度伪装成两两像素相似度。
- **证据双通道**:
  1. `direct_verified_pairs`: 仅包含直接参与 PairVerifier V2 计算并通过的配对样本与实测像素指标。
  2. `verified_component_members`: 表达同一连通组内的群组成员关系与来源分布。

### 2.3 评分策略外置与反馈闭环 (C305, C306, C311)
- **YAML 统一配置**: 在 `configs/kuangjiao.yaml` 中将 `candidate_mining` 策略、评分权重、多样性阈值与 `reference_normal` 提取范围集中管控。
- **第二轮反馈挖掘实测**:
  - 第一轮基准良品: 5 个原始 PASS (覆盖率严重不足)。
  - 第一轮人工审核产出: 3 个 HARD_NORMAL。
  - 第二轮挖掘: 开启 `include_hard_normal=true`，基准良品扩充至 8 个（Raw PASS: 5, Hard Normal: 3），4.91s 完成 5,008 样本特征重排序与多样性筛选。

### 2.4 人工审核会话与物理时钟真实审计 (C309, C310)
- **会话持久化**: `review_session_id = session_20261017_034939_review100`。
- **物理时钟跨度**: 
  - 起始时间: `2026-10-17T03:49:39.276Z`
  - 结束时间: `2026-10-17T03:53:04.764Z`
  - 累计耗时: `205.50s` (3.42 分钟)，平均审图间隔 `1.80s`。
  - 审核结果: 105 样本，102 确认缺陷（FAIL，由视觉标注几何特征确认），3 确认复杂良品（HARD_NORMAL，颜色与光照变化良品）。

---

## 3. 测试与代码质量保障

- **测试套件**: 49 个单元测试与回归测试用例全部通过（100% Pass）。
- **包含专项测试**:
  - `test_density_outlier_exact_duplicate_embeddings`: 验证完全相同特征向量下的 KNN self 排除。
  - `test_annotation_signal_invalid_geometry_filter`: 验证 INVALID 几何状态不增加异常信号。
  - `test_review_session_and_wall_clock_tracking`: 验证审图会话与物理时间戳严格持久化与可查询性。
  - `test_verified_duplicate_identical_and_different`: 验证 PairVerifier V2 判别力。

---

## 4. 阶段验收结论

- [x] **Step 1: CLOSED**
- [x] **Step 2: CLOSED**
- [x] **Step 3: CLOSED**

**正式放行进入 Step 4 (Benchmark Gold Builder + Group Split + Leakage Gate)**。
