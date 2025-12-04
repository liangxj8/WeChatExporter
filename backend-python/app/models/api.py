"""API 响应模型"""
from typing import Optional, Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar('T')


class ApiResponse(BaseModel, Generic[T]):
    """通用 API 响应"""
    success: bool = Field(..., description="请求是否成功")
    data: Optional[T] = Field(None, description="响应数据")
    error: Optional[str] = Field(None, description="错误信息")
    
    class Config:
        # 支持泛型
        arbitrary_types_allowed = True

