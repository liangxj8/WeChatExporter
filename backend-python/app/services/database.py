"""微信数据库操作服务"""
import sqlite3
from pathlib import Path
from typing import Dict, List, Optional, Any

from app.models import Contact, ChatTable, ChatContact, Message
from app.utils.crypto import md5, decode_user_name_info, get_friendly_name


def decode_message(data: Any) -> str:
    """
    转换 Message 字段为字符串
    注意：iOS 备份的特殊消息类型使用 zstd 字典压缩，无法直接解压
    
    Args:
        data: 消息数据（可能是字符串或字节）
        
    Returns:
        解码后的字符串
    """
    try:
        # 如果是字符串，直接返回
        if isinstance(data, str):
            return data
        
        # 如果是字节，尝试解码
        if isinstance(data, bytes):
            if len(data) == 0:
                return ''
            return data.decode('utf-8', errors='ignore')
        
        return ''
    except Exception as e:
        print(f'转换消息失败: {e}')
        return ''


class WeChatDatabase:
    """微信数据库操作"""
    
    def open_contact_db(self, documents_path: str, user_md5: str) -> sqlite3.Connection | None:
        """
        打开联系人数据库
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            
        Returns:
            数据库连接对象，失败返回 None
        """
        db_path = Path(documents_path) / user_md5 / 'DB' / 'WCDB_Contact.sqlite'
        
        if not db_path.exists():
            print(f'WCDB_Contact.sqlite 不存在: {db_path}')
            return None
        
        try:
            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row  # 使用 Row 对象
            return conn
        except Exception as e:
            print(f'打开联系人数据库失败: {e}')
            return None
    
    def open_message_db(self, documents_path: str, user_md5: str, db_index: int) -> sqlite3.Connection | None:
        """
        打开消息数据库
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            db_index: 数据库索引（1-4）
            
        Returns:
            数据库连接对象，失败返回 None
        """
        db_path = Path(documents_path) / user_md5 / 'DB' / f'message_{db_index}.sqlite'
        
        if not db_path.exists():
            return None
        
        try:
            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            return conn
        except Exception as e:
            print(f'打开 message_{db_index}.sqlite 失败: {e}')
            return None
    
    def get_contacts(self, documents_path: str, user_md5: str) -> Dict[str, Contact]:
        """
        获取联系人列表
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            
        Returns:
            联系人字典 {md5: Contact}
        """
        contacts_map: Dict[str, Contact] = {}
        conn = self.open_contact_db(documents_path, user_md5)
        
        if not conn:
            return contacts_map
        
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT *, lower(quote(dbContactRemark)) as cr FROM Friend')
            rows = cursor.fetchall()
            
            for row in rows:
                user_name = row['userName']
                cr = row['cr']
                name_md5 = md5(user_name)
                
                contacts_map[name_md5] = Contact(
                    userName=user_name,
                    dbContactRemark=cr
                )
            
            print(f'从 WCDB_Contact.sqlite 读取到 {len(contacts_map)} 个联系人')
        except Exception as e:
            print(f'读取联系人失败: {e}')
        finally:
            conn.close()
        
        return contacts_map
    
    def get_chat_tables(
        self,
        documents_path: str,
        user_md5: str,
        message_limit: int = 0
    ) -> List[ChatTable]:
        """
        获取聊天表列表
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            message_limit: 最小消息数量过滤（0=不过滤）
            
        Returns:
            聊天表列表
        """
        chat_tables: List[ChatTable] = []
        contacts_map = self.get_contacts(documents_path, user_md5)
        
        # 遍历 message_1.sqlite 到 message_4.sqlite
        for i in range(1, 5):
            conn = self.open_message_db(documents_path, user_md5, i)
            if not conn:
                continue
            
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM SQLITE_MASTER 
                    WHERE type = 'table' 
                    AND (name LIKE 'Chat/_%' ESCAPE '/' OR name LIKE 'ChatExt2/_%' ESCAPE '/')
                """)
                tables = cursor.fetchall()
                
                for table in tables:
                    table_name = table['name']
                    
                    # 获取消息数量
                    cursor.execute(f'SELECT COUNT(*) as count FROM "{table_name}"')
                    message_count = cursor.fetchone()['count']
                    
                    # 如果消息数量太少，跳过
                    if message_limit > 0 and message_count <= message_limit:
                        continue
                    
                    # 从表名提取聊天对象的 MD5
                    chatter_md5 = self._extract_chatter_md5(table_name)
                    contact = contacts_map.get(chatter_md5)
                    
                    # 获取基本信息
                    wechat_id = contact.user_name if contact else '未知'
                    is_group = '@chatroom' in wechat_id
                    
                    # 获取最后一条消息（用于排序和预览）
                    last_message_time = 0
                    last_message_preview = ''
                    
                    try:
                        cursor.execute(f"""
                            SELECT CreateTime, Message, Type 
                            FROM "{table_name}" 
                            ORDER BY CreateTime DESC 
                            LIMIT 1
                        """)
                        last_msg = cursor.fetchone()
                        
                        if last_msg:
                            last_message_time = last_msg['CreateTime'] or 0
                            msg_type = last_msg['Type'] or 0
                            msg_content = decode_message(last_msg['Message'])
                            
                            # 生成消息预览
                            if msg_type == 1:
                                # 文本消息
                                preview = msg_content
                                
                                # 如果是群聊，解析发送者昵称
                                if is_group and ':\n' in msg_content:
                                    parts = msg_content.split(':\n', 1)
                                    if len(parts) >= 2:
                                        sender_id = parts[0].strip()
                                        content = parts[1]
                                        
                                        # 查找发送者的昵称
                                        sender_md5 = md5(sender_id)
                                        sender = contacts_map.get(sender_md5)
                                        sender_name = ''
                                        
                                        if sender:
                                            sender_name = decode_user_name_info(sender.db_contact_remark)
                                        
                                        # 如果没找到昵称，使用友好名称
                                        if not sender_name or sender_name == sender_id:
                                            sender_name = get_friendly_name(sender_id, '', False)
                                        
                                        preview = f'{sender_name}: {content}'
                                
                                # 限制长度
                                if len(preview) > 40:
                                    preview = preview[:40] + '...'
                                
                                last_message_preview = preview
                            elif msg_type == 3:
                                last_message_preview = '[图片]'
                            elif msg_type == 34:
                                last_message_preview = '[语音]'
                            elif msg_type == 43:
                                last_message_preview = '[视频]'
                            elif msg_type == 47:
                                last_message_preview = '[表情]'
                            elif msg_type == 49:
                                last_message_preview = '[链接]'
                            else:
                                last_message_preview = '[消息]'
                    except Exception:
                        pass  # 忽略获取最后消息失败的情况
                    
                    # 尝试解析昵称
                    nickname = ''
                    if contact:
                        nickname = decode_user_name_info(contact.db_contact_remark)
                    
                    # 如果没有昵称或昵称就是 wxid，使用友好名称
                    if not nickname or nickname == wechat_id or nickname.startswith('wxid_'):
                        nickname = get_friendly_name(wechat_id, nickname, is_group)
                    
                    chat_tables.append(ChatTable(
                        tableName=table_name,
                        messageCount=message_count,
                        contact=ChatContact(
                            md5=chatter_md5,
                            wechatId=wechat_id,
                            nickname=nickname,
                            isGroup=is_group
                        ),
                        lastMessageTime=last_message_time,
                        lastMessagePreview=last_message_preview
                    ))
            except Exception as e:
                print(f'扫描 message_{i}.sqlite 失败: {e}')
            finally:
                conn.close()
        
        # 按最后消息时间倒序排列（最近的聊天在最前面）
        chat_tables.sort(key=lambda x: x.last_message_time or 0, reverse=True)
        
        print(f'找到 {len(chat_tables)} 个聊天表（已按最后消息时间倒序排列）')
        return chat_tables
    
    def get_messages(
        self,
        documents_path: str,
        user_md5: str,
        table_name: str,
        limit: int = 100,
        offset: int = 0,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        获取消息列表
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            table_name: 表名
            limit: 限制数量
            offset: 偏移量
            start_date: 开始日期（YYYY-MM-DD）
            end_date: 结束日期（YYYY-MM-DD）
            
        Returns:
            消息列表
        """
        messages: List[Dict[str, Any]] = []
        
        # 尝试从各个 message 数据库中查找
        for i in range(1, 5):
            conn = self.open_message_db(documents_path, user_md5, i)
            if not conn:
                continue
            
            try:
                cursor = conn.cursor()
                
                # 检查表是否存在
                cursor.execute(
                    "SELECT name FROM SQLITE_MASTER WHERE type = 'table' AND name = ?",
                    (table_name,)
                )
                
                if not cursor.fetchone():
                    conn.close()
                    continue
                
                # 构建日期筛选条件
                date_condition = ''
                params = []
                
                if start_date or end_date:
                    # 用户指定了日期范围
                    conditions = []
                    if start_date:
                        from datetime import datetime
                        start_timestamp = int(datetime.fromisoformat(start_date).timestamp())
                        conditions.append('CreateTime >= ?')
                        params.append(start_timestamp)
                    if end_date:
                        from datetime import datetime
                        end_timestamp = int(datetime.fromisoformat(end_date + ' 23:59:59').timestamp())
                        conditions.append('CreateTime <= ?')
                        params.append(end_timestamp)
                    date_condition = 'WHERE ' + ' AND '.join(conditions)
                else:
                    # 默认只返回最新一天的数据
                    cursor.execute(f'SELECT MAX(CreateTime) as maxTime FROM "{table_name}"')
                    max_time_row = cursor.fetchone()
                    
                    if max_time_row and max_time_row['maxTime']:
                        from datetime import datetime
                        max_time = max_time_row['maxTime']
                        max_date = datetime.fromtimestamp(max_time)
                        max_date = max_date.replace(hour=0, minute=0, second=0, microsecond=0)
                        day_start_timestamp = int(max_date.timestamp())
                        date_condition = 'WHERE CreateTime >= ?'
                        params.append(day_start_timestamp)
                
                # 查询消息
                query = f'''
                    SELECT * FROM "{table_name}" 
                    {date_condition}
                    ORDER BY CreateTime DESC 
                    LIMIT ? OFFSET ?
                '''
                params.extend([limit, offset])
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                for row in rows:
                    message = dict(row)
                    # 转换 Message 字段为字符串
                    if 'Message' in message:
                        message['Message'] = decode_message(message['Message'])
                    messages.append(message)
                
                conn.close()
                break  # 找到表后退出循环
            except Exception as e:
                print(f'从 message_{i}.sqlite 读取消息失败: {e}')
                conn.close()
        
        return messages
    
    def get_message_dates(
        self,
        documents_path: str,
        user_md5: str,
        table_name: str
    ) -> List[str]:
        """
        获取聊天的所有消息日期列表
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            table_name: 表名
            
        Returns:
            日期列表（YYYY-MM-DD 格式，倒序）
        """
        dates = set()
        
        # 尝试从各个 message 数据库中查找
        for i in range(1, 5):
            conn = self.open_message_db(documents_path, user_md5, i)
            if not conn:
                continue
            
            try:
                cursor = conn.cursor()
                
                # 检查表是否存在
                cursor.execute(
                    "SELECT name FROM SQLITE_MASTER WHERE type = 'table' AND name = ?",
                    (table_name,)
                )
                
                if not cursor.fetchone():
                    conn.close()
                    continue
                
                # 查询所有不同的日期
                cursor.execute(f"""
                    SELECT DISTINCT date(CreateTime, 'unixepoch', 'localtime') as date 
                    FROM "{table_name}" 
                    ORDER BY date DESC
                """)
                rows = cursor.fetchall()
                
                for row in rows:
                    if row['date']:
                        dates.add(row['date'])
                
                conn.close()
                break
            except Exception as e:
                print(f'从 message_{i}.sqlite 读取日期失败: {e}')
                conn.close()
        
        return sorted(list(dates), reverse=True)  # 倒序
    
    def _extract_chatter_md5(self, table_name: str) -> str:
        """
        从表名提取聊天对象的 MD5
        
        Args:
            table_name: 表名（如 Chat_xxxxx 或 ChatExt2_xxxxx）
            
        Returns:
            MD5 字符串
        """
        parts = table_name.split('_')
        return parts[1] if len(parts) > 1 else ''

