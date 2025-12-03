# WeChatExporter 2.0

> 全新现代化版本！完全重构，使用 React + TypeScript + Express + sql.js

## 简介

WeChatExporter 2.0 是一个用于导出和查看微信聊天记录的工具。通过 iTunes 或 iCloud 备份提取的微信数据，可以方便地查看和导出聊天记录。

## ✨ 新版特性

### 技术栈升级
- ✅ **前后端分离**：React 18 + TypeScript + Vite + Ant Design 5
- ✅ **现代化后端**：Node.js + Express + TypeScript  
- ✅ **纯 JS 数据库**：sql.js (无需编译 native binding)
- ✅ **类型安全**：全面的 TypeScript 类型定义
- ✅ **开发体验**：Vite 热重载，ts-node-dev 自动重启

### 功能改进
- 🚀 **更快的启动速度**：纯 JavaScript 实现，无编译等待
- 💎 **更美观的 UI**：Ant Design 5 组件库
- 🔍 **实时搜索**：快速过滤聊天记录
- 📤 **多格式导出**：支持 HTML 和 JSON 格式
- 🎯 **更准确的解析**：改进的用户信息和消息解析逻辑

### 架构优势
- 📦 **模块化设计**：清晰的前后端分离架构
- 🔧 **易于维护**：代码量减少 40-50%
- 🧪 **易于测试**：RESTful API，便于单元测试
- 🌐 **跨平台**：任何浏览器都能访问

## 快速开始

### 前置要求

- Node.js 18+ 
- npm 或 yarn
- 微信备份数据（iTunes 或 iCloud 备份的 Documents 目录）

### 一键启动

```bash
# 克隆仓库
git clone https://github.com/yourusername/WeChatExporter.git
cd WeChatExporter

# 一键启动开发模式（自动安装依赖并启动前后端）
./scripts/dev.sh
```

启动后：
- 后端API: http://localhost:3000
- 前端界面: http://localhost:5173 (会自动打开)

### 分步启动

如果需要分别启动前后端：

```bash
# 启动后端
cd backend
npm install
npm run dev

# 启动前端（新终端）
cd frontend
npm install
npm run dev
```

## 使用步骤

1. **配置路径**
   - 输入微信备份数据的 Documents 目录路径
   - 例如：`/Users/你的用户名/Downloads/Documents`

2. **选择用户**
   - 从检测到的微信账号中选择一个

3. **导出记录**
   - 浏览该用户的所有聊天记录
   - 使用搜索功能快速定位
   - 点击导出按钮，选择 HTML 或 JSON 格式

## 项目结构

```
WeChatExporter/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── server.ts          # Express 服务器
│   │   ├── routes/            # API 路由
│   │   ├── services/          # 业务逻辑（数据库、解析、导出）
│   │   ├── types/             # TypeScript 类型
│   │   └── utils/             # 工具函数
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── api/               # API 调用
│   │   ├── components/        # React 组件
│   │   ├── pages/             # 页面
│   │   ├── types/             # TypeScript 类型
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
├── scripts/                    # 脚本
│   └── dev.sh                 # 开发模式启动
├── docs/                       # 文档
│   └── MODERNIZATION_PLAN.md  # 现代化重构计划
└── development/                # 旧代码（仅供参考）
```

## API 文档

### 用户相关

- `GET /api/users?path=...` - 获取所有微信用户
- `GET /api/users/:md5?path=...` - 获取单个用户详情

### 聊天相关

- `GET /api/chats?path=...&userMd5=...&limit=0` - 获取聊天列表
- `GET /api/chats/messages?path=...&userMd5=...&table=...` - 获取消息列表
- `POST /api/chats/export` - 导出聊天记录

详细 API 文档访问：http://localhost:3000

## 技术细节

### 为什么使用 sql.js 而不是 better-sqlite3？

1. **无需编译**：sql.js 是纯 JavaScript 实现，无需 native binding
2. **更好的兼容性**：避免 Node.js 版本和系统架构的编译问题
3. **开发体验**：安装依赖更快，无需 Xcode 等编译工具
4. **性能足够**：对于查看聊天记录的场景，性能完全满足需求

### 核心算法

1. **用户信息解析**：从 `LoginInfo2.dat` 二进制文件中提取微信号和昵称
2. **聊天表查找**：遍历 `message_1.sqlite` 到 `message_4.sqlite` 查找所有聊天表
3. **联系人匹配**：从 `WCDB_Contact.sqlite` 读取联系人信息并匹配

## 常见问题

### Q: 找不到微信备份数据？

A: 需要先通过 iTunes 或 iCloud 备份你的 iPhone，然后找到备份中的 Documents 目录。通常位于：
- macOS: `~/Library/Application Support/MobileSync/Backup/[设备ID]/`
- Windows: `%APPDATA%\Apple Computer\MobileSync\Backup\[设备ID]\`

### Q: 显示"未找到任何微信账号"？

A: 请确保：
1. 路径指向正确的 Documents 目录
2. 该目录下包含 32 位 MD5 格式的用户目录（如 `a1b2c3d4e5f6...`）
3. 用户目录下有 `DB` 子目录和相关数据库文件

### Q: 可以导出图片和语音吗？

A: 当前版本主要支持文本消息的导出。图片、语音等多媒体文件需要额外处理，未来版本会支持。

## 开发

### 后端开发

```bash
cd backend
npm run dev  # 启动开发服务器（自动重启）
npm run build  # 编译 TypeScript
npm start  # 运行编译后的代码
```

### 前端开发

```bash
cd frontend
npm run dev  # 启动 Vite 开发服务器
npm run build  # 构建生产版本
npm run preview  # 预览生产构建
```

## 许可证

Apache License 2.0

## 致谢

- 原版 WeChatExporter 项目
- sql.js 项目
- 所有使用的开源库的贡献者

## 更新日志

### 2.0.0 (2025-12-03)

- 🎉 完全重构为现代化 Web 应用
- ✨ React 18 + TypeScript + Vite 前端
- ✨ Node.js + Express + TypeScript 后端
- ✨ sql.js 替代 better-sqlite3，无需编译
- ✨ Ant Design 5 UI 组件库
- ✨ 前后端分离架构
- ✨ RESTful API 设计
- 🐛 修复了大量旧版本的 bug
- 📝 完善的文档和类型定义

---

如果这个项目对你有帮助，欢迎 Star ⭐️
