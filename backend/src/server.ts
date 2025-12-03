import express from 'express';
import cors from 'cors';
import path from 'path';
import usersRouter from './routes/users';
import chatsRouter from './routes/chats';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API 路由
app.use('/api/users', usersRouter);
app.use('/api/chats', chatsRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'WeChatExporter API',
    version: '2.0.0',
    endpoints: [
      'GET  /health - 健康检查',
      'GET  /api/users?path=... - 获取用户列表',
      'GET  /api/users/:md5?path=... - 获取用户详情',
      'GET  /api/chats?path=...&userMd5=...&limit=0 - 获取聊天列表',
      'GET  /api/chats/messages?path=...&userMd5=...&table=...&limit=100&offset=0 - 获取消息',
      'POST /api/chats/export - 导出聊天记录',
    ],
  });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: err.message || '服务器内部错误',
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('✅ WeChatExporter 后端服务已启动');
  console.log('='.repeat(60));
  console.log(`🌐 服务地址: http://localhost:${PORT}`);
  console.log(`📚 API 文档: http://localhost:${PORT}/`);
  console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
  console.log('');
});

export default app;

