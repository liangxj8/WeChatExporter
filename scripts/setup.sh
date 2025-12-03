#!/bin/bash

###############################################################################
# WeChatExporter 环境配置脚本
# 此脚本将自动下载 NW.js v0.40.1 并配置项目环境
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NWJS_VERSION="0.40.1"
NWJS_DIR="${PROJECT_ROOT}/nwjs"
NWJS_DOWNLOAD_URL="https://dl.nwjs.io/v${NWJS_VERSION}/nwjs-v${NWJS_VERSION}-osx-x64.zip"
NWJS_ZIP="${PROJECT_ROOT}/nwjs-v${NWJS_VERSION}-osx-x64.zip"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}WeChatExporter 环境配置脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

###############################################################################
# 1. 检测系统环境
###############################################################################
echo -e "${YELLOW}[1/6] 检测系统环境...${NC}"

if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}错误: 此脚本仅支持 macOS 系统${NC}"
    exit 1
fi

OS_VERSION=$(sw_vers -productVersion)
ARCH=$(uname -m)
echo -e "${GREEN}✓ 操作系统: macOS ${OS_VERSION}${NC}"
echo -e "${GREEN}✓ 架构: ${ARCH}${NC}"
echo ""

###############################################################################
# 2. 检测 Node.js
###############################################################################
echo -e "${YELLOW}[2/6] 检测 Node.js...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ 未检测到 Node.js${NC}"
    echo -e "${YELLOW}请先安装 Node.js:${NC}"
    echo "  方式1: brew install node"
    echo "  方式2: 从官网下载 https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ Node.js 版本: ${NODE_VERSION}${NC}"
echo -e "${GREEN}✓ npm 版本: ${NPM_VERSION}${NC}"
echo ""

###############################################################################
# 3. 下载 NW.js
###############################################################################
echo -e "${YELLOW}[3/6] 下载 NW.js v${NWJS_VERSION}...${NC}"

if [ -d "${NWJS_DIR}" ]; then
    echo -e "${GREEN}✓ NW.js 已存在，跳过下载${NC}"
else
    if [ -f "${NWJS_ZIP}" ]; then
        echo -e "${YELLOW}发现已下载的压缩包，跳过下载步骤${NC}"
    else
        echo "下载地址: ${NWJS_DOWNLOAD_URL}"
        if command -v curl &> /dev/null; then
            curl -L "${NWJS_DOWNLOAD_URL}" -o "${NWJS_ZIP}"
        elif command -v wget &> /dev/null; then
            wget "${NWJS_DOWNLOAD_URL}" -O "${NWJS_ZIP}"
        else
            echo -e "${RED}错误: 需要 curl 或 wget 来下载文件${NC}"
            exit 1
        fi
        echo -e "${GREEN}✓ 下载完成${NC}"
    fi
    
    # 解压
    echo "正在解压..."
    unzip -q "${NWJS_ZIP}" -d "${PROJECT_ROOT}"
    mv "${PROJECT_ROOT}/nwjs-v${NWJS_VERSION}-osx-x64" "${NWJS_DIR}"
    
    # 清理下载的压缩包
    rm "${NWJS_ZIP}"
    echo -e "${GREEN}✓ 解压完成${NC}"
fi
echo ""

###############################################################################
# 4. 安装项目依赖
###############################################################################
echo -e "${YELLOW}[4/6] 安装项目依赖...${NC}"

cd "${PROJECT_ROOT}/development"

if [ -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules 已存在，是否重新安装? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        rm -rf node_modules
        npm install
    else
        echo -e "${GREEN}✓ 跳过 npm install${NC}"
    fi
else
    npm install
fi
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

###############################################################################
# 5. 配置 sqlite3 模块
###############################################################################
echo -e "${YELLOW}[5/6] 配置 sqlite3 模块...${NC}"

SQLITE3_BINDING_DIR="${PROJECT_ROOT}/development/node_modules/sqlite3/lib/binding/node-webkit-v${NWJS_VERSION}-darwin-x64"
PRECOMPILED_SQLITE3="${PROJECT_ROOT}/development/framework/node-webkit-v${NWJS_VERSION}-darwin-x64/node_sqlite3.node"

if [ -f "${PRECOMPILED_SQLITE3}" ]; then
    echo "找到预编译的 sqlite3 模块"
    mkdir -p "${SQLITE3_BINDING_DIR}"
    cp "${PRECOMPILED_SQLITE3}" "${SQLITE3_BINDING_DIR}/node_sqlite3.node"
    echo -e "${GREEN}✓ sqlite3 模块配置完成${NC}"
else
    echo -e "${YELLOW}⚠ 未找到预编译的 sqlite3 模块${NC}"
    echo -e "${YELLOW}需要手动编译，请参考 README.md 中的说明${NC}"
    echo ""
    echo "编译命令:"
    echo "npm install sqlite3 --build-from-source --runtime=node-webkit --target_arch=x64 --target=${NWJS_VERSION}"
fi
echo ""

###############################################################################
# 6. 创建启动别名（可选）
###############################################################################
echo -e "${YELLOW}[6/6] 配置完成${NC}"

NWJS_EXECUTABLE="${NWJS_DIR}/nwjs.app/Contents/MacOS/nwjs"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 环境配置完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "运行应用程序的方式:"
echo -e "  1. 使用运行脚本: ${GREEN}./scripts/run.sh${NC}"
echo -e "  2. 直接运行: ${GREEN}${NWJS_EXECUTABLE} ${PROJECT_ROOT}/development${NC}"
echo ""
echo "NW.js 安装位置: ${NWJS_DIR}"
echo ""

