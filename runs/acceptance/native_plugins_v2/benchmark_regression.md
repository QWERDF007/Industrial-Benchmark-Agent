# 基准与评测无回归验证报告 (Benchmark & Evaluation Regression Report)

## 1. 框胶基准事实与指标不变性 (kuangjiao_inspection_01_20261017_003)

对照历史正式基准构建 `kuangjiao_inspection_01_20261017_003` 进行全量无回归核对：

| 维度 / 统计项 | 历史记录 | 本轮实际核验 | 判定结果 |
|---|---|---|---|
| **总图像数量 (Total Images)** | 5,074 | 5,074 | **INVARIANT (一致)** |
| **已确认 Gold (Confirmed Gold)** | 114 | 114 | **INVARIANT (一致)** |
| **Train 划分** | 67 (4 正常 + 63 异常；无监督选样仅消费 4 正常) | 67 (4 正常 + 63 异常；无监督选样仅消费 4 正常) | **INVARIANT (一致)** |
| **Validation 划分** | 23 (2 正常 + 21 异常；Val 阈值拟合) | 23 (2 正常 + 21 异常；Val 阈值拟合) | **INVARIANT (一致)** |
| **Test 划分** | 24 (2 正常 + 22 异常；盲测评估) | 24 (2 正常 + 22 异常；盲测评估) | **INVARIANT (一致)** |
| **Test Hard Normal** | 1 | 1 | **INVARIANT (一致)** |
| **FPR 最小分辨率** | 1 / 2 = 50.0% (Test 仅 2 正常) | 1 / 2 = 50.0% (Test 仅 2 正常) | **INVARIANT (一致)** |
| **Recall@1%FPR** | `NOT_EVALUATED` (分辨率不足) | `NOT_EVALUATED` (分辨率不足) | **INVARIANT (一致)** |
| **Hard Normal FPR** | `PROVISIONAL` (分母仅 1 张) | `PROVISIONAL` (分母仅 1 张) | **INVARIANT (一致)** |

## 2. 核心系统不变量校验 (Strict Invariant Gating)
1. **阻断性防泄漏网关 (`leakage_check`)**:
   - 跨切分近重复污染：0 违例
   - 物理样本重复：0 违例
   - 采集序列连续重叠：0 违例
   - 测试集包含非确定样本：0 违例
   - 最终判定：`leakage_passed: true` (100% PASS)。
2. **仅 Val 拟合阈值安全约束 (R608)**:
   - 决策阈值（`f1_max`, `target_fpr`）算法严格仅消费 Validation 预测。
   - Test 数据仅作为盲测集，在 Val 阈值上评测，完全禁止 Test 反向参与阈值搜索。
3. **负例与阻断测试覆盖**:
   - Train 注入异常样本 -> 触发质量阻断 (PASS)。
   - Val 单类无法拟合阈值 -> 触发 NOT_READY 阻断 (PASS)。
   - 跨 Split 发现已验证近重复 -> 触发防泄漏阻断 (PASS)。
