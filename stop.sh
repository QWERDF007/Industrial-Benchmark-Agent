#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "正在停止 Industrial Benchmark Agent 相关服务..."

# 1. 根据 PID 停止 Domain Server
if [ -f runs/domain_server.pid ]; then
    PID=$(cat runs/domain_server.pid)
    if kill -0 "$PID" 2>/dev/null; then
        echo "停止 Domain Server (PID: $PID)..."
        kill "$PID" 2>/dev/null || true
    fi
    rm -f runs/domain_server.pid
fi

# 2. 根据 PID 停止 DSH Web
if [ -f runs/dsh_web.pid ]; then
    PID=$(cat runs/dsh_web.pid)
    if kill -0 "$PID" 2>/dev/null; then
        echo "停止 DeepSeek Harness Web (PID: $PID)..."
        kill "$PID" 2>/dev/null || true
    fi
    rm -f runs/dsh_web.pid
fi

# 3. 兜底按端口释放 8000 与 5173
for PORT in 8000 5173; do
    PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo "清理占用端口 :$PORT 的残留进程 ($PIDS)..."
        kill -9 $PIDS 2>/dev/null || true
    fi
done

echo "全部服务已停止！"
