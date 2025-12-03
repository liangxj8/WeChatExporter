# 🚀 开始使用 WeChatExporter 2.0

## ✅ 项目已完成并可用！

全新的现代化 WeChatExporter 已经完整实现，包括：
- ✅ React 18 + TypeScript 前端
- ✅ Express + TypeScript 后端
- ✅ sql.js 数据库访问（无需编译）
- ✅ Ant Design 5 UI 组件
- ✅ 完整的功能和文档

## 🎯 立即启动

### 方式 1：一键启动（最简单）

```bash
cd /Users/hankin/src/github/WeChatExporter
./scripts/dev.sh
```

这会自动：
1. 检查并安装依赖
2. 启动后端（端口 3000）
3. 启动前端（端口 5173）
4. 打开浏览器

### 方式 2：手动启动

**终端 1 - 启动后端**
```bash
cd /Users/hankin/src/github/WeChatExporter/backend
npm run dev
```

**终端 2 - 启动前端**
```bash
cd /Users/hankin/src/github/WeChatExporter/frontend
npm run dev
```

## 📱 使用流程

1. **打开浏览器**: http://localhost:5173
2. **输入路径**: `/Users/hankin/Downloads/Documents`
3. **选择用户**: 点击要查看的微信账号
4. **导出记录**: 选择聊天，点击 HTML 或 JSON 导出

## 🧪 快速测试

### 测试后端

```bash
# 启动后端
cd backend && npm run dev

# 在另一个终端测试 API
curl "http://localhost:3000/health"
curl "http://localhost:3000/api/users?path=/Users/hankin/Downloads/Documents"
```

### 测试前端

```bash
# 启动前端
cd frontend && npm run dev

# 浏览器自动打开到 http://localhost:5173
```

## 📚 文档

- **README.md** - 完整项目说明
- **QUICKSTART.md** - 快速开始指南
- **PROJECT_COMPLETE.md** - 完成情况总结
- **docs/MODERNIZATION_PLAN.md** - 技术细节

## 🔍 检查清单

- [x] 后端依赖已安装
- [x] 前端依赖已安装
- [x] TypeScript 编译通过
- [x] 所有核心文件已创建
- [x] 启动脚本已配置

## 💡 提示

1. **数据路径**: 确保你有微信备份的 Documents 目录
2. **端口占用**: 如果端口被占用，先关闭其他服务
3. **浏览器**: 推荐使用 Chrome 或 Edge（最新版）
4. **问题排查**: 查看终端输出的错误信息

## 🎨 技术栈

### 后端
- Node.js + Express
- TypeScript
- sql.js（纯 JS SQLite）
- CORS 支持

### 前端
- React 18
- TypeScript
- Vite（超快构建）
- Ant Design 5
- Axios

## 🌟 核心特性

1. **无需编译**: 使用 sql.js，避免 native binding 问题
2. **现代化 UI**: Ant Design 5，美观易用
3. **类型安全**: 全面的 TypeScript 类型定义
4. **实时搜索**: 快速查找聊天记录
5. **多格式导出**: HTML 和 JSON 两种格式

## 🔧 开发命令

### 后端
```bash
npm run dev      # 开发模式（自动重启）
npm run build    # 编译 TypeScript
npm start        # 运行编译后的代码
```

### 前端
```bash
npm run dev      # 开发模式（热重载）
npm run build    # 构建生产版本
npm run preview  # 预览构建结果
```

## ❓ 常见问题

### Q: 端口被占用怎么办？
A: 使用 `lsof -i :3000` 和 `lsof -i :5173` 查看并关闭占用端口的进程

### Q: 找不到微信数据？
A: 确保路径指向 Documents 目录，且包含 32 位 MD5 格式的用户子目录

### Q: 依赖安装失败？
A: 删除 `node_modules` 和 `package-lock.json`，重新运行 `npm install`

## 🚦 状态检查

访问以下地址确认服务正常：

- ✅ 后端健康: http://localhost:3000/health
- ✅ API 文档: http://localhost:3000/
- ✅ 前端界面: http://localhost:5173/

## 🎉 开始使用

现在你可以：

```bash
# 一键启动
./scripts/dev.sh
```

然后在浏览器中享受全新的 WeChatExporter 2.0！

---

**祝使用愉快！** 🎊

如有问题，请查看其他文档或提交 Issue。

