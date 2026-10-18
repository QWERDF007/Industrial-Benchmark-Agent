# 运行与验收环境报告 (V2 Acceptance Environment)

- **Base Commit**: `ef857dfc3420beffb82c9b1a73ddcd0c9907209b` (Branch: `dev`)
- **Python**: `Python 3.10.14` (`/data1/yuneng/conda_env/new_envs/anomalib_env/bin/python3.10`)
- **Node.js**: `v20.18.2`
- **pnpm**: `10.4.1`
- **TypeScript Plugin Bundle**: `@industrial-benchmark/iad-harness@0.5.0`
- **GPU Hardware**: 4x NVIDIA GeForce RTX 3090 (24,576 MiB VRAM each)
- **FastAPI / Uvicorn Domain Server**: Port 8000 (Loopback only: `http://127.0.0.1:8000`)
- **Verification Commands Executed**:
  - `pnpm -C apps/iad-harness run build`: Exit 0 (tsc compilation clean)
  - `pnpm -C apps/iad-harness run test`: 8/8 passed (0 failed)
  - `PYTHONPATH=python python3.10 -m pytest tests/test_tool_contracts.py`: 90/90 passed (0 failed)
  - `PYTHONPATH=python python3.10 -m pytest tests/`: 222/222 passed (0 failed)
