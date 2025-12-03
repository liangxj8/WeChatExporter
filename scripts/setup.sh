#!/bin/bash

###############################################################################
# WeChatExporter 环境配置脚本
# 支持 Apple Silicon (arm64) 和 Intel (x64) 原生运行
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# NW.js 版本配置
# v0.40.1 - 原版本（仅支持 x64）
# v0.80.0 - 新版本（原生支持 arm64 和 x64）
NWJS_VERSION_OLD="0.40.1"  # Intel Mac 使用
NWJS_VERSION_NEW="0.80.0"  # Apple Silicon 使用

NWJS_DIR="${PROJECT_ROOT}/nwjs"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}WeChatExporter 环境配置脚本${NC}"
echo -e "${GREEN}支持 Apple Silicon 原生运行${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

###############################################################################
# 1. 检测系统环境
###############################################################################
echo -e "${YELLOW}[1/7] 检测系统环境...${NC}"

if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}错误: 此脚本仅支持 macOS 系统${NC}"
    exit 1
fi

OS_VERSION=$(sw_vers -productVersion)
ARCH=$(uname -m)
echo -e "${GREEN}✓ 操作系统: macOS ${OS_VERSION}${NC}"
echo -e "${GREEN}✓ 架构: ${ARCH}${NC}"

# 根据架构选择 NW.js 版本和下载地址
if [ "$ARCH" = "arm64" ]; then
    echo -e "${BLUE}⚡ 检测到 Apple Silicon (arm64)${NC}"
    echo -e "${BLUE}⚡ 将使用 NW.js v${NWJS_VERSION_NEW} 原生 arm64 版本${NC}"
    NWJS_VERSION="${NWJS_VERSION_NEW}"
    NWJS_DOWNLOAD_URL="https://dl.nwjs.io/v${NWJS_VERSION_NEW}/nwjs-v${NWJS_VERSION_NEW}-osx-arm64.zip"
    NWJS_ZIP="${PROJECT_ROOT}/nwjs-v${NWJS_VERSION_NEW}-osx-arm64.zip"
    NWJS_EXTRACTED_DIR="nwjs-v${NWJS_VERSION_NEW}-osx-arm64"
    RUNTIME_TARGET="node-webkit"
else
    echo -e "${BLUE}💻 检测到 Intel Mac (x64)${NC}"
    echo -e "${BLUE}💻 将使用 NW.js v${NWJS_VERSION_OLD} x64 版本${NC}"
    NWJS_VERSION="${NWJS_VERSION_OLD}"
    NWJS_DOWNLOAD_URL="https://dl.nwjs.io/v${NWJS_VERSION_OLD}/nwjs-v${NWJS_VERSION_OLD}-osx-x64.zip"
    NWJS_ZIP="${PROJECT_ROOT}/nwjs-v${NWJS_VERSION_OLD}-osx-x64.zip"
    NWJS_EXTRACTED_DIR="nwjs-v${NWJS_VERSION_OLD}-osx-x64"
    RUNTIME_TARGET="node-webkit"
fi
echo ""

###############################################################################
# 2. 检测 Python
###############################################################################
echo -e "${YELLOW}[2/7] 检测 Python...${NC}"

if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    echo -e "${GREEN}✓ 找到 python3 命令${NC}"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    echo -e "${GREEN}✓ 找到 python 命令${NC}"
else
    echo -e "${RED}✗ 未检测到 Python${NC}"
    echo -e "${YELLOW}请安装 Python 3:${NC}"
    echo "  brew install python3"
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1)
echo -e "${GREEN}✓ Python 版本: ${PYTHON_VERSION}${NC}"
echo ""

###############################################################################
# 3. 检测 Node.js
###############################################################################
echo -e "${YELLOW}[3/7] 检测 Node.js...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ 未检测到 Node.js${NC}"
    echo -e "${YELLOW}请先安装 Node.js:${NC}"
    echo "  方式1: brew install node"
    echo "  方式2: 从官网下载 https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')

echo -e "${GREEN}✓ Node.js 版本: ${NODE_VERSION}${NC}"
echo -e "${GREEN}✓ npm 版本: ${NPM_VERSION}${NC}"

if [ "$NODE_MAJOR_VERSION" -lt 16 ]; then
    echo -e "${YELLOW}⚠ Node.js 版本较旧，建议升级到 v16 或更高版本以获得更好的 Apple Silicon 支持${NC}"
fi
echo ""

###############################################################################
# 4. 下载 NW.js
###############################################################################
echo -e "${YELLOW}[4/7] 下载 NW.js v${NWJS_VERSION}...${NC}"

if [ -d "${NWJS_DIR}" ]; then
    echo -e "${GREEN}✓ NW.js 已存在，跳过下载${NC}"
else
    if [ -f "${NWJS_ZIP}" ]; then
        echo -e "${YELLOW}发现已下载的压缩包，跳过下载步骤${NC}"
    else
        echo "架构: ${ARCH}"
        echo "下载地址: ${NWJS_DOWNLOAD_URL}"
        echo "这可能需要几分钟，请耐心等待..."
        if command -v curl &> /dev/null; then
            curl -L "${NWJS_DOWNLOAD_URL}" -o "${NWJS_ZIP}" --progress-bar
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
    mv "${PROJECT_ROOT}/${NWJS_EXTRACTED_DIR}" "${NWJS_DIR}"
    
    # 清理下载的压缩包
    rm "${NWJS_ZIP}"
    echo -e "${GREEN}✓ 解压完成${NC}"
