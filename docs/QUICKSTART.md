# 🚀 快速开始指南

WeChatExporter 2.0 - Python 后端 + React 前端

## ⚡️ 一键启动（推荐）

```bash
# 1. 安装所有依赖（首次运行）
./scripts/setup.sh

# 2. 启动前后端（开发模式）
./scripts/dev.sh
```

然后在浏览器打开：**http://localhost:5173** 🎉

## 📋 前提条件

### 系统要求
- **Python 3.9+**
- **Node.js 16+**
- macOS / Linux / Windows
- 8GB+ 内存推荐

### 验证版本
```bash
python3 --version  # 应显示 3.9 或更高
node --version     # 应显示 v16 或更高
```

### 微信备份数据
需要通过 iTunes 或 iCloud 备份 iPhone，并找到微信 Documents 目录。

**macOS 路径示例**:
```
~/Library/Application Support/MobileSync/Backup/{UDID}/AppDomain-com.tencent.xin/Documents
```

**Windows 路径示例**:
```
%APPDATA%\Apple Computer\MobileSync\Backup\{UDID}\AppDomain-com.tencent.xin\Documents
```

详细备份说明请参考：[IOS_BACKUP_LIMITATIONS.md](IOS_BACKUP_LIMITATIONS.md)

## 🔧 分步启动

### 方式 1：后端

```bash
cd backend

# 首次运行：安装依赖
./setup.sh

# 启动服务
./run.sh
```

后端将在 **http://localhost:3000** 启动

### 方式 2：前端

```bash
cd frontend

# 首次运行：安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 **http://localhost:5173** 启动

## 🎯 使用流程

### 1. 配置路径
在网页中输入微信 Documents 目录的完整路径

### 2. 选择账号
系统自动扫描并显示所有微信账号，点击选择要查看的账号

### 3. 浏览聊天
- **查看消息**: 点击"查看"按钮，在新窗口查看聊天记录（支持无限滚动）
- **数据分析**: 点击"数据分析"按钮，查看统计、词云、AI 分析

## ✨ 功能说明

### 📱 基础功能
- ✅ **用户管理** - 自动识别和解析微信账号
- ✅ **聊天列表** - 按时间排序、支持搜索
- ✅ **消息查看** - 在线查看、无限滚动
- ✅ **日期筛选** - 按日期范围查看历史消息

### 📊 数据分析（新增）
- 📈 **数据统计** - 消息数量、类型分布、时间趋势图表
- 👥 **活跃度分析** - 群聊用户发言排名、活跃时段
- 📝 **词频统计** - 中文分词、高频词汇分析
- ☁️ **词云生成** - 可视化聊天内容

### 🤖 AI 功能（新增，需配置）
- 🧠 **内容总结** - 提取关键话题和摘要
- 💭 **情感分析** - 分析聊天情绪倾向
- 💬 **智能问答** - 基于聊天记录回答问题

## 🔑 配置 AI 功能（可选）

AI 功能需要 OpenAI API Key：

```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，设置：
# OPENAI_API_KEY=your-api-key-here
# OPENAI_BASE_URL=https://api.openai.com/v1  # 可选，自定义 API 端点
```

**注意**: 基础功能和数据分析功能无需 API Key 即可使用。

## 📖 API 文档

后端启动后，访问 Swagger UI 查看完整 API 文档：

**http://localhost:3000/docs**

包含所有 API 的详细说明、参数、示例和在线测试功能。

## ❓ 常见问题

### 后端启动失败
```bash
cd backend
./setup.sh  # 重新安装依赖
```
检查 Python 版本：`python3 --version`

### 前端启动失败
```bash
cd frontend
npm install  # 重新安装依赖
```
检查 Node.js 版本：`node --version`

### 找不到微信数据
需要先创建 iPhone 的 iTunes/iCloud 备份。参考：[IOS_BACKUP_LIMITATIONS.md](IOS_BACKUP_LIMITATIONS.md)

### 前端无法连接后端
1. 确保后端已启动：访问 http://localhost:3000/health
2. 检查浏览器控制台错误信息
3. 确认防火墙未阻止 3000 端口

### 词云显示空白
- 确保聊天记录有足够的文本消息
- 语音、图片等非文本消息不会计入词云
- 检查后端控制台是否有错误信息

### AI 功能无法使用
- 确认已在 `backend/.env` 中配置 `OPENAI_API_KEY`
- 检查 API Key 是否有效
- 查看后端日志了解具体错误

## 🚀 开发模式

### 后端热重载
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 3000
```

### 前端热重载
```bash
cd frontend
npm run dev
```

## 📦 生产部署

### 后端
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 3000 --workers 4
```

### 前端
```bash
cd frontend
npm run build
# 将 dist/ 目录部署到 Web 服务器（nginx、apache 等）
```

## 📚 相关文档

- [README.md](../README.md) - 项目总览和功能介绍
- [DEVELOPMENT_SUMMARY.md](DEVELOPMENT_SUMMARY.md) - Python 后端开发总结
- [backend/README.md](../backend/README.md) - 后端 API 详细文档
- [IOS_BACKUP_LIMITATIONS.md](IOS_BACKUP_LIMITATIONS.md) - iOS 备份说明

## 🎉 开始使用

现在你已经准备好了！享受全新的 WeChatExporter 2.0！

---

**版本**: 2.0.0  
**技术栈**: Python 3.9+ + FastAPI + React 18 + TypeScript  
**最后更新**: 2025-12-04
