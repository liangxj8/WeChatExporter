# WeChatExporter 2.0

> 微信聊天记录导出工具 - 全新 Python 后端版本！

<div align="center">

**功能强大 · 数据分析 · AI 加持 · 现代化架构**

</div>

## ✨ 特性

### 🎯 核心功能
- ✅ **用户管理** - 自动识别和解析微信账号
- ✅ **聊天列表** - 按时间排序，支持搜索
- ✅ **消息查看** - 在线查看聊天记录，无限滚动
- ✅ **日期筛选** - 按日期范围查看历史消息

### 📊 数据分析（新增）
- ✅ **聊天统计** - 消息数量、类型分布、时间趋势
- ✅ **活跃度分析** - 用户发言排名、活跃时段
- ✅ **词频统计** - 中文分词、高频词汇
- ✅ **词云生成** - 可视化聊天内容

### 🤖 AI 功能（新增）
- ✅ **内容总结** - 提取关键话题和摘要
- ✅ **情感分析** - 分析聊天情绪倾向
- ✅ **智能问答** - 基于聊天记录回答问题

### 🏗️ 技术栈
- **后端**: Python 3.9+ + FastAPI + sqlite3
- **前端**: React 18 + TypeScript + Vite + Ant Design 5
- **数据分析**: pandas + jieba + wordcloud + Chart.js
- **AI**: OpenAI API + langchain

## 🚀 快速开始

### 前置要求

- **Python 3.9+**
- **Node.js 16+**
- **微信备份数据**（iTunes 或 iCloud 备份的 Documents 目录）

### 一键安装和启动

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/WeChatExporter.git
cd WeChatExporter

# 2. 一键安装所有依赖
./scripts/setup.sh

# 3. 一键启动开发模式（前后端同时启动）
./scripts/dev.sh
```

### 手动启动

```bash
# 启动后端
cd backend
./run.sh

# 启动前端（新终端）
cd frontend
npm run dev
```

### 访问应用

- **前端界面**: http://localhost:5173
- **后端 API**: http://localhost:3000
- **API 文档**: http://localhost:3000/docs（Swagger UI）

## 📖 使用指南

### 1. 准备微信数据

需要通过 iTunes 或 iCloud 备份获取微信数据：

**iTunes 备份路径**:
- macOS: `~/Library/Application Support/MobileSync/Backup/{UDID}/AppDomain-com.tencent.xin/Documents`
- Windows: `%APPDATA%\Apple Computer\MobileSync\Backup\{UDID}\AppDomain-com.tencent.xin\Documents`

### 2. 配置路径

在 Web 界面中输入微信 Documents 目录的完整路径。

### 3. 选择账号

系统会自动扫描并显示所有微信账号，选择要查看的账号。

### 4. 查看聊天记录

- **查看消息**: 点击"查看"按钮在新窗口查看聊天记录
- **数据分析**: 点击"数据分析"按钮查看统计、词云、AI 分析

### 5. AI 功能配置（可选）

如需使用 AI 功能，需要配置 OpenAI API Key：

```bash
cd backend
cp .env.example .env
# 编辑 .env，设置 OPENAI_API_KEY=your-key-here
```

## 📁 项目结构

```
WeChatExporter/
├── backend/                    # Python 后端（FastAPI）
│   ├── app/
│   │   ├── models/            # Pydantic 数据模型
│   │   ├── routers/           # API 路由
│   │   ├── services/          # 业务逻辑
│   │   ├── utils/             # 工具函数
│   │   ├── config.py          # 配置管理
│   │   └── main.py            # 应用入口
│   ├── requirements.txt       # Python 依赖
│   ├── setup.sh              # 安装脚本
│   └── run.sh                # 启动脚本
├── frontend/                  # React 前端
│   ├── src/
│   │   ├── api/              # API 客户端
│   │   ├── components/       # React 组件
│   │   ├── pages/            # 页面组件
│   │   └── types/            # TypeScript 类型
│   └── package.json
├── scripts/                   # 脚本工具
│   ├── setup.sh              # 一键安装
│   └── dev.sh                # 一键启动
├── backend-nodejs-old/        # 旧 Node.js 后端（已弃用）
└── docs/                      # 文档

```

## 📚 文档

- [快速开始指南](docs/QUICKSTART.md) - 详细的安装和使用步骤
- [开发总结](docs/DEVELOPMENT_SUMMARY.md) - Python 后端重写技术细节
- [iOS 备份说明](docs/IOS_BACKUP_LIMITATIONS.md) - 备份相关问题和解决方案
- [后端 API 文档](backend/README.md) - Python 后端详细文档
- [脚本工具文档](scripts/README.md) - 启动和安装脚本说明

## 🎯 功能对比

| 功能 | v1.0 (NW.js) | v2.0 (Web) |
|------|--------------|-----------|
| 基础聊天记录查看 | ✅ | ✅ |
| 用户信息解析 | ✅ | ✅ |
| HTML 导出 | ✅ | ✅ |
| 数据统计 | ❌ | ✅ |
| 词云生成 | ❌ | ✅ |
| 活跃度分析 | ❌ | ✅ |
| AI 内容总结 | ❌ | ✅ |
| 情感分析 | ❌ | ✅ |
| 智能问答 | ❌ | ✅ |
| 跨平台 | 部分 | 完全 |
| 安装简便性 | 复杂 | 简单 |

## 🔧 开发

### 后端开发

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 3000
```

### 前端开发

```bash
cd frontend
npm run dev
```

### 构建生产版本

```bash
# 前端
cd frontend
npm run build

# 后端直接运行（无需构建）
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 3000 --workers 4
```

## 🐛 故障排查

### 后端无法启动
- 检查 Python 版本 >= 3.9
- 运行 `./setup.sh` 安装依赖
- 查看错误日志

### 前端无法连接后端
- 确保后端已启动（http://localhost:3000/health）
- 检查浏览器控制台错误

### 词云生成失败
- 检查是否有文本消息
- 确保字体文件存在（自动使用系统字体）

### AI 功能报错
- 需要配置 `OPENAI_API_KEY`
- 可以不使用 AI 功能，基础功能和数据分析仍可正常使用

## 📜 License

MIT License

## 🙏 致谢

- 原项目灵感来源于微信聊天记录导出需求
- 感谢开源社区提供的优秀工具和库

---

**版本**: 2.0.0  
**最后更新**: 2025-12-04  
**后端**: Python + FastAPI  
**前端**: React + TypeScript
