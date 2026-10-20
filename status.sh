#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAN_IP=$(hostname -I | awk '{print $1}')
[ -z "$LAN_IP" ] && LAN_IP="127.0.0.1"

echo "================ 服务运行状态 ================"
# 5173 端口 (DSH Web Host)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[OK] DeepSeek Harness 原生工作台正在运行: http://${LAN_IP}:5173"
else
    echo "[DOWN] DeepSeek Harness 原生工作台未运行"
fi

# 检查是否残留旧 8000 端口
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[WARN] 检测到废弃的 8000 端口仍在运行，建议执行 ./stop.sh 进行清理。"
fi
echo "============================================="
