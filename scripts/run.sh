#!/bin/bash

###############################################################################
# WeChatExporter 运行脚本
# 此脚本用于启动 WeChatExporter 应用
###############################################################################

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NWJS_DIR="${PROJECT_ROOT}/nwjs"
NWJS_EXECUTABLE="${NWJS_DIR}/nwjs.app/Contents/MacOS/nwjs"
APP_DIR="${PROJECT_ROOT}/development"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}启动 WeChatExporter${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

###############################################################################
# 检查 NW.js 是否已安装
###############################################################################
if [ ! -f "${NWJS_EXECUTABLE}" ]; then
    echo -e "${RED}错误: 未找到 NW.js${NC}"
    echo -e "${YELLOW}请先运行环境配置脚本: ./scripts/setup.sh${NC}"
    echo ""
    
    # 检查系统是否安装了 nw
    if command -v nw &> /dev/null; then
        echo -e "${YELLOW}检测到系统已安装 nw 命令${NC}"
        echo -e "${YELLOW}正在使用系统的 nw 启动...${NC}"
        echo ""
        cd "${APP_DIR}"
        nw .
        exit 0
    elif command -v nwjs &> /dev/null; then
        echo -e "${YELLOW}检测到系统已安装 nwjs 命令${NC}"
        echo -e "${YELLOW}正在使用系统的 nwjs 启动...${NC}"
        echo ""
        cd "${APP_DIR}"
        nwjs .
        exit 0
    fi
    
    exit 1
fi

###############################################################################
# 检查应用目录
###############################################################################
if [ ! -d "${APP_DIR}" ]; then
    echo -e "${RED}错误: 未找到应用目录 ${APP_DIR}${NC}"
    exit 1
fi

if [ ! -f "${APP_DIR}/package.json" ]; then
    echo -e "${RED}错误: 未找到 package.json${NC}"
    exit 1
fi

###############################################################################
# 检查依赖
###############################################################################
if [ ! -d "${APP_DIR}/node_modules" ]; then
    echo -e "${YELLOW}警告: 未找到 node_modules 目录${NC}"
    echo -e "${YELLOW}请先运行环境配置脚本: ./scripts/setup.sh${NC}"
    echo ""
    read -p "是否现在安装依赖? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "${APP_DIR}"
        npm install
    else
        exit 1
    fi
fi

###############################################################################
# 启动应用
###############################################################################
echo -e "${GREEN}启动应用...${NC}"
echo "NW.js: ${NWJS_EXECUTABLE}"
echo "应用目录: ${APP_DIR}"
echo ""

"${NWJS_EXECUTABLE}" "${APP_DIR}"

