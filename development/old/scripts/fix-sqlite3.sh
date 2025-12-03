#!/bin/bash
#
# sqlite3 Native Binding 快速修复脚本
# 用于为 NW.js 重新编译 sqlite3 模块
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"
DEV_DIR="${PROJECT_ROOT}/development"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}sqlite3 Native Binding 修复脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检测架构
ARCH=$(uname -m)
echo "系统架构: ${ARCH}"

# 获取 NW.js 版本
if [ ! -f "${DEV_DIR}/package.json" ]; then
    echo -e "${RED}错误: 未找到 package.json${NC}"
    exit 1
fi

NWJS_VERSION=$(grep -o '"nwVersion": "[^"]*"' "${DEV_DIR}/package.json" | cut -d'"' -f4)
echo "NW.js 版本: ${NWJS_VERSION}"
echo ""

# 检测 Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    echo "Python 版本: ${PYTHON_VERSION}"
else
    echo -e "${RED}错误: 未找到 python3${NC}"
    exit 1
fi

export PYTHON="$(which ${PYTHON_CMD})"

cd "${DEV_DIR}"

echo ""
echo -e "${YELLOW}开始修复 sqlite3...${NC}"
echo ""

# 清理旧的编译文件
echo "清理旧的编译文件..."
rm -rf node_modules/sqlite3/build
rm -rf node_modules/sqlite3/lib/binding
echo -e "${GREEN}✓ 清理完成${NC}"
echo ""

# 安装 nw-gyp
echo "确保 nw-gyp 已安装..."
if ! command -v nw-gyp &> /dev/null; then
    npm install -g nw-gyp &> /dev/null || {
        echo -e "${YELLOW}⚠ 全局安装失败，使用本地版本${NC}"
        npm install nw-gyp &> /dev/null
    }
fi
echo -e "${GREEN}✓ nw-gyp 已就绪${NC}"
echo ""

# 确保 sqlite3 已安装
if [ ! -d "node_modules/sqlite3" ]; then
    echo "sqlite3 模块未安装，先安装..."
    npm install sqlite3@5.1.7 &> /dev/null
fi

# 方法 1: 使用 nw-gyp 直接编译
echo -e "${YELLOW}方法 1: 使用 nw-gyp 为 NW.js 编译...${NC}"

cd node_modules/sqlite3

# 配置编译参数
cat > .nwrc << EOF
{
  "runtime": "node-webkit",
  "target": "${NWJS_VERSION}",
  "target_arch": "${ARCH}",
  "dist-url": "https://dl.nwjs.io"
}
EOF

# 使用 nw-gyp 编译
if command -v nw-gyp &> /dev/null; then
    nw-gyp configure --target=${NWJS_VERSION} --arch=${ARCH} 2>&1 | tee /tmp/sqlite3_configure.log
    nw-gyp build 2>&1 | tee /tmp/sqlite3_build.log
    
    # 检查编译结果
    if [ -f "build/Release/node_sqlite3.node" ]; then
        # 创建正确的目录结构
        BINDING_DIR="lib/binding/nw-v${NWJS_VERSION}-darwin-${ARCH}"
        mkdir -p "${BINDING_DIR}"
        cp build/Release/node_sqlite3.node "${BINDING_DIR}/"
        
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}✓ sqlite3 编译成功！${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo "Binding 文件位置:"
        echo "  ${BINDING_DIR}/node_sqlite3.node"
        echo ""
        cd "${DEV_DIR}"
        echo "现在可以重新启动应用："
        echo -e "  ${GREEN}./scripts/run.sh${NC}"
        echo ""
        exit 0
    fi
fi

cd "${DEV_DIR}"
echo -e "${YELLOW}⚠ 方法 1 失败（nw-gyp 不可用或编译失败）${NC}"
echo ""

# 方法 2: 使用环境变量配置 npm rebuild
echo -e "${YELLOW}方法 2: 使用环境变量配置编译...${NC}"

cd node_modules/sqlite3

export npm_config_runtime="node-webkit"
export npm_config_target="${NWJS_VERSION}"
export npm_config_target_arch="${ARCH}"
export npm_config_disturl="https://dl.nwjs.io"
export npm_config_build_from_source="true"

npm rebuild 2>&1 | tee /tmp/sqlite3_rebuild.log

# 检查编译结果
if [ -f "build/Release/node_sqlite3.node" ]; then
    BINDING_DIR="lib/binding/nw-v${NWJS_VERSION}-darwin-${ARCH}"
    mkdir -p "${BINDING_DIR}"
    cp build/Release/node_sqlite3.node "${BINDING_DIR}/"
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ sqlite3 编译成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Binding 文件位置:"
    echo "  ${BINDING_DIR}/node_sqlite3.node"
    echo ""
    cd "${DEV_DIR}"
    echo "现在可以重新启动应用："
    echo -e "  ${GREEN}./scripts/run.sh${NC}"
    echo ""
    exit 0
fi

cd "${DEV_DIR}"
echo -e "${YELLOW}⚠ 方法 2 失败${NC}"
echo ""

# 所有方法都失败
echo -e "${RED}========================================${NC}"
echo -e "${RED}✗ sqlite3 编译失败${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo "可能的原因："
echo "1. 缺少 Xcode Command Line Tools"
echo "2. NW.js headers 下载失败"
echo "3. 编译工具链问题"
echo ""
echo "查看详细日志："
echo "  cat /tmp/sqlite3_fix_method1.log"
echo "  cat /tmp/sqlite3_fix_method2.log"
echo ""
echo "建议："
echo "1. 确保已安装 Xcode Command Line Tools:"
echo "   xcode-select --install"
echo ""
echo "2. 检查网络连接（需要下载 NW.js headers）"
echo ""
echo "3. 尝试降级到旧版本 NW.js（v0.40.1 有预编译的 binding）"
echo ""

exit 1

