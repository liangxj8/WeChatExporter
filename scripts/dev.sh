#!/bin/bash

# 开发模式启动脚本 - 同时启动前后端

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}"
echo "======================================"
echo "  WeChatExporter 开发模式启动"
echo "======================================"
echo -e "${NC}"

# 检查依赖
check_deps() {
    echo -e "${YELLOW}检查依赖...${NC}"
    
    if [ ! -d "${PROJECT_ROOT}/backend/node_modules" ]; then
        echo "后端依赖未安装，正在安装..."
        cd "${PROJECT_ROOT}/backend" && npm install
    fi
    
    if [ ! -d "${PROJECT_ROOT}/frontend/node_modules" ]; then
        echo "前端依赖未安装，正在安装..."
        cd "${PROJECT_ROOT}/frontend" && npm install
    fi
    
    echo -e "${GREEN}✓ 依赖检查完成${NC}"
}

# 启动后端
start_backend() {
    echo -e "${YELLOW}启动后端服务...${NC}"
    cd "${PROJECT_ROOT}/backend"
    npm run dev &
    BACKEND_PID=$!
    echo -e "${GREEN}✓ 后端服务已启动 (PID: $BACKEND_PID)${NC}"
}

# 启动前端
start_frontend() {
    echo -e "${YELLOW}启动前端服务...${NC}"
    cd "${PROJECT_ROOT}/frontend"
    npm run dev &
    FRONTEND_PID=$!
    echo -e "${GREEN}✓ 前端服务已启动 (PID: $FRONTEND_PID)${NC}"
}

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}正在停止服务...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}服务已停止${NC}"
    exit 0
}

# 捕获中断信号
trap cleanup INT TERM

# 主流程
main() {
    check_deps
    echo ""
    start_backend
    sleep 2
    start_frontend
    
    echo ""
    echo -e "${BLUE}======================================"
    echo "  服务已启动"
    echo "======================================"
    echo -e "后端: ${GREEN}http://localhost:3000${NC}"
    echo -e "前端: ${GREEN}http://localhost:5173${NC}"
    echo ""
    echo -e "按 ${YELLOW}Ctrl+C${NC} 停止服务"
    echo -e "${BLUE}======================================${NC}"
    echo ""
    
    # 等待
    wait
}

main

