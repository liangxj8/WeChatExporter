#快速启动指南

## 🚀 一键启动

```bash
cd /Users/hankin/src/github/WeChatExporter
./scripts/dev.sh
```

这会自动：
1. 检查并安装所有依赖
2. 启动后端服务 (http://localhost:3000)
3. 启动前端服务 (http://localhost:5173)
4. 自动打开浏览器

## 📋 使用流程

### 步骤 1: 配置数据路径

打开浏览器后，输入你的微信数据目录路径：

```
/Users/hankin/Downloads/Documents
```

点击"下一步"

### 步骤 2: 选择微信账号

- 系统会自动扫描并显示所有微信账号
- 点击要导出的账号卡片

### 步骤 3: 查看和导出聊天记录

- 查看该账号的所有聊天列表
- 使用搜索框快速查找联系人
- 点击"HTML"或"JSON"按钮导出聊天记录

## 🔧 手动启动（如果一键启动失败）

### 启动后端

```bash
cd backend
npm install
npm run dev
```

### 启动前端（新终端窗口）

```bash
cd frontend
npm install
npm run dev
```

## ✅ 验证安装

访问以下地址确认服务正常：

- 后端健康检查: http://localhost:3000/health
- 后端 API 文档: http://localhost:3000/
- 前端界面: http://localhost:5173/

## 🐛 常见问题

### 端口被占用

如果 3000 或 5173 端口被占用：

```bash
# 查看占用端口的进程
lsof -i :3000
lsof -i :5173

# 杀死进程
kill -9 <PID>
```

### 依赖安装失败

```bash
# 清理缓存重新安装
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### 找不到微信数据

确保你的微信数据目录结构如下：

```
Documents/
├── <32位MD5>/             # 用户目录
│   ├── DB/
│   │   ├── WCDB_Contact.sqlite
│   │   ├── message_1.sqlite
│   │   ├── message_2.sqlite
│   │   └── ...
│   ├── Avatar/
│   │   └── lastHeadImage
│   └── LoginInfo2.dat
└── ...
```

## 🎯 测试数据

使用你的微信备份数据：
- 路径: `/Users/hankin/Downloads/Documents`
- 这个路径已在配置页面预填

## 📝 下一步

- 阅读完整文档: `README.md`
- 查看技术细节: `docs/MODERNIZATION_PLAN.md`
- 了解 API: http://localhost:3000/

---

享受使用！如有问题，请查看 `TROUBLESHOOTING.md` 或提交 Issue。

