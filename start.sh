#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LAN_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LAN_IP" ]; then
    LAN_IP="127.0.0.1"
fi

# 避免本地请求走局域网 HTTP 代理
export no_proxy="localhost,127.0.0.1,${LAN_IP},${no_proxy:-}"
export NO_PROXY="$no_proxy"

echo "========================================================"
echo "  Industrial Benchmark Agent - 服务启动器"
echo "  局域网主机 IP: ${LAN_IP}"
echo "========================================================"

# 1. 查找并配置 Python 3.12 (iad_agent) 环境
PYTHON_EXEC=""
if [ -x "/home/dell/anaconda3/envs/iad_agent/bin/python" ]; then
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

# 查找 Node.js (推荐 v22+)
NODE_EXEC=""
if [ -x "/home/dell/.local/node-v24.22.0/bin/node" ]; then
    NODE_EXEC="/home/dell/.local/node-v24.22.0/bin/node"
elif [ -x "/home/dell/anaconda3/envs/iad_agent/bin/node" ]; then
    NODE_EXEC="/home/dell/anaconda3/envs/iad_agent/bin/node"
elif [ -x "/home/dell/.local/bin/node" ]; then
    NODE_EXEC="/home/dell/.local/bin/node"
else
    NODE_EXEC="node"
fi

echo "[1/3] Python 环境: ${PYTHON_EXEC} ($(${PYTHON_EXEC} --version 2>&1))"
echo "      Node.js 环境: ${NODE_EXEC} ($(${NODE_EXEC} --version 2>&1))"

mkdir -p runs

# 2. 检查并启动 Python Domain Server (FastAPI)
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[!] 提示: 8000 端口已有进程在运行，跳过启动 Domain Server。"
else
    echo "[2/3] 正在启动 Domain Server (0.0.0.0:8000)..."
    setsid "${PYTHON_EXEC}" -m iad_domain_server.main > runs/domain_server.log 2>&1 < /dev/null &
    DOMAIN_PID=$!
    echo $DOMAIN_PID > runs/domain_server.pid
    echo "      Domain Server PID: ${DOMAIN_PID}"
fi

# 等待 Domain Server 启动并验证健康状态
for i in {1..30}; do
    if curl --noproxy "*" -s http://127.0.0.1:8000/health >/dev/null 2>&1; then
        echo "      Domain Server 健康检查通过！"
        break
    fi
    sleep 0.5
done

# 3. 启动 DeepSeek Harness Web 交互端 (Node.js)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[!] 提示: 5173 端口已有进程在运行，跳过启动 Harness Web。"
else
    echo "[3/3] 正在启动 DeepSeek Harness Web 端 (0.0.0.0:5173)..."
    setsid "${NODE_EXEC}" "${SCRIPT_DIR}/node_modules/@deepseek-ai/dsh/lib/bin.js" \
        --profile web \
        --patch "${SCRIPT_DIR}/config/dsh_web_lan_patch.yml" \
        --port 5173 --no-open > runs/dsh_web.log 2>&1 < /dev/null &
    DSH_PID=$!
    echo $DSH_PID > runs/dsh_web.pid
    echo "      DeepSeek Harness Web PID: ${DSH_PID}"
fi

# 等待 Web 端启动
for i in {1..30}; do
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
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
    DSH_URL="http://${LAN_IP}:5173"
fi

echo ""
echo "========================================================"
echo "  服务启动完成！可通过局域网任意设备访问："
echo "  - Web 质检看板与交互控制台:  ${DSH_URL}"
echo "  - 领域核心服务 API:          http://${LAN_IP}:8000"
echo "  - API 交互式文档 (Swagger):  http://${LAN_IP}:8000/docs"
echo "========================================================"
echo "  日志文件:"
echo "  - Domain Server 日志: runs/domain_server.log"
echo "  - Harness Web 日志:   runs/dsh_web.log"
echo "  停止服务请执行: ./stop.sh"
echo "========================================================"
