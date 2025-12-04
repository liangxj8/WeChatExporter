#!/bin/bash

###############################################################################
# WeChatExporter 2.0 环境配置脚本
# 自动安装 Python 后端和前端的所有依赖
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}"
echo "=========================================="
echo "  WeChatExporter 2.0 环境配置"
echo "  Python 后端 + React 前端"
echo "=========================================="
echo -e "${NC}"
echo ""

###############################################################################
# 1. 检查系统要求
###############################################################################
echo -e "${BLUE}[1/4] 检查系统要求${NC}"

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}错误: 未找到 Python 3${NC}"
    echo "请安装 Python 3.9+"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo -e "${GREEN}✓ Python ${PYTHON_VERSION}${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js${NC}"
    echo "请安装 Node.js 16+"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"

echo ""

###############################################################################
# 2. 安装后端依赖
###############################################################################
echo -e "${BLUE}[2/4] 安装 Python 后端依赖${NC}"
cd "${PROJECT_ROOT}/backend"

if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

echo "激活虚拟环境..."
source venv/bin/activate

echo "升级 pip..."
pip install --upgrade pip -q

echo "安装依赖包..."
pip install -r requirements.txt

# 创建 .env 文件
if [ ! -f ".env" ]; then
    echo "创建 .env 配置文件..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  请编辑 backend/.env 文件，配置 OpenAI API Key（可选）${NC}"
fi

echo -e "${GREEN}✓ 后端依赖安装完成${NC}"
echo ""

###############################################################################
# 3. 安装前端依赖
###############################################################################
echo -e "${BLUE}[3/4] 安装前端依赖${NC}"
cd "${PROJECT_ROOT}/frontend"

echo "安装 npm 包..."
npm install

echo -e "${GREEN}✓ 前端依赖安装完成${NC}"
echo ""

###############################################################################
# 4. 完成
###############################################################################
echo -e "${BLUE}[4/4] 配置完成${NC}"
echo ""
echo -e "${GREEN}=========================================="
echo "  ✓ 环境配置完成！"
echo "==========================================${NC}"
echo ""
echo "运行命令："
echo -e "  ${YELLOW}./scripts/dev.sh${NC}          # 启动开发模式（前后端）"
echo -e "  ${YELLOW}cd backend && ./run.sh${NC}   # 仅启动后端"
echo -e "  ${YELLOW}cd frontend && npm run dev${NC} # 仅启动前端"
echo ""
echo "访问地址："
echo -e "  前端: ${GREEN}http://localhost:5173${NC}"
echo -e "  后端 API: ${GREEN}http://localhost:3000${NC}"
echo -e "  API 文档: ${GREEN}http://localhost:3000/docs${NC}"
echo ""
