# 脚本工具

WeChatExporter 2.0 的自动化脚本。

## 📜 可用脚本

### setup.sh - 环境配置

一键安装所有依赖（Python 后端 + 前端）。

```bash
./scripts/setup.sh
```

**功能**:
- 检查 Python 和 Node.js 版本
- 创建 Python 虚拟环境
- 安装 Python 依赖
- 安装前端 npm 包
- 创建 .env 配置文件

### dev.sh - 开发模式启动

同时启动前后端开发服务器。

```bash
./scripts/dev.sh
```

**功能**:
- 检查依赖是否安装
- 启动 Python 后端 (http://localhost:3000)
- 启动前端开发服务器 (http://localhost:5173)
- 按 Ctrl+C 停止所有服务

## 🔧 单独启动

### 仅启动后端

```bash
cd backend
./run.sh
```

### 仅启动前端

```bash
cd frontend
npm run dev
```

## 📝 注意事项

1. **首次使用**必须先运行 `setup.sh` 安装依赖
2. 开发模式下会自动重载（后端 uvicorn --reload，前端 Vite HMR）
3. 所有脚本都有颜色输出，便于查看状态

## 🐛 故障排查

### 脚本无法执行
```bash
chmod +x scripts/*.sh
```

### Python 版本错误
确保安装 Python 3.9+:
```bash
python3 --version
```

### Node.js 版本错误
确保安装 Node.js 16+:
```bash
node --version
```

### 依赖安装失败
分别进入 backend 和 frontend 目录手动安装:
```bash
cd backend && ./setup.sh
cd frontend && npm install
```

## 🚀 生产部署

生产环境不使用这些开发脚本，请参考：

**后端**:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 3000 --workers 4
```

**前端**:
```bash
cd frontend
npm run build
# 使用 nginx 或其他 web 服务器托管 dist/ 目录
```

---

**版本**: 2.0.0  
**更新**: 2025-12-04
