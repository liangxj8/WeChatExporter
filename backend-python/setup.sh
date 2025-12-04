#!/bin/bash
# 安装 Python 后端依赖

cd "$(dirname "$0")"

echo "📦 安装 WeChatExporter Python 后端依赖..."

# 检查 Python 版本
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 未安装，请先安装 Python 3.10+"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✅ 检测到 Python $PYTHON_VERSION"

# 创建虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 升级 pip
echo "📦 升级 pip..."
pip install --upgrade pip

# 安装依赖
echo "📦 安装依赖包..."
pip install -r requirements.txt

# 创建 .env 文件
if [ ! -f ".env" ]; then
    echo "📝 创建 .env 配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件，配置 OpenAI API Key 等参数"
fi

echo "✅ 安装完成！"
echo ""
echo "运行命令："
echo "  ./run.sh          # 启动服务"
echo "  source venv/bin/activate  # 激活虚拟环境"

