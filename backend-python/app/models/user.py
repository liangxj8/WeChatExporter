"""用户相关数据模型"""
from typing import Optional
from pydantic import BaseModel, Field


class UserInfo(BaseModel):
    """用户信息"""
    md5: str = Field(..., description="微信号的 MD5 值")
    wechat_id: str = Field(..., alias="wechatId", description="微信号")
    nickname: str = Field(..., description="昵称")
    avatar: Optional[str] = Field(None, description="头像路径")
    
    class Config:
        populate_by_name = True


class Contact(BaseModel):
    """联系人信息"""
    user_name: str = Field(..., alias="userName", description="微信号")
    db_contact_remark: str = Field(..., alias="dbContactRemark", description="联系人备注（hex 编码）")
    db_contact_profile: Optional[str] = Field(None, alias="dbContactProfile", description="个人简介")
    db_contact_head_image: Optional[str] = Field(None, alias="dbContactHeadImage", description="头像")
    
    class Config:
        populate_by_name = True

