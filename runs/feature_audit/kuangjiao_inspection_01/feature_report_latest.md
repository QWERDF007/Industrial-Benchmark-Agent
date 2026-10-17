# Feature Foundation Report: kuangjiao_inspection_01

> 本报告由 Industrial AD Benchmark Core v2 自动生成。

## 1. 基础配置 (Configuration)

- **Task ID**: `kuangjiao_inspection_01`
- **Model ID**: `dinov2_vitb14_reg`
- **Preprocess Key**: `dinov2_224_norm`
- **Embedding Dimension**: `768`
- **Embedding Storage Dtype**: `fp16`
- **Database**: `data/benchmark.db`

## 2. 推理与缓存统计 (Inference & Cache)

| 统计项 | 统计值 | 说明 |
|---|---:|---|
| **总样本量 (Total Samples)** | 5,074 | 任务内所有样本 |
| 缓存命中 (Cache Hits) | 5,074 | 现有特征缓存有效且源文件未修改 |
| 新计算特征 (Computed) | 0 | 本次新执行 GPU 推理的样本数 |
| 失败样本数 (Failed) | 0 | 文件不存在或无法解码的样本数 |
| **特征覆盖率 (Coverage)** | **100.00%** | (缓存 + 新计算) / 总样本 |

## 3. 性能与存储开销 (Performance & Storage)

| 指标 | 测量值 | 说明 |
|---|---:|---|
| 运行耗时 (Elapsed Time) | 0.34 s | 批推理及数据库入库全流程耗时 |
| 吞吐速度 (Throughput) | 14772.7 samples/s | 平均每秒处理样本数 |
| 存储占用 (Storage Bytes) | 7.43 MB (7,793,664 B) | SQLite `feature_records` BLOB 字节总大小 |

---
**说明**: Step 2 遵循幂等与无损设计。源文件未改变时二次运行 `computed == 0`，不修改质量标签、不删除文件。
