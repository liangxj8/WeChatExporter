# WeChatExporter Python Backend

微信聊天记录导出工具 - Python 后端

## 技术栈

- **FastAPI** - 现代化 Web 框架
- **Python 3.9+** - 类型提示、更好的性能
- **sqlite3** - 读取微信数据库
- **pandas** - 数据分析
- **jieba** - 中文分词
- **wordcloud** - 词云生成
- **openai** - 大模型接入

## 功能特性

### 基础功能
- ✅ 用户管理：扫描和识别微信用户
- ✅ 聊天列表：获取所有聊天会话
- ✅ 消息查询：读取聊天记录
- ✅ HTML 渲染：在线查看聊天记录

### 数据分析功能（新增）
- 📊 聊天统计：消息数量、类型分布、时间趋势
- 👥 活跃度分析：用户发言排名、活跃时段
- 📈 词频统计：高频词汇分析
- ☁️ 词云生成：可视化聊天内容

### AI 功能（新增）
- 🤖 内容总结：提取关键话题
- 💭 情感分析：分析聊天情绪
- 💬 智能问答：基于聊天记录回答问题

## 快速开始

### 一键安装

```bash
cd backend-python
./setup.sh
```

安装脚本会自动：
- 检查 Python 版本
- 创建虚拟环境
- 安装所有依赖
- 创建 .env 配置文件

### 手动安装

如果需要手动安装，按以下步骤操作：

1. **创建虚拟环境**
```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate  # Windows
```

2. **安装依赖**
```bash
pip install -r requirements.txt
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置 OpenAI API Key 等
```

## 运行

### 快速启动

```bash
./run.sh
```

### 开发模式

```bash
source venv/bin/activate
python -m app.main
# 或
uvicorn app.main:app --reload --port 3000
```

### 生产模式

```bash
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 3000 --workers 4
```

## API 文档

启动服务后访问：

- Swagger UI: http://localhost:3000/docs
- ReDoc: http://localhost:3000/redoc

## 项目结构

```
backend-python/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 应用入口
│   ├── config.py               # 配置管理
│   ├── models/                 # Pydantic 数据模型
│   ├── routers/                # API 路由
│   ├── services/               # 业务逻辑层
│   └── utils/                  # 工具函数
├── requirements.txt            # 依赖包
├── .env.example               # 环境变量示例
├── .gitignore
└── README.md
```

## 开发进度

- [x] 项目初始化
- [x] 基础功能迁移（用户、聊天记录、消息查询）
- [x] HTML 渲染服务
- [x] 数据分析功能（统计、活跃度、词频）
- [x] 词云生成
- [x] 大模型接入（总结、情感分析、问答）
- [ ] 前端集成
- [ ] 新功能 UI 界面

## API 端点

### 用户管理
- `GET /api/users` - 获取用户列表
- `GET /api/users/{md5}` - 获取用户详情

### 聊天记录
- `GET /api/chats` - 获取聊天列表
- `GET /api/chats/messages` - 获取消息列表
- `GET /api/chats/dates` - 获取日期列表
- `GET /api/chats/view` - 在线查看 HTML 聊天记录
- `GET /api/chats/view/messages` - 无限滚动消息加载

### 数据分析（新功能）
- `GET /api/analytics/statistics` - 获取统计数据
- `GET /api/analytics/activity` - 获取活跃度分析
- `GET /api/analytics/wordfreq` - 获取词频统计
- `GET /api/analytics/wordcloud` - 生成词云图片

### AI 功能（新功能）
- `POST /api/ai/summarize` - 总结聊天内容
- `POST /api/ai/sentiment` - 情感分析
- `POST /api/ai/qa` - 智能问答

完整 API 文档：http://localhost:3000/docs

## License

MIT

