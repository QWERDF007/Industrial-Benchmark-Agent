# Industrial Benchmark Agent

工业外观数据的模型审计、人工复核、基准构建与评估工作台。以 DSH Web 为唯一宿主，TypeScript 原生插件通过 NDJSON 调用 Python 领域核心。

## 使用

```bash
pnpm install
pip install -e '.[dev]'
./start.sh
```

访问启动器输出的认证地址。运行环境和依赖声明见 [package.json](package.json)、[pyproject.toml](pyproject.toml)；启停入口为 [start.sh](start.sh)、[stop.sh](stop.sh)、[status.sh](status.sh)。

- **模型审计**：在数据集管理中填写名称、选择服务器上的图像目录和 Labelme 标注目录；在图像样本中组合筛选、调整良品参考，再启动审计。
- **人工复核**：查看复核明细并提交人工裁决。
- **插件**：保留 DSH 原生插件管理入口。

## 开发入口

- [文档索引](docs/README.md)
- [架构与源代码索引](docs/architecture.md)
- [数据集配置示例](configs/example.yaml)
- [命令行入口](python/iad_cli/main.py)
- 本地任务账本：`WORKLOG.md`

```bash
pnpm --filter @industrial-benchmark/iad-harness build
pnpm --filter @industrial-benchmark/iad-harness test
PYTHONPATH=python python -m pytest tests/
# Firefox + geckodriver，使用临时数据集与独立数据库
GECKODRIVER_PATH=/path/to/geckodriver pnpm --filter @industrial-benchmark/iad-harness test:browser
# 已启动的 DSH 原生宿主，只读验收（需支持 Intl.Segmenter 的 Firefox）
FIREFOX_PATH=/path/to/firefox GECKODRIVER_PATH=/path/to/geckodriver pnpm --filter @industrial-benchmark/iad-harness verify:host-browser
```

真实模型验证入口为 [verify_workbench_live.py](scripts/verify_workbench_live.py)，使用数据库快照，需可访问数据集目录及项目配置的 VLM。模型服务环境变量定义见 [VlmClient](python/iad_core/workbench/vision.py)。
