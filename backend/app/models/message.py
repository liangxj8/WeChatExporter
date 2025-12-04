"""消息相关数据模型"""
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field


class Message(BaseModel):
    """微信消息（字段名与数据库一致）"""
    MesLocalID: int = Field(..., description="本地消息 ID")
    MesSvrID: int = Field(..., description="服务器消息 ID")
    CreateTime: int = Field(..., description="创建时间（Unix 时间戳）")
    Message: str = Field(..., description="消息内容")
    Type: int = Field(..., description="消息类型")
    Des: int = Field(..., description="方向（0=接收, 1=发送）")
    Status: int = Field(..., description="消息状态")
    ImgStatus: Optional[int] = Field(None, description="图片状态")
    TableVer: Optional[int] = Field(None, description="表版本")
    
    class Config:
        # 允许额外字段（数据库可能有其他字段）
        extra = "allow"


class MessageWithSender(Message):
    """带发送者信息的消息（用于群聊）"""
    sender: Optional[str] = Field(None, description="发送者昵称")
    cleaned_message: Optional[str] = Field(None, alias="cleanedMessage", description="清理后的消息内容")
    
    class Config:
        populate_by_name = True
        extra = "allow"

