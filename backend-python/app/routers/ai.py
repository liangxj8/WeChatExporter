"""AI 功能 API 路由"""
from fastapi import APIRouter, Query, Body, HTTPException
from typing import Optional, Dict, Any
from pydantic import BaseModel

from app.models import ApiResponse
from app.services.llm_service import LLMService

router = APIRouter()

def get_llm_service():
    """获取 LLM 服务实例（延迟初始化）"""
    return LLMService()


class QARequest(BaseModel):
    """问答请求模型"""
    path: str
    userMd5: str
    tableName: str
    question: str
    limit: int = 1000
    startDate: Optional[str] = None
    endDate: Optional[str] = None


@router.post("/summarize", response_model=ApiResponse[Dict[str, Any]])
async def summarize(
    path: str = Body(..., description="微信数据目录路径"),
    userMd5: str = Body(..., alias="userMd5", description="用户 MD5"),
    tableName: str = Body(..., alias="tableName", description="表名"),
    limit: int = Body(1000, description="限制消息数量"),
    startDate: Optional[str] = Body(None, alias="startDate", description="开始日期（YYYY-MM-DD）"),
    endDate: Optional[str] = Body(None, alias="endDate", description="结束日期（YYYY-MM-DD）")
):
    """
    总结聊天内容
    
    使用大模型分析聊天记录，提取关键话题和总结
    
    Args:
        path: 微信数据目录路径
        userMd5: 用户 MD5
        tableName: 表名
        limit: 限制消息数量
        startDate: 开始日期
        endDate: 结束日期
        
    Returns:
        {'summary': '总结内容', 'topics': ['话题1', '话题2']}
    """
    try:
        llm = get_llm_service()
        result = llm.summarize_chat(
            path, userMd5, tableName, limit, startDate, endDate
        )
        
        print(f'✅ 聊天内容总结完成')
        
        return ApiResponse(success=True, data=result)
    except ValueError as e:
        # API Key 未配置
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f'总结聊天内容失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sentiment", response_model=ApiResponse[Dict[str, Any]])
async def sentiment(
    path: str = Body(..., description="微信数据目录路径"),
    userMd5: str = Body(..., alias="userMd5", description="用户 MD5"),
    tableName: str = Body(..., alias="tableName", description="表名"),
    limit: int = Body(1000, description="限制消息数量"),
    startDate: Optional[str] = Body(None, alias="startDate", description="开始日期（YYYY-MM-DD）"),
    endDate: Optional[str] = Body(None, alias="endDate", description="结束日期（YYYY-MM-DD）")
):
    """
    情感分析
    
    使用大模型分析聊天记录的整体情感倾向
    
    Args:
        path: 微信数据目录路径
        userMd5: 用户 MD5
        tableName: 表名
        limit: 限制消息数量
        startDate: 开始日期
        endDate: 结束日期
        
    Returns:
        {'sentiment': 'positive/neutral/negative', 'score': 0.8, 'description': '描述'}
    """
    try:
        llm = get_llm_service()
        result = llm.sentiment_analysis(
            path, userMd5, tableName, limit, startDate, endDate
        )
        
        print(f'✅ 情感分析完成: {result["sentiment"]}')
        
        return ApiResponse(success=True, data=result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f'情感分析失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/qa", response_model=ApiResponse[str])
async def qa(request: QARequest):
    """
    智能问答
    
    基于聊天记录回答用户问题
    
    Args:
        request: 问答请求（包含路径、表名、问题等）
        
    Returns:
        回答内容
    """
    try:
        llm = get_llm_service()
        answer = llm.qa_chat_history(
            request.path,
            request.userMd5,
            request.tableName,
            request.question,
            request.limit,
            request.startDate,
            request.endDate
        )
        
        print(f'✅ 问答完成: {request.question}')
        
        return ApiResponse(success=True, data=answer)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f'问答失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))

