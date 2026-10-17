# Feature Foundation Report: mock_task_01

> 本报告由 Industrial AD Benchmark Agent (Step 2 Feature Foundation) 自动生成。

## 1. 基础配置 (Configuration)

- **Task ID**: `mock_task_01`
- **Model ID**: `mock_vit_768`
- **Preprocess Key**: `mock_224`
- **Embedding Dimension**: `768`
- **Embedding Storage Dtype**: `fp16`
- **Database**: `/tmp/tmptbjnaceb/test_benchmark.db`

## 2. 推理与缓存统计 (Inference & Cache)

| 统计项 | 统计值 | 说明 |
|---|---:|---|
| **总样本量 (Total Samples)** | 56 | 任务内所有样本 |
| 缓存命中 (Cache Hits) | 0 | 现有特征缓存有效且源文件未修改 |
| 新计算特征 (Computed) | 56 | 本次新执行 GPU 推理的样本数 |
| 失败样本数 (Failed) | 0 | 文件不存在或无法解码的样本数 |
| **特征覆盖率 (Coverage)** | **100.00%** | (缓存 + 新计算) / 总样本 |

## 3. 性能与存储开销 (Performance & Storage)

| 指标 | 测量值 | 说明 |
|---|---:|---|
| 运行耗时 (Elapsed Time) | 0.04 s | 批推理及数据库入库全流程耗时 |
| 吞吐速度 (Throughput) | 1529.2 samples/s | 平均每秒处理样本数 |
| 存储占用 (Storage Bytes) | 0.08 MB (86,016 B) | SQLite `feature_records` BLOB 字节总大小 |

---
**说明**: Step 2 遵循幂等与无损设计。源文件未改变时二次运行 `computed == 0`，且不自动修改质量标签、不自动删除文件。
