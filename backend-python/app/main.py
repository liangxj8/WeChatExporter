"""FastAPI 应用入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.config import settings

# 创建 FastAPI 应用
app = FastAPI(
    title="WeChatExporter API",
    description="微信聊天记录导出工具 - Python 后端",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 日志中间件
@app.middleware("http")
async def log_requests(request, call_next):
    """记录请求日志"""
    print(f"{datetime.now().isoformat()} {request.method} {request.url.path}")
    response = await call_next(request)
    return response


# 健康检查
@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat()
    }


# 根路径
@app.get("/")
async def root():
    """API 信息"""
    return {
        "name": "WeChatExporter API",
        "version": "2.0.0",
        "endpoints": [
            "GET  /health - 健康检查",
            "GET  /docs - API 文档（Swagger UI）",
            "GET  /redoc - API 文档（ReDoc）",
            "GET  /api/users - 获取用户列表",
            "GET  /api/users/{md5} - 获取用户详情",
            "GET  /api/chats - 获取聊天列表",
            "GET  /api/chats/messages - 获取消息列表",
            "GET  /api/chats/dates - 获取日期列表",
            "GET  /api/chats/view - 查看聊天记录 HTML",
            "GET  /api/analytics/statistics - 获取统计数据",
            "GET  /api/analytics/wordcloud - 生成词云",
            "POST /api/ai/summarize - 聊天内容总结",
        ]
    }


if __name__ == "__main__":
    import uvicorn
    
    print("=" * 60)
    print("✅ WeChatExporter 后端服务已启动")
    print("=" * 60)
    print(f"🌐 服务地址: http://localhost:{settings.port}")
    print(f"📚 API 文档: http://localhost:{settings.port}/docs")
    print(f"❤️  健康检查: http://localhost:{settings.port}/health")
    print("=" * 60)
    print()
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )

