# WeChatExporter 完全现代化重构

## 技术栈

**完全废弃**
- ❌ AngularJS 1.6
- ❌ sqlite3 (native binding)
- ❌ Bootstrap 3
- ❌ jQuery
- ❌ 回调风格代码

**全新技术栈**

**后端**
- ✅ Node.js + Express
- ✅ TypeScript
- ✅ better-sqlite3 (同步 SQLite API)
- ✅ RESTful API

**前端**
- ✅ React 18 + TypeScript
- ✅ Vite (快速构建)
- ✅ Ant Design 5 (UI 组件库)
- ✅ Axios (HTTP 客户端)

**通用**
- ✅ 现代化代码风格 (async/await, ES modules)
- ✅ 前后端分离架构

## 新项目结构

```
WeChatExporter/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── server.ts          # Express 服务器入口
│   │   ├── routes/            # API 路由
│   │   │   ├── users.ts       # 用户相关 API
│   │   │   └── chats.ts       # 聊天相关 API
│   │   ├── services/          # 业务逻辑层
│   │   │   ├── database.ts    # 数据库访问
│   │   │   ├── parser.ts      # 数据解析
│   │   │   └── exporter.ts    # 导出功能
│   │   ├── types/             # TypeScript 类型
│   │   │   └── index.ts
│   │   └── utils/             # 工具函数
│   │       └── crypto.ts      # MD5 等加密
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── main.tsx           # React 入口
│   │   ├── App.tsx            # 主应用组件
│   │   ├── api/               # API 调用
│   │   │   └── client.ts      # Axios 客户端
│   │   ├── types/             # TypeScript 类型
│   │   │   └── index.ts
│   │   ├── components/        # React 组件
│   │   │   ├── UserSelect/    # 用户选择
│   │   │   ├── ChatList/      # 聊天列表
│   │   │   └── MessageView/   # 消息查看
│   │   ├── pages/             # 页面组件
│   │   │   ├── Home.tsx
│   │   │   ├── UserPage.tsx
│   │   │   └── ChatPage.tsx
│   │   └── styles/            # 样式文件
│   │       └── global.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── scripts/                    # 脚本
│   ├── dev.sh                 # 开发模式启动
│   └── start.sh               # 生产模式启动
├── docs/                       # 文档
└── development/                # 旧代码（保留参考）
    └── old/
```

## 核心改进

### 1. 数据库访问层

**旧代码 (callback hell)**
```javascript
var db = new sqlite3.Database(path, function(error) {
    db.each("SELECT * FROM table", function(error, row) {
        // 处理每一行
    }, function(error, result) {
        // 完成回调
    });
});
```

**新代码 (同步 API)**
```typescript
import Database from 'better-sqlite3';

const db = new Database(path, { readonly: true });
const rows = db.prepare("SELECT * FROM table").all();
rows.forEach(row => {
    // 处理每一行
});
db.close();
```

### 2. 用户信息解析

**核心算法保留，重写为 TypeScript**

从 `development/js/controller/chatList.js` 的 `parseLoginInfo` 函数迁移到 `src/services/parser.ts`：

```typescript
export class WeChatParser {
  parseLoginInfo(documentsPath: string): Map<string, UserInfo> {
    // 读取 LoginInfo2.dat
    // 解析微信号和昵称
    // 计算 MD5 映射
    // 返回结构化数据
  }
  
  parseContacts(db: Database): Contact[] {
    // 从 WCDB_Contact.sqlite 读取好友列表
  }
  
  parseChatTables(dbs: Database[]): ChatTable[] {
    // 从 message_*.sqlite 读取聊天表
  }
}
```

### 3. UI 现代化

**Ant Design 组件替代 Bootstrap**

- UserSelect: Card + Avatar + Typography
- ChatList: List + Badge + Search
- MessageView: Timeline + Image + Audio

## 实施步骤

### 阶段 1: 后端基础设施 (2-3 小时)

1. ✅ 备份旧代码到 `development/old/`
2. ✅ 创建 `backend/` 目录结构
3. ✅ 初始化后端 TypeScript 项目 (`package.json`, `tsconfig.json`)
4. ✅ 安装后端依赖 (express, better-sqlite3, cors, 等)
5. ✅ 创建基础 Express 服务器 (`src/server.ts`)

### 阶段 2: 后端业务逻辑 (2-3 小时)

