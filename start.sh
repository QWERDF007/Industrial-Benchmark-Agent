#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
fi

LAN_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LAN_IP" ]; then
    LAN_IP="127.0.0.1"
fi

PORT="${PORT:-5173}"

# 避免本地请求走局域网 HTTP 代理
export no_proxy="localhost,127.0.0.1,${LAN_IP},${no_proxy:-}"
export NO_PROXY="$no_proxy"

echo "========================================================"
echo "  Industrial Benchmark Agent - DSH 原生工作台启动器"
echo "  单宿主进程架构 (DS-S01): 纯 DSH Web (Port ${PORT})"
echo "  局域网主机 IP: ${LAN_IP}"
echo "========================================================"

# 1. 查找并配置 Python 3.12 (iad_agent) 环境
PYTHON_EXEC="${IAD_PYTHON_PATH:-}"
if [ -n "$PYTHON_EXEC" ]; then
    if [ ! -x "$PYTHON_EXEC" ]; then
        echo "IAD_PYTHON_PATH 不是可执行的 Python 路径: ${PYTHON_EXEC}" >&2
        exit 1
    fi
elif [ -x "/home/dell/anaconda3/envs/iad_agent/bin/python" ]; then
    PYTHON_EXEC="/home/dell/anaconda3/envs/iad_agent/bin/python"
elif command -v conda >/dev/null 2>&1 && [ -x "$(conda info --base)/envs/iad_agent/bin/python" ]; then
    PYTHON_EXEC="$(conda info --base)/envs/iad_agent/bin/python"
elif [ -x "$(which python3.12 2>/dev/null)" ]; then
    PYTHON_EXEC="$(which python3.12)"
elif [ -x "$(which python3.10 2>/dev/null)" ]; then
    PYTHON_EXEC="$(which python3.10)"
else
    PYTHON_EXEC="python"
fi
export IAD_PYTHON_PATH="${PYTHON_EXEC}"

# 查找 Node.js (推荐 v22+)
NODE_EXEC="${IAD_NODE_PATH:-}"
if [ -n "$NODE_EXEC" ]; then
    if [ ! -x "$NODE_EXEC" ]; then
        echo "IAD_NODE_PATH 不是可执行的 Node 路径: ${NODE_EXEC}" >&2
        exit 1
    fi
elif [ -x "/home/dell/.local/node-v24.22.0/bin/node" ]; then
    NODE_EXEC="/home/dell/.local/node-v24.22.0/bin/node"
elif [ -x "/home/dell/anaconda3/envs/iad_agent/bin/node" ]; then
    NODE_EXEC="/home/dell/anaconda3/envs/iad_agent/bin/node"
elif [ -x "/home/dell/.local/bin/node" ]; then
    NODE_EXEC="/home/dell/.local/bin/node"
else
    NODE_EXEC="node"
fi
NODE_EXEC="$(command -v "$NODE_EXEC")"
export IAD_NODE_PATH="$NODE_EXEC"
export PATH="$(dirname "$NODE_EXEC"):$PATH"

echo "[1/2] Python 环境: ${PYTHON_EXEC} ($(${PYTHON_EXEC} --version 2>&1))"
echo "      Node.js 环境: ${NODE_EXEC} ($(${NODE_EXEC} --version 2>&1))"

mkdir -p runs

# 2. 编译 TypeScript 与 DSH Client Bundle
echo "[2/2] 正在构建 DSH Native 双端插件 Bundle..."
pnpm -C apps/iad-harness run build

# 3. 启动 DeepSeek Harness Native Web 交互端 (Node.js ${PORT})
if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[!] 提示: ${PORT} 端口已有进程在运行，跳过启动。"
else
    echo "      正在启动 DeepSeek Harness Web 端 (0.0.0.0:${PORT})..."
    mkdir -p "${HOME}/.dsh/profiles/web/node_modules/@industrial-benchmark"
    ln -sfn "${SCRIPT_DIR}/apps/iad-harness" "${HOME}/.dsh/profiles/web/node_modules/@industrial-benchmark/iad-harness"
    setsid "${NODE_EXEC}" "${SCRIPT_DIR}/node_modules/@deepseek-ai/dsh/lib/bin.js" \
        --profile web \
        --patch "${SCRIPT_DIR}/config/dsh_web_lan_patch.yml" \
        --port "${PORT}" --no-open > runs/dsh_web.log 2>&1 < /dev/null &
    DSH_PID=$!
    echo $DSH_PID > runs/dsh_web.pid
    echo "      DeepSeek Harness Web PID: ${DSH_PID}"
fi

# 等待 Web 端启动
for i in {1..30}; do
    if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
        break
    fi
    sleep 0.5
done

# 获取登录认证 URL
DSH_URL=""
if [ -f runs/dsh_web.log ]; then
    DSH_URL=$(grep -o "LAN: http://[^\)]*" runs/dsh_web.log | tail -n 1 | sed 's/LAN: //')
fi
if [ -z "$DSH_URL" ]; then
    DSH_URL="http://${LAN_IP}:${PORT}"
fi

echo ""
echo "========================================================"
echo "  服务启动完成！可通过局域网任意设备访问："
echo "  - DSH 原生工业审计工作台:    ${DSH_URL}"
echo "========================================================"
echo "  日志文件:"
echo "  - Harness Web 日志: runs/dsh_web.log"
echo "  停止服务请执行: ./stop.sh"
echo "========================================================"