fi
echo ""

###############################################################################
# 5. 更新 package.json 中的 NW.js 版本
###############################################################################
echo -e "${YELLOW}[5/7] 更新项目配置...${NC}"

PACKAGE_JSON="${PROJECT_ROOT}/development/package.json"
if [ -f "${PACKAGE_JSON}" ]; then
    # 备份原文件
    cp "${PACKAGE_JSON}" "${PACKAGE_JSON}.bak"
    
    # 使用 node 更新 nwVersion
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('${PACKAGE_JSON}', 'utf8'));
    if (pkg.build) {
        pkg.build.nwVersion = '${NWJS_VERSION}';
    }
    fs.writeFileSync('${PACKAGE_JSON}', JSON.stringify(pkg, null, 2));
    "
    
    echo -e "${GREEN}✓ 已更新 package.json 中的 NW.js 版本为 v${NWJS_VERSION}${NC}"
else
    echo -e "${YELLOW}⚠ 未找到 package.json${NC}"
fi
echo ""

###############################################################################
# 6. 安装项目依赖（跳过 sqlite3）
###############################################################################
echo -e "${YELLOW}[6/7] 安装项目依赖...${NC}"

cd "${PROJECT_ROOT}/development"

if [ -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules 已存在，是否重新安装? (y/N)${NC}"
    read -r -t 10 response || response="n"
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        rm -rf node_modules package-lock.json
        npm install --ignore-scripts
    else
        echo -e "${GREEN}✓ 跳过 npm install${NC}"
    fi
else
    # 先安装依赖，但跳过编译脚本
    echo "安装依赖包（跳过编译脚本）..."
    npm install --ignore-scripts
fi
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

###############################################################################
# 7. 编译 sqlite3 模块
###############################################################################
echo -e "${YELLOW}[7/7] 配置 sqlite3 模块...${NC}"

# 检查是否安装了 Xcode Command Line Tools
if ! xcode-select -p &> /dev/null; then
    echo -e "${RED}错误: 未安装 Xcode Command Line Tools${NC}"
    echo "请运行: xcode-select --install"
    exit 1
fi

# 设置编译环境变量（使用完整路径）
export PYTHON="$(which ${PYTHON_CMD})"

echo "编译 sqlite3 模块（针对 NW.js v${NWJS_VERSION}）..."
echo "使用 Python: ${PYTHON}"
echo "这可能需要几分钟，请耐心等待..."
echo ""

cd "${PROJECT_ROOT}/development"

# 根据架构选择编译目标
if [ "$ARCH" = "arm64" ]; then
    TARGET_ARCH="arm64"
else
    TARGET_ARCH="x64"
fi

# 编译 sqlite3
echo "编译参数:"
echo "  - Runtime: ${RUNTIME_TARGET}"
echo "  - Target Arch: ${TARGET_ARCH}"
echo "  - NW.js Version: ${NWJS_VERSION}"
echo ""

npm install sqlite3@latest --build-from-source \
    --runtime=${RUNTIME_TARGET} \
    --target_arch=${TARGET_ARCH} \
    --target=${NWJS_VERSION} || {
    echo -e "${YELLOW}⚠ 使用最新版 sqlite3 编译失败，尝试使用 v5.x...${NC}"
    npm install sqlite3@5 --build-from-source \
        --runtime=${RUNTIME_TARGET} \
        --target_arch=${TARGET_ARCH} \
        --target=${NWJS_VERSION} || {
        echo -e "${RED}✗ sqlite3 编译失败${NC}"
        echo -e "${YELLOW}请确保已安装 Xcode Command Line Tools: xcode-select --install${NC}"
        exit 1
    }
}

echo -e "${GREEN}✓ sqlite3 编译完成${NC}"
echo ""

###############################################################################
# 配置完成
###############################################################################

NWJS_EXECUTABLE="${NWJS_DIR}/nwjs.app/Contents/MacOS/nwjs"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 环境配置完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "系统信息:"
echo "  架构: ${ARCH}"
echo "  NW.js: v${NWJS_VERSION}"
echo "  Node.js: ${NODE_VERSION}"
echo "  Python: ${PYTHON_VERSION}"
echo ""

if [ "$ARCH" = "arm64" ]; then
    echo -e "${BLUE}⚡ Apple Silicon 原生运行模式${NC}"
    echo "  - NW.js: arm64 原生版本"
    echo "  - sqlite3: arm64 原生编译"
    echo "  - 无需 Rosetta 2"
    echo ""
fi

echo "运行应用程序的方式:"
echo -e "  1. 使用运行脚本: ${GREEN}./scripts/run.sh${NC}"
echo -e "  2. 直接运行: ${GREEN}${NWJS_EXECUTABLE} ${PROJECT_ROOT}/development${NC}"
echo ""
echo "NW.js 安装位置: ${NWJS_DIR}"
echo ""