6. ✅ 实现数据库服务 (`src/services/database.ts`)
7. ✅ 实现解析服务 (`src/services/parser.ts`)
   - 从旧代码 `development/old/js/controller/chatList.js` 迁移 `parseLoginInfo` 逻辑
8. ✅ 实现导出服务 (`src/services/exporter.ts`)
9. ✅ 创建 TypeScript 类型定义 (`src/types/index.ts`)

### 阶段 3: 后端 API 开发 (2-3 小时)

10. ✅ 实现用户 API (`src/routes/users.ts`)
    - GET /api/users - 获取所有微信用户
    - GET /api/users/:md5 - 获取用户详情
11. ✅ 实现聊天 API (`src/routes/chats.ts`)
    - GET /api/chats/:userMd5 - 获取聊天列表
    - GET /api/chats/:userMd5/:table/messages - 获取消息
    - POST /api/chats/export - 导出聊天记录
12. ✅ 添加错误处理和日志
13. ✅ 测试 API（使用 Postman 或 curl）

### 阶段 4: 前端基础设施 (1-2 小时)

14. ✅ 创建 `frontend/` 目录结构
15. ✅ 初始化 Vite + React + TypeScript 项目
16. ✅ 安装前端依赖 (antd, axios, react-router-dom, 等)
17. ✅ 配置 Vite (`vite.config.ts`)
18. ✅ 创建 API 客户端 (`src/api/client.ts`)
19. ✅ 创建 TypeScript 类型定义 (`src/types/index.ts`)

### 阶段 5: 前端组件开发 (3-4 小时)

20. ✅ 创建主应用 (`src/App.tsx`)
21. ✅ 实现用户选择页面 (`src/pages/UserPage.tsx`)
22. ✅ 实现聊天列表页面 (`src/pages/ChatPage.tsx`)
23. ✅ 实现用户选择组件 (`src/components/UserSelect/`)
24. ✅ 实现聊天列表组件 (`src/components/ChatList/`)
25. ✅ 实现消息查看组件 (`src/components/MessageView/`)
26. ✅ 配置路由（react-router-dom）

### 阶段 6: 功能集成 (2-3 小时)

27. ✅ 集成前后端
28. ✅ 实现搜索和过滤功能
29. ✅ 实现导出功能
30. ✅ 添加加载状态和错误处理
31. ✅ 添加配置页面（设置微信数据目录）

### 阶段 7: 测试和优化 (1-2 小时)

32. ✅ 使用真实数据测试
33. ✅ 修复 bug
34. ✅ 性能优化
35. ✅ UI 调整和响应式设计

### 阶段 8: 脚本和文档 (1 小时)

36. ✅ 创建 `scripts/dev.sh` (同时启动前后端开发服务器)
37. ✅ 创建 `scripts/start.sh` (生产模式启动)
38. ✅ 更新 `README.md`
39. ✅ 创建 `docs/API.md` (API 文档)
40. ✅ 创建使用文档

## 关键技术点

### 后端 API 设计

**backend/src/server.ts - Express 服务器**
```typescript
import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users';
import chatsRouter from './routes/chats';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/chats', chatsRouter);

app.listen(PORT, () => {
  console.log(`✅ 后端服务运行在 http://localhost:${PORT}`);
});
```

**backend/src/routes/users.ts - 用户 API**
```typescript
import { Router } from 'express';
import { WeChatParser } from '../services/parser';
import { WeChatDatabase } from '../services/database';

const router = Router();

// GET /api/users - 获取所有微信用户
router.get('/', async (req, res) => {
  const documentsPath = req.query.path as string;
  const parser = new WeChatParser();
  const users = parser.parseLoginInfo(documentsPath);
  res.json({ success: true, data: users });
});

// GET /api/users/:md5 - 获取单个用户详情
router.get('/:md5', async (req, res) => {
  const { md5 } = req.params;
  // ... 实现逻辑
});

export default router;
```

**backend/src/routes/chats.ts - 聊天 API**
```typescript
import { Router } from 'express';
import { WeChatDatabase } from '../services/database';

const router = Router();

// GET /api/chats/:userMd5 - 获取聊天列表
router.get('/:userMd5', async (req, res) => {
  const { userMd5 } = req.params;
  const db = new WeChatDatabase();
  const chats = db.getChatTables(userMd5);
  res.json({ success: true, data: chats });
});

// GET /api/chats/:userMd5/:table/messages - 获取消息
router.get('/:userMd5/:table/messages', async (req, res) => {
  const { userMd5, table } = req.params;
  // ... 实现逻辑
});

