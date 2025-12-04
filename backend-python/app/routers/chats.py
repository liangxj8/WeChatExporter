"""聊天记录 API 路由"""
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import HTMLResponse
from typing import List, Optional, Dict, Any

from app.models import ChatTable, ApiResponse
from app.services.database import WeChatDatabase
from app.services.renderer import WeChatRenderer

router = APIRouter()
db = WeChatDatabase()
renderer = WeChatRenderer()


@router.get("", response_model=ApiResponse[List[ChatTable]])
async def get_chats(
    path: str = Query(..., description="微信数据目录路径"),
    userMd5: str = Query(..., alias="userMd5", description="用户 MD5"),
    limit: int = Query(0, description="最小消息数量过滤（0=不过滤）")
):
    """
    获取聊天列表
    
    Args:
        path: 微信数据目录路径
        userMd5: 用户 MD5
        limit: 最小消息数量过滤
        
    Returns:
        聊天表列表
    """
    try:
        chat_tables = db.get_chat_tables(path, userMd5, limit)
        
        print(f'✅ 返回 {len(chat_tables)} 个聊天')
        
        return ApiResponse(success=True, data=chat_tables)
    except Exception as e:
        print(f'获取聊天列表失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages", response_model=ApiResponse[List[Dict[str, Any]]])
async def get_messages(
    path: str = Query(..., description="微信数据目录路径"),
    userMd5: str = Query(..., alias="userMd5", description="用户 MD5"),
    table: str = Query(..., description="表名"),
    limit: int = Query(100, description="限制数量"),
    offset: int = Query(0, description="偏移量"),
    startDate: Optional[str] = Query(None, alias="startDate", description="开始日期（YYYY-MM-DD）"),
    endDate: Optional[str] = Query(None, alias="endDate", description="结束日期（YYYY-MM-DD）")
):
    """
    获取消息列表
    
    Args:
        path: 微信数据目录路径
        userMd5: 用户 MD5
        table: 表名
        limit: 限制数量
        offset: 偏移量
        startDate: 开始日期
        endDate: 结束日期
        
    Returns:
        消息列表
    """
    try:
        messages = db.get_messages(path, userMd5, table, limit, offset, startDate, endDate)
        
        print(f'✅ 返回 {len(messages)} 条消息')
        
        return ApiResponse(success=True, data=messages)
    except Exception as e:
        print(f'获取消息列表失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dates", response_model=ApiResponse[List[str]])
async def get_message_dates(
    path: str = Query(..., description="微信数据目录路径"),
    userMd5: str = Query(..., alias="userMd5", description="用户 MD5"),
    tableName: str = Query(..., alias="tableName", description="表名")
):
    """
    获取聊天的所有消息日期列表
    
    Args:
        path: 微信数据目录路径
        userMd5: 用户 MD5
        tableName: 表名
        
    Returns:
        日期列表（YYYY-MM-DD 格式，倒序）
    """
    try:
        dates = db.get_message_dates(path, userMd5, tableName)
        
        print(f'✅ 返回 {len(dates)} 个日期')
        
        return ApiResponse(success=True, data=dates)
    except Exception as e:
        print(f'获取日期列表失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/view", response_class=HTMLResponse)
async def view_chat(
    path: str = Query(..., description="微信数据目录路径"),
    userMd5: str = Query(..., alias="userMd5", description="用户 MD5"),
    tableName: str = Query(..., alias="tableName", description="表名"),
    nickname: str = Query(..., description="昵称"),
    isGroup: str = Query(..., alias="isGroup", description="是否为群聊"),
    startDate: Optional[str] = Query(None, alias="startDate", description="开始日期（YYYY-MM-DD）"),
    endDate: Optional[str] = Query(None, alias="endDate", description="结束日期（YYYY-MM-DD）")
):
    """
    查看聊天记录 HTML
    
    Args:
        path: 微信数据目录路径
        userMd5: 用户 MD5
        tableName: 表名
        nickname: 昵称
        isGroup: 是否为群聊
        startDate: 开始日期
        endDate: 结束日期
        
    Returns:
        HTML 页面
    """
    try:
        from app.models import ChatTable, ChatContact
        
        # 构造 chatInfo
        chat_info = ChatTable(
            tableName=tableName,
            messageCount=0,
            contact=ChatContact(
                md5='',
                wechatId='',
                nickname=nickname,
                isGroup=isGroup.lower() == 'true'
            )
        )
        
        html = renderer.render_chat_html(
            path, userMd5, tableName, chat_info,
            limit=100, offset=0,
            start_date=startDate, end_date=endDate
        )
        
        return HTMLResponse(content=html)
    except Exception as e:
        print(f'查看聊天记录失败: {e}')
        return HTMLResponse(
            content=f'''
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>错误</title></head>
            <body><h1>加载失败</h1><p>{str(e)}</p></body>
            </html>
            ''',
            status_code=500
        )


@router.get("/view/messages", response_model=ApiResponse[List[Dict[str, Any]]])
async def get_view_messages(
    path: str = Query(..., description="微信数据目录路径"),
    userMd5: str = Query(..., alias="userMd5", description="用户 MD5"),
    tableName: str = Query(..., alias="tableName", description="表名"),
    isGroup: str = Query(..., alias="isGroup", description="是否为群聊"),
    limit: int = Query(100, description="限制数量"),
    offset: int = Query(0, description="偏移量"),
    startDate: Optional[str] = Query(None, alias="startDate", description="开始日期（YYYY-MM-DD）"),
    endDate: Optional[str] = Query(None, alias="endDate", description="结束日期（YYYY-MM-DD）")
):
    """
    获取消息列表（用于无限滚动）
    
    Args:
        path: 微信数据目录路径
        userMd5: 用户 MD5
        tableName: 表名
        isGroup: 是否为群聊
        limit: 限制数量
        offset: 偏移量
        startDate: 开始日期
        endDate: 结束日期
        
    Returns:
        消息列表（群聊消息会包含 sender 和 cleanedMessage 字段）
    """
    try:
        messages = db.get_messages(path, userMd5, tableName, limit, offset, startDate, endDate)
        
        # 如果是群聊，解析发送者昵称
        processed_messages = messages
        if isGroup.lower() == 'true':
            from app.utils.crypto import md5, decode_user_name_info, get_friendly_name
            
            contacts_map = db.get_contacts(path, userMd5)
            
            for msg in processed_messages:
                # 如果是文本消息且包含发送者信息
                if msg.get('Type') == 1 and msg.get('Message') and ':\n' in msg['Message']:
                    parts = msg['Message'].split(':\n', 1)
                    if len(parts) >= 2:
                        sender_id = parts[0].strip()
                        message_text = parts[1]
                        
                        # 查找发送者昵称
                        sender_md5 = md5(sender_id)
                        sender_contact = contacts_map.get(sender_md5)
                        sender_name = ''
                        
                        if sender_contact:
                            sender_name = decode_user_name_info(sender_contact.db_contact_remark)
                        
                        # 如果没找到昵称，使用友好名称
                        if not sender_name or sender_name == sender_id:
                            sender_name = get_friendly_name(sender_id, '', False)
                        
                        msg['sender'] = sender_name
                        msg['cleanedMessage'] = message_text
        
        return ApiResponse(success=True, data=processed_messages)
    except Exception as e:
        print(f'获取消息列表失败: {e}')
        raise HTTPException(status_code=500, detail=str(e))

