"""聊天相关数据模型"""
from typing import Optional
from pydantic import BaseModel, Field


class ChatContact(BaseModel):
    """聊天联系人信息"""
    md5: str = Field(..., description="联系人微信号的 MD5 值")
    wechat_id: str = Field(..., alias="wechatId", description="联系人微信号")
    nickname: str = Field(..., description="联系人昵称")
    is_group: bool = Field(..., alias="isGroup", description="是否为群聊")
    
    class Config:
        populate_by_name = True


class ChatTable(BaseModel):
    """聊天表信息"""
    table_name: str = Field(..., alias="tableName", description="数据库表名")
    message_count: int = Field(..., alias="messageCount", description="消息数量")
    contact: ChatContact = Field(..., description="联系人信息")
    last_message_time: Optional[int] = Field(None, alias="lastMessageTime", description="最后一条消息的时间戳")
    is_pinned: Optional[bool] = Field(None, alias="isPinned", description="是否置顶")
    last_message_preview: Optional[str] = Field(None, alias="lastMessagePreview", description="最后一条消息预览")
    
    class Config:
        populate_by_name = True

