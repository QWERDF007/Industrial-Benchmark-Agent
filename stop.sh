#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
fi

PORT="${PORT:-5173}"

echo "正在停止 Industrial Benchmark Agent 相关服务..."

# 1. 根据 PID 停止 DSH Web
if [ -f runs/dsh_web.pid ]; then
    PID=$(cat runs/dsh_web.pid)
    if kill -0 "$PID" 2>/dev/null; then
        echo "停止 DeepSeek Harness Web (PID: $PID)..."
        kill "$PID" 2>/dev/null || true
    fi
    rm -f runs/dsh_web.pid
fi

# 2. 清理残留端口 (当前端口、5173、8001、8000)
for P in "$PORT" 5173 8001 8000; do
    PIDS=$(lsof -ti :$P 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo "清理占用端口 :$P 的残留进程 ($PIDS)..."
        kill -9 $PIDS 2>/dev/null || true
    fi
done

echo "服务已停止！"
