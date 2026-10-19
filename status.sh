#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAN_IP=$(hostname -I | awk '{print $1}')
[ -z "$LAN_IP" ] && LAN_IP="127.0.0.1"

echo "================ 服务运行状态 ================"
# 8000 端口
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[OK] Domain Server (FastAPI) 正在运行: http://${LAN_IP}:8000"
else
    echo "[DOWN] Domain Server 未运行"
fi

# 5173 端口
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[OK] DeepSeek Harness Web 正在运行: http://${LAN_IP}:5173"
else
    echo "[DOWN] DeepSeek Harness Web 未运行"
fi
echo "============================================="
