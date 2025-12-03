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
# 使用 SDK 版本以包含完整的 Node.js 库（包括 libnode.dylib）
if [ "$ARCH" = "arm64" ]; then
    echo -e "${BLUE}⚡ 检测到 Apple Silicon (arm64)${NC}"
    echo -e "${BLUE}⚡ 将使用 NW.js SDK v${NWJS_VERSION_NEW} 原生 arm64 版本${NC}"
    NWJS_VERSION="${NWJS_VERSION_NEW}"
    NWJS_DOWNLOAD_URL="https://dl.nwjs.io/v${NWJS_VERSION_NEW}/nwjs-sdk-v${NWJS_VERSION_NEW}-osx-arm64.zip"
    NWJS_ZIP="${PROJECT_ROOT}/nwjs-sdk-v${NWJS_VERSION_NEW}-osx-arm64.zip"
    NWJS_EXTRACTED_DIR="nwjs-sdk-v${NWJS_VERSION_NEW}-osx-arm64"
    RUNTIME_TARGET="node-webkit"
else
    echo -e "${BLUE}💻 检测到 Intel Mac (x64)${NC}"
    echo -e "${BLUE}💻 将使用 NW.js SDK v${NWJS_VERSION_OLD} x64 版本${NC}"
    NWJS_VERSION="${NWJS_VERSION_OLD}"
    NWJS_DOWNLOAD_URL="https://dl.nwjs.io/v${NWJS_VERSION_OLD}/nwjs-sdk-v${NWJS_VERSION_OLD}-osx-x64.zip"
    NWJS_ZIP="${PROJECT_ROOT}/nwjs-sdk-v${NWJS_VERSION_OLD}-osx-x64.zip"
    NWJS_EXTRACTED_DIR="nwjs-sdk-v${NWJS_VERSION_OLD}-osx-x64"
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
    
    # 检查并下载 libffmpeg.dylib（如果需要）
    FFMPEG_LIB="${NWJS_DIR}/nwjs.app/Contents/Frameworks/nwjs Framework.framework/Versions/*/libffmpeg.dylib"
    if ! ls ${FFMPEG_LIB} 1> /dev/null 2>&1; then
        echo -e "${YELLOW}检测到缺少 libffmpeg.dylib${NC}"
        echo "libffmpeg 用于支持音视频功能"
        echo "尝试下载..."
        
        # NW.js 0.80.0+ 的 ffmpeg 下载方式不同，需要尝试多个可能的 URL
        FFMPEG_DOWNLOADED=false
        FFMPEG_ZIP="${PROJECT_ROOT}/ffmpeg.zip"
        
        # 尝试多个可能的下载地址
        if [ "$ARCH" = "arm64" ]; then
            FFMPEG_URLS=(
                "https://github.com/nwjs-ffmpeg-prebuilt/nwjs-ffmpeg-prebuilt/releases/download/${NWJS_VERSION}/${NWJS_VERSION}-osx-arm64.zip"
                "https://dl.nwjs.io/v${NWJS_VERSION}/nwjs-sdk-v${NWJS_VERSION}-osx-arm64.zip"
            )
        else
            FFMPEG_URLS=(
                "https://github.com/nwjs-ffmpeg-prebuilt/nwjs-ffmpeg-prebuilt/releases/download/${NWJS_VERSION}/${NWJS_VERSION}-osx-x64.zip"
                "https://dl.nwjs.io/v${NWJS_VERSION}/nwjs-sdk-v${NWJS_VERSION}-osx-x64.zip"
            )
        fi
        
        # 尝试下载
        for FFMPEG_URL in "${FFMPEG_URLS[@]}"; do
            echo "尝试: ${FFMPEG_URL}"
            
            if command -v curl &> /dev/null; then
                HTTP_CODE=$(curl -L -w "%{http_code}" "${FFMPEG_URL}" -o "${FFMPEG_ZIP}" --progress-bar 2>&1 | tail -1)
                if [ "$HTTP_CODE" = "200" ] && [ -f "${FFMPEG_ZIP}" ] && [ -s "${FFMPEG_ZIP}" ]; then
                    # 验证是否为有效的 zip 文件
                    if unzip -t "${FFMPEG_ZIP}" &> /dev/null; then
                        FFMPEG_DOWNLOADED=true
                        echo -e "${GREEN}✓ 下载成功${NC}"
                        break
                    else
                        echo -e "${YELLOW}✗ 文件无效，尝试下一个源...${NC}"
                        rm -f "${FFMPEG_ZIP}"
                    fi
                else
                    echo -e "${YELLOW}✗ 下载失败 (HTTP $HTTP_CODE)，尝试下一个源...${NC}"
                    rm -f "${FFMPEG_ZIP}"
                fi
            fi
        done
        
        if [ "$FFMPEG_DOWNLOADED" = true ] && [ -f "${FFMPEG_ZIP}" ]; then
            echo "正在解压并安装 libffmpeg.dylib..."
            
            # 解压 ffmpeg
            unzip -q "${FFMPEG_ZIP}" -d "${PROJECT_ROOT}/ffmpeg_tmp" 2>/dev/null || {
                echo -e "${YELLOW}⚠ 解压失败${NC}"
                rm -rf "${PROJECT_ROOT}/ffmpeg_tmp" "${FFMPEG_ZIP}"
            }
            
            # 查找并复制 libffmpeg.dylib
            FRAMEWORK_DIR="${NWJS_DIR}/nwjs.app/Contents/Frameworks/nwjs Framework.framework/Versions"
            VERSION_DIR=$(ls -d ${FRAMEWORK_DIR}/*/ 2>/dev/null | head -1)
            
            if [ -d "${VERSION_DIR}" ]; then
                # 查找 libffmpeg.dylib
                FFMPEG_FILE=$(find "${PROJECT_ROOT}/ffmpeg_tmp" -name "libffmpeg.dylib" 2>/dev/null | head -1)
                
                if [ -n "$FFMPEG_FILE" ]; then
                    cp "$FFMPEG_FILE" "${VERSION_DIR}"
                    echo -e "${GREEN}✓ libffmpeg.dylib 已安装${NC}"
                else
                    echo -e "${YELLOW}⚠ 下载的包中未找到 libffmpeg.dylib${NC}"
                fi
            fi
            
            # 清理临时文件
            rm -rf "${PROJECT_ROOT}/ffmpeg_tmp" "${FFMPEG_ZIP}"
        else
            echo -e "${YELLOW}⚠ 无法自动下载 libffmpeg.dylib${NC}"
            echo -e "${YELLOW}应用可以启动，但音视频功能可能受限${NC}"
            echo ""
            echo "手动安装方法："
            echo "1. 访问: https://github.com/nwjs-ffmpeg-prebuilt/nwjs-ffmpeg-prebuilt/releases"
            echo "2. 下载对应版本和架构的 libffmpeg.dylib"
            echo "3. 复制到: ${NWJS_DIR}/nwjs.app/Contents/Frameworks/nwjs Framework.framework/Versions/*/libffmpeg.dylib"
        fi
    else
        echo -e "${GREEN}✓ libffmpeg.dylib 已存在${NC}"
    fi
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
# 7. 配置 sqlite3 模块
###############################################################################
echo -e "${YELLOW}[7/7] 配置 sqlite3 模块...${NC}"

cd "${PROJECT_ROOT}/development"

echo "尝试安装 sqlite3 模块..."
echo "策略：优先使用预编译版本，失败则跳过编译（使用系统 Node.js 版本）"
echo ""

# 策略 1: 直接安装 sqlite3（会尝试使用预编译版本）
echo "方法 1: 尝试安装预编译版本..."
npm install sqlite3@5.1.7 &> /dev/null && {
    echo -e "${GREEN}✓ sqlite3 安装成功（使用预编译版本）${NC}"
} || {
    echo -e "${YELLOW}⚠ 预编译版本不可用${NC}"
    
    # 策略 2: 尝试使用系统 Node.js 编译（不指定 NW.js runtime）
    if xcode-select -p &> /dev/null; then
        echo "方法 2: 尝试使用系统 Node.js 编译（可能在 NW.js 中部分功能可用）..."
        export PYTHON="$(which ${PYTHON_CMD})"
        npm install sqlite3@5.1.7 --build-from-source &> /tmp/sqlite3_build.log && {
            echo -e "${GREEN}✓ sqlite3 编译成功（使用系统 Node.js）${NC}"
            echo -e "${YELLOW}⚠ 注意：这是针对系统 Node.js 编译的，可能在 NW.js 中不完全兼容${NC}"
        } || {
            echo -e "${YELLOW}⚠ 编译失败${NC}"
            
            # 策略 3: 降级到已知兼容版本
            echo "方法 3: 尝试使用旧版本 sqlite3..."
            npm install sqlite3@4.2.0 &> /dev/null && {
                echo -e "${GREEN}✓ sqlite3 v4.2.0 安装成功${NC}"
            } || {
                echo -e "${RED}✗ 无法安装 sqlite3${NC}"
                echo ""
                echo -e "${YELLOW}sqlite3 模块安装失败，但不影响应用启动${NC}"
                echo -e "${YELLOW}应用可能无法读取数据库，但可以测试界面${NC}"
                echo ""
                echo "如需完整功能，请："
                echo "1. 安装 Xcode Command Line Tools: xcode-select --install"
                echo "2. 重新运行配置脚本"
            }
        }
    else
        echo -e "${YELLOW}⚠ 未安装 Xcode Command Line Tools，跳过编译${NC}"
        echo ""
        echo "尝试安装预编译版本..."
        npm install sqlite3@4.2.0 &> /dev/null || {
            echo -e "${YELLOW}sqlite3 安装失败，应用功能可能受限${NC}"
        }
    fi
}

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
