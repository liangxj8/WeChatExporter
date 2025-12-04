#!/bin/bash
# 启动 Python 后端服务

cd "$(dirname "$0")"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "❌ 虚拟环境不存在，请先运行 setup.sh 安装依赖"
    exit 1
fi

# 激活虚拟环境
source venv/bin/activate

# 启动服务
echo "🚀 启动 WeChatExporter Python 后端..."
python -m app.main

