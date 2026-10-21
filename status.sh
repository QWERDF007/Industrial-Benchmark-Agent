#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAN_IP=$(hostname -I | awk '{print $1}')
[ -z "$LAN_IP" ] && LAN_IP="127.0.0.1"
PORT="${PORT:-8001}"

echo "================ 服务运行状态 ================"
# 端口 (DSH Web Host)
if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[OK] DeepSeek Harness 原生工作台正在运行: http://${LAN_IP}:${PORT}"
else
    echo "[DOWN] DeepSeek Harness 原生工作台未运行 (端口 ${PORT})"
fi

# 检查是否残留旧端口
for OLD_PORT in 5173 8000; do
    if [ "$OLD_PORT" != "$PORT" ] && lsof -Pi :$OLD_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "[WARN] 检测到废弃端口 :$OLD_PORT 仍在运行，建议执行 ./stop.sh 进行清理。"
    fi
done
echo "============================================="
