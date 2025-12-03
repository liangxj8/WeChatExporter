#!/bin/bash

###############################################################################
# 手动安装 libffmpeg.dylib
# 用于修复 "Library not loaded: libffmpeg.dylib" 错误
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NWJS_DIR="${PROJECT_ROOT}/nwjs"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}libffmpeg.dylib 安装脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查 NW.js 是否存在
if [ ! -d "${NWJS_DIR}" ]; then
    echo -e "${RED}错误: 未找到 NW.js 目录${NC}"
    echo "请先运行: ./scripts/setup.sh"
    exit 1
fi

# 查找 Framework 版本目录
FRAMEWORK_DIR="${NWJS_DIR}/nwjs.app/Contents/Frameworks/nwjs Framework.framework/Versions"
if [ ! -d "${FRAMEWORK_DIR}" ]; then
    echo -e "${RED}错误: 未找到 NW.js Framework 目录${NC}"
    exit 1
fi

# 查找版本号目录（例如 117.0.5938.63）
VERSION_DIR=""
for dir in "${FRAMEWORK_DIR}"/*; do
    if [ -d "$dir" ] && [[ $(basename "$dir") =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        VERSION_DIR="$dir"
        break
    fi
done

# 如果没找到，尝试使用 Current 符号链接
if [ -z "${VERSION_DIR}" ] && [ -L "${FRAMEWORK_DIR}/Current" ]; then
    VERSION_DIR="${FRAMEWORK_DIR}/Current"
fi

if [ -z "${VERSION_DIR}" ]; then
    echo -e "${RED}错误: 未找到 NW.js 版本目录${NC}"
    echo "Framework 目录: ${FRAMEWORK_DIR}"
    echo ""
    echo "请检查目录内容:"
    ls -la "${FRAMEWORK_DIR}" 2>/dev/null || echo "无法访问该目录"
    exit 1
fi

echo "NW.js Framework 版本目录: ${VERSION_DIR}"
echo ""

# 检查当前状态
if [ -f "${VERSION_DIR}/libffmpeg.dylib" ]; then
    echo -e "${GREEN}✓ libffmpeg.dylib 已存在${NC}"
    ls -lh "${VERSION_DIR}/libffmpeg.dylib"
    exit 0
fi

echo -e "${YELLOW}libffmpeg.dylib 不存在，开始安装...${NC}"
echo ""

# 检测架构
ARCH=$(uname -m)
echo "系统架构: ${ARCH}"

# 尝试从 GitHub nwjs-ffmpeg-prebuilt 下载
echo ""
echo -e "${BLUE}尝试方案 1: 从 GitHub nwjs-ffmpeg-prebuilt 下载${NC}"

if [ "$ARCH" = "arm64" ]; then
    DOWNLOAD_URL="https://github.com/nwjs-ffmpeg-prebuilt/nwjs-ffmpeg-prebuilt/releases/download/0.80.0/0.80.0-osx-arm64.zip"
else
    DOWNLOAD_URL="https://github.com/nwjs-ffmpeg-prebuilt/nwjs-ffmpeg-prebuilt/releases/download/0.80.0/0.80.0-osx-x64.zip"
fi

echo "下载地址: ${DOWNLOAD_URL}"

TEMP_ZIP="${PROJECT_ROOT}/temp_ffmpeg.zip"
TEMP_DIR="${PROJECT_ROOT}/temp_ffmpeg"

# 下载
if curl -L "${DOWNLOAD_URL}" -o "${TEMP_ZIP}" --progress-bar --fail; then
    echo -e "${GREEN}✓ 下载成功${NC}"
    
    # 验证
    if unzip -t "${TEMP_ZIP}" &> /dev/null; then
        echo -e "${GREEN}✓ 文件验证通过${NC}"
        
        # 解压
        mkdir -p "${TEMP_DIR}"
        unzip -q "${TEMP_ZIP}" -d "${TEMP_DIR}"
        
        # 查找并复制
        FFMPEG_FILE=$(find "${TEMP_DIR}" -name "libffmpeg.dylib" 2>/dev/null | head -1)
        
        if [ -n "$FFMPEG_FILE" ]; then
            cp "$FFMPEG_FILE" "${VERSION_DIR}/"
            echo -e "${GREEN}✓ libffmpeg.dylib 已安装${NC}"
            ls -lh "${VERSION_DIR}/libffmpeg.dylib"
            
            # 清理
            rm -rf "${TEMP_ZIP}" "${TEMP_DIR}"
            
            echo ""
            echo -e "${GREEN}========================================${NC}"
            echo -e "${GREEN}✓ 安装成功！${NC}"
            echo -e "${GREEN}========================================${NC}"
            echo ""
            echo "现在可以启动应用了:"
            echo -e "${GREEN}./scripts/run.sh${NC}"
            exit 0
        else
            echo -e "${RED}✗ 未找到 libffmpeg.dylib${NC}"
        fi
    else
        echo -e "${RED}✗ 文件验证失败${NC}"
    fi
    
    # 清理失败的下载
    rm -rf "${TEMP_ZIP}" "${TEMP_DIR}"
else
    echo -e "${RED}✗ 下载失败${NC}"
fi

# 如果自动下载失败，提供手动方案
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}自动安装失败，请手动安装${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "步骤 1: 下载 libffmpeg.dylib"
echo ""
echo "访问以下网址之一:"
echo ""
echo "  GitHub:"
if [ "$ARCH" = "arm64" ]; then
    echo "  https://github.com/nwjs-ffmpeg-prebuilt/nwjs-ffmpeg-prebuilt/releases/tag/0.80.0"
    echo "  下载: 0.80.0-osx-arm64.zip"
else
    echo "  https://github.com/nwjs-ffmpeg-prebuilt/nwjs-ffmpeg-prebuilt/releases/tag/0.80.0"
    echo "  下载: 0.80.0-osx-x64.zip"
fi
echo ""
echo "步骤 2: 解压下载的文件，找到 libffmpeg.dylib"
echo ""
echo "步骤 3: 复制到以下位置:"
echo "  ${VERSION_DIR}"
echo ""
echo "步骤 4: 运行应用"
echo "  ./scripts/run.sh"
echo ""

exit 1

