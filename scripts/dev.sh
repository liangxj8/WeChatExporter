#!/bin/bash

# 开发模式启动脚本 - 同时启动 Python 后端和前端

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}"
echo "======================================"
echo "  WeChatExporter 2.0 开发模式启动"
echo "  Python 后端 + React 前端"
echo "======================================"
echo -e "${NC}"

# 检查 Python
check_python() {
    echo -e "${YELLOW}检查 Python 环境...${NC}"
    
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}错误: 未找到 python3${NC}"
        echo "请安装 Python 3.9+"
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    echo -e "${GREEN}✓ Python ${PYTHON_VERSION}${NC}"
}

# 检查 Node.js
check_node() {
    echo -e "${YELLOW}检查 Node.js 环境...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: 未找到 Node.js${NC}"
        echo "请安装 Node.js 16+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"
}

# 检查后端依赖
check_backend_deps() {
    echo -e "${YELLOW}检查后端依赖...${NC}"
    
    if [ ! -d "${PROJECT_ROOT}/backend/venv" ]; then
        echo "后端虚拟环境未创建，正在创建..."
        cd "${PROJECT_ROOT}/backend" && ./setup.sh
    fi
    
    echo -e "${GREEN}✓ 后端依赖已就绪${NC}"
}

# 检查前端依赖
check_frontend_deps() {
    echo -e "${YELLOW}检查前端依赖...${NC}"
    
    if [ ! -d "${PROJECT_ROOT}/frontend/node_modules" ]; then
        echo "前端依赖未安装，正在安装..."
        cd "${PROJECT_ROOT}/frontend" && npm install
    fi
    
    echo -e "${GREEN}✓ 前端依赖已就绪${NC}"
}

# 启动后端
start_backend() {
    echo -e "${YELLOW}启动 Python 后端服务...${NC}"
    cd "${PROJECT_ROOT}/backend"
    source venv/bin/activate
    python -m app.main &
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
    check_python
    check_node
    echo ""
    check_backend_deps
    check_frontend_deps
    echo ""
    start_backend
    sleep 3
    start_frontend
    
    echo ""
    echo -e "${BLUE}======================================"
    echo "  服务已启动"
    echo "======================================"
    echo -e "后端 API: ${GREEN}http://localhost:3000${NC}"
    echo -e "API 文档: ${GREEN}http://localhost:3000/docs${NC}"
    echo -e "前端界面: ${GREEN}http://localhost:5173${NC}"
    echo ""
    echo -e "按 ${YELLOW}Ctrl+C${NC} 停止服务"
    echo -e "${BLUE}======================================${NC}"
    echo ""
    
    # 等待
    wait
}

main
