"""数据分析 API 路由"""
from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional

from app.models import ApiResponse
from app.services.analytics import WeChatAnalytics
from app.services.wordcloud_gen import WeChatWordCloud

router = APIRouter()
analytics = WeChatAnalytics()
wordcloud_gen = WeChatWordCloud()


@router.get("/statistics", response_model=ApiResponse[Dict[str, Any]])
async def get_statistics(
    path: str = Query(..., description="微信数据目录路径"),
    userMd5: str = Query(..., alias="userMd5", description="用户 MD5"),
    tableName: str = Query(..., alias="tableName", description="表名"),
    startDate: Optional[str] = Query(None, alias="startDate", description="开始日期（YYYY-MM-DD）"),
    endDate: Optional[str] = Query(None, alias="endDate", description="结束日期（YYYY-MM-DD）")
):
    """
    获取聊天统计数据
    
    返回数据包括：
    - 总消息数
    - 日期范围
    - 消息类型分布
    - 每日消息数量趋势
    - 每小时活跃度分布
    
    Args:
        path: 微信数据目录路径
        userMd5: 用户 MD5
        tableName: 表名
        startDate: 开始日期
        endDate: 结束日期
        
    Returns:
        统计数据
    """
    try:
        stats = analytics.get_chat_statistics(
            path, userMd5, tableName, startDate, endDate
        )
        
        print(f'✅ 返回统计数据: {stats["totalMessages"]} 条消息')
        
        return ApiResponse(success=True, data=stats)
    except Exception as e:
        print(f'获取统计数据失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/activity", response_model=ApiResponse[Dict[str, Any]])
async def get_activity(
    path: str = Query(..., description="微信数据目录路径"),
    userMd5: str = Query(..., alias="userMd5", description="用户 MD5"),
    tableName: str = Query(..., alias="tableName", description="表名"),
    startDate: Optional[str] = Query(None, alias="startDate", description="开始日期（YYYY-MM-DD）"),
    endDate: Optional[str] = Query(None, alias="endDate", description="结束日期（YYYY-MM-DD）")
):
    """
    获取用户活跃度分析（主要用于群聊）
    
    返回数据包括：
    - 用户发言次数排名
    - 总用户数
    
    Args:
        path: 微信数据目录路径
        userMd5: 用户 MD5
        tableName: 表名
        startDate: 开始日期
        endDate: 结束日期
        
    Returns:
        活跃度数据
    """
    try:
        activity = analytics.get_user_activity(
            path, userMd5, tableName, startDate, endDate
        )
        
        print(f'✅ 返回活跃度数据: {activity["totalUsers"]} 个用户')
        
        return ApiResponse(success=True, data=activity)
    except Exception as e:
        print(f'获取活跃度数据失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/wordfreq", response_model=ApiResponse[List[Dict[str, Any]]])
async def get_word_frequency(
    path: str = Query(..., description="微信数据目录路径"),
    userMd5: str = Query(..., alias="userMd5", description="用户 MD5"),
    tableName: str = Query(..., alias="tableName", description="表名"),
    topN: int = Query(100, alias="topN", description="返回前 N 个高频词"),
    startDate: Optional[str] = Query(None, alias="startDate", description="开始日期（YYYY-MM-DD）"),
    endDate: Optional[str] = Query(None, alias="endDate", description="结束日期（YYYY-MM-DD）")
):
    """
    获取词频统计
    
    使用 jieba 中文分词，过滤停用词后统计高频词汇
    
    Args:
        path: 微信数据目录路径
        userMd5: 用户 MD5
        tableName: 表名
        topN: 返回前 N 个高频词
        startDate: 开始日期
        endDate: 结束日期
        
    Returns:
        词频列表 [{'word': '词', 'count': 次数}, ...]
    """
    try:
        word_freq = analytics.get_word_frequency(
            path, userMd5, tableName, topN, startDate, endDate
        )
        
        print(f'✅ 返回词频数据: {len(word_freq)} 个词')
        
        return ApiResponse(success=True, data=word_freq)
    except Exception as e:
        print(f'获取词频数据失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/wordcloud", response_model=ApiResponse[Dict[str, str]])
async def generate_wordcloud(
    path: str = Query(..., description="微信数据目录路径"),
    userMd5: str = Query(..., alias="userMd5", description="用户 MD5"),
    tableName: str = Query(..., alias="tableName", description="表名"),
    width: int = Query(800, description="图片宽度"),
    height: int = Query(600, description="图片高度"),
    backgroundColor: str = Query("white", alias="backgroundColor", description="背景颜色"),
    colormap: str = Query("viridis", description="颜色方案"),
    maxWords: int = Query(200, alias="maxWords", description="最大词数"),
    startDate: Optional[str] = Query(None, alias="startDate", description="开始日期（YYYY-MM-DD）"),
    endDate: Optional[str] = Query(None, alias="endDate", description="结束日期（YYYY-MM-DD）")
):
    """
    生成词云图片
    
    返回 base64 编码的 PNG 图片，可直接用于前端显示
    
    Args:
        path: 微信数据目录路径
        userMd5: 用户 MD5
        tableName: 表名
        width: 图片宽度
        height: 图片高度
        backgroundColor: 背景颜色
        colormap: 颜色方案（viridis, plasma, inferno, magma, cividis 等）
        maxWords: 最大词数
        startDate: 开始日期
        endDate: 结束日期
        
    Returns:
        {'image': 'base64编码的图片'}
    """
    try:
        image_base64 = wordcloud_gen.generate_wordcloud(
            path, userMd5, tableName,
            width, height, backgroundColor, colormap, maxWords,
            startDate, endDate
        )
        
        print(f'✅ 生成词云图片成功')
        
        return ApiResponse(success=True, data={'image': image_base64})
    except Exception as e:
        print(f'生成词云失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))

