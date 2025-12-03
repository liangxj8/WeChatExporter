#!/bin/bash

###############################################################################
# WeChatExporter 清理脚本
# 清理安装过程中的临时文件和依赖
###############################################################################

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}WeChatExporter 清理脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo -e "${YELLOW}此脚本将清理以下内容:${NC}"
echo "  - development/node_modules/"
echo "  - development/package-lock.json"
echo "  - nwjs/"
echo "  - nwjs-*.zip"
echo ""

read -p "确认清理? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}取消清理${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}开始清理...${NC}"

# 清理 node_modules
if [ -d "${PROJECT_ROOT}/development/node_modules" ]; then
    echo "清理 node_modules..."
    rm -rf "${PROJECT_ROOT}/development/node_modules"
    echo -e "${GREEN}✓ node_modules 已删除${NC}"
fi

# 清理 package-lock.json
if [ -f "${PROJECT_ROOT}/development/package-lock.json" ]; then
    echo "清理 package-lock.json..."
    rm -f "${PROJECT_ROOT}/development/package-lock.json"
    echo -e "${GREEN}✓ package-lock.json 已删除${NC}"
fi

# 清理 nwjs
if [ -d "${PROJECT_ROOT}/nwjs" ]; then
    echo "清理 nwjs..."
    rm -rf "${PROJECT_ROOT}/nwjs"
    echo -e "${GREEN}✓ nwjs 目录已删除${NC}"
fi

# 清理下载的压缩包
if ls "${PROJECT_ROOT}"/nwjs-*.zip 1> /dev/null 2>&1; then
    echo "清理 nwjs 压缩包..."
    rm -f "${PROJECT_ROOT}"/nwjs-*.zip
    echo -e "${GREEN}✓ nwjs 压缩包已删除${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 清理完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "现在可以重新运行配置脚本:"
echo -e "${GREEN}./scripts/setup.sh${NC}"
echo ""