export default router;
```

### 前端 API 调用

**frontend/src/api/client.ts - Axios 客户端**
```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
});

export const userAPI = {
  getUsers: (documentsPath: string) =>
    client.get('/users', { params: { path: documentsPath } }),
  
  getUserDetail: (md5: string) =>
    client.get(`/users/${md5}`),
};

export const chatAPI = {
  getChats: (userMd5: string) =>
    client.get(`/chats/${userMd5}`),
  
  getMessages: (userMd5: string, table: string) =>
    client.get(`/chats/${userMd5}/${table}/messages`),
};
```

**frontend/src/pages/UserPage.tsx - 使用 API**
```typescript
import { useEffect, useState } from 'react';
import { userAPI } from '../api/client';

export const UserPage = () => {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    userAPI.getUsers('/path/to/documents')
      .then(res => setUsers(res.data.data))
      .catch(err => console.error(err));
  }, []);
  
  return (
    // ... UI 组件
  );
};
```

### 数据库访问 (后端)

**backend/src/services/database.ts - better-sqlite3**
```typescript
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export class WeChatDatabase {
  openContactDb(documentsPath: string, userMd5: string): Database.Database {
    const dbPath = path.join(documentsPath, userMd5, 'DB', 'WCDB_Contact.sqlite');
    return new Database(dbPath, { readonly: true });
  }

  getContacts(documentsPath: string, userMd5: string) {
    const db = this.openContactDb(documentsPath, userMd5);
    const contacts = db.prepare('SELECT * FROM Friend').all();
    db.close();
    return contacts;
  }

  getChatTables(documentsPath: string, userMd5: string) {
    const tables: any[] = [];
    
    // 遍历 message_1.sqlite 到 message_4.sqlite
    for (let i = 1; i <= 4; i++) {
      const dbPath = path.join(documentsPath, userMd5, 'DB', `message_${i}.sqlite`);
      if (fs.existsSync(dbPath)) {
        const db = new Database(dbPath, { readonly: true });
        const rows = db.prepare(`
          SELECT * FROM SQLITE_MASTER 
          WHERE type = 'table' 
          AND (name LIKE 'Chat/_%' ESCAPE '/' OR name LIKE 'ChatExt2/_%' ESCAPE '/')
        `).all();
        
        tables.push(...rows);
        db.close();
      }
    }
    
    return tables;
  }
}
```

## 预期收益

### 开发体验
- ⚡️ Vite 热重载，修改即刻生效
- 🔒 TypeScript 类型安全，减少 bug
- 🎨 现代编辑器支持，智能提示完善
- 📦 模块化代码，易于维护

### 用户体验
- 🚀 更快的启动速度
- 💎 更美观的 UI（Ant Design）
- 🔍 更强大的搜索和过滤
- 📤 更便捷的导出功能

### 代码质量
- 📝 代码量减少 40-50%
- 🧹 无 callback hell
- 🎯 清晰的类型定义
- 🔧 易于调试和测试

## 时间估算

- 项目初始化: 1-2 小时
- 服务层开发: 2-3 小时
- 组件开发: 3-4 小时
- 功能集成: 2-3 小时
- 测试优化: 1-2 小时
- 文档整理: 1 小时

**总计: 10-15 小时**

## 风险控制

### 潜在风险
1. better-sqlite3 在标准 Node.js 环境中编译通常很顺利
2. 前后端分离需要处理 CORS
3. 数据解析逻辑迁移可能出错
4. 需要用户手动配置微信数据目录

### 缓解措施
1. 保留旧代码在 `development/old/` 目录作为参考
2. 增量迁移，逐步测试
3. Express 配置 CORS 中间件
4. 充分的真实数据测试
5. 提供清晰的配置界面

## 部署方式

### 开发模式
```bash
# 同时启动前后端开发服务器
./scripts/dev.sh

# 后端: http://localhost:3000
# 前端: http://localhost:5173
```

### 生产模式
```bash
# 构建前端
cd frontend && npm run build

# 启动后端（服务静态文件）
./scripts/start.sh

# 访问: http://localhost:3000
```

## 开始实施

准备好后，按照以下顺序执行：
1. 备份旧代码
2. 创建后端项目（backend/）
3. 实现后端 API 和业务逻辑
4. 测试后端 API
5. 创建前端项目（frontend/）
6. 开发 React 组件
7. 前后端联调
8. 测试和优化
9. 文档更新

每个阶段完成后都需要测试验证，确保功能正常。

