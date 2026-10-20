# MLLM 服务契约

模型连接与请求实现以 [VlmClient](../../python/iad_core/workbench/vision.py) 为准。部署地址与认证保存在本地环境配置，不写入仓库。

服务须支持真实多图 `/tokenize` 容量预检，并允许随后对相同图像调用 `/v1/chat/completions`。预检必须计入视觉 token，不能仅计算文字长度。

结构化解码须支持[分析契约](../../python/iad_core/advisory/analysis.py)生成的 JSON Schema，包括判别联合 `oneOf` 与分支内必填字段。知识技能、联合审计与实际定位契约的原生验收入口为[验证脚本](../../apps/iad-harness/scripts/verify-knowledge-skills.js)。

vLLM 的 tokenize 渲染路径需要独立于生成请求的多模态发送缓存。官方修复为 [PR #38545](https://github.com/vllm-project/vllm/pull/38545)，合并提交 `5a2d420c175653c05ff9273bbda95eb23cdb4155`。部署应包含该修复；仅重启仍会在后续预检时再次触发未修复路径。

无法立即升级时，可在 vLLM 启动参数中设置 `--mm-processor-cache-gb 0` 并重启，禁用这层预处理缓存。该参数定义见[官方配置](https://github.com/vllm-project/vllm/blob/v0.18.0/vllm/config/multimodal.py)；重复图像会重新预处理。它不改变联合输入的图像与分析契约。

验收使用[公开知识流程的真实模型测试](../../tests/test_dataset_knowledge.py)：加载本地环境后，显式设置 `IAD_RUN_LIVE_MLLM=1`，运行 `test_live_normal_mining_survives_multimodal_capacity_preflight`。测试只生成合成部件图并使用临时数据库；仅验证传输、结构与持久化，不代表工业缺陷准确率。

多块大 Mask 的联合输入验收见[真实大图知识测试](../../tests/test_knowledge_capacity.py)中的 `test_live_tiled_mask_knowledge_uses_real_joint_evidence`，使用相同显式开关。实际容量判定与证据分组由 [FindingVerification](../../python/iad_core/knowledge/findings.py)负责。
