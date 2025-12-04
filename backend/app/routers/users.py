"""用户相关 API 路由"""
from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict

from app.models import UserInfo, ApiResponse
from app.services.parser import WeChatParser

router = APIRouter()
parser = WeChatParser()


@router.get("", response_model=ApiResponse[Dict[str, UserInfo]])
async def get_users(
    path: str = Query(..., description="微信数据目录路径")
):
    """
    获取用户列表
    
    Args:
        path: 微信数据目录路径
        
    Returns:
        用户信息字典
    """
    try:
        # 解析 LoginInfo2.dat
        user_info_map = parser.parse_login_info(path)
        
        # 扫描用户目录
        user_md5s = parser.scan_users(path)
        
        # 合并信息并补充头像
        result = {}
        for user_md5 in user_md5s:
            if user_md5 in user_info_map:
                user_info = user_info_map[user_md5]
            else:
                # 如果 LoginInfo2.dat 中没有，创建一个默认的
                user_info = UserInfo(
                    md5=user_md5,
                    wechatId=f"user_{user_md5[:8]}",
                    nickname=f"用户-{user_md5[:8]}"
                )
            
            # 尝试获取头像路径
            avatar = parser.get_user_avatar(path, user_md5)
            if avatar:
                user_info.avatar = avatar
            
            result[user_md5] = user_info
        
        print(f'✅ 返回 {len(result)} 个用户')
        
        return ApiResponse(success=True, data=result)
    except Exception as e:
        print(f'获取用户列表失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{md5}", response_model=ApiResponse[UserInfo])
async def get_user(
    md5: str,
    path: str = Query(..., description="微信数据目录路径")
):
    """
    获取用户详情
    
    Args:
        md5: 用户 MD5
        path: 微信数据目录路径
        
    Returns:
        用户信息
    """
    try:
        # 解析 LoginInfo2.dat
        user_info_map = parser.parse_login_info(path)
        
        if md5 not in user_info_map:
            raise HTTPException(status_code=404, detail=f"用户不存在: {md5}")
        
        user_info = user_info_map[md5]
        
        # 尝试获取头像路径
        avatar = parser.get_user_avatar(path, md5)
        if avatar:
            user_info.avatar = avatar
        
        print(f'✅ 返回用户信息: {user_info.nickname}')
        
        return ApiResponse(success=True, data=user_info)
    except HTTPException:
        raise
    except Exception as e:
        print(f'获取用户详情失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))

