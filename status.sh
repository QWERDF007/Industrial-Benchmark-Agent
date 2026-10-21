#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
fi

LAN_IP=$(hostname -I | awk '{print $1}')
[ -z "$LAN_IP" ] && LAN_IP="127.0.0.1"
PORT="${PORT:-5173}"

echo "================ 服务运行状态 ================"
# 端口 (DSH Web Host)
if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[OK] DeepSeek Harness 原生工作台正在运行: http://${LAN_IP}:${PORT}"
else
    echo "[DOWN] DeepSeek Harness 原生工作台未运行 (端口 ${PORT})"
fi

# 检查是否残留其他端口
for OTHER_PORT in 5173 8001 8000; do
    if [ "$OTHER_PORT" != "$PORT" ] && lsof -Pi :$OTHER_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "[INFO] 检测到其他端口 :$OTHER_PORT 正在运行。"
    fi
done
echo "============================================="
