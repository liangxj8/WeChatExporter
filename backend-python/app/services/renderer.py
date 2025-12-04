"""HTML 渲染服务"""
import html
from typing import Dict, List, Any, Optional
from datetime import datetime

from app.models import ChatTable, Contact
from app.services.database import WeChatDatabase
from app.utils.crypto import md5, decode_user_name_info, get_friendly_name


class WeChatRenderer:
    """微信聊天记录 HTML 渲染器"""
    
    def __init__(self):
        self.db = WeChatDatabase()
    
    def render_chat_html(
        self,
        documents_path: str,
        user_md5: str,
        table_name: str,
        chat_info: ChatTable,
        limit: int = 100,
        offset: int = 0,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> str:
        """
        渲染聊天记录为 HTML
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            table_name: 表名
            chat_info: 聊天信息
            limit: 限制数量
            offset: 偏移量
            start_date: 开始日期
            end_date: 结束日期
            
        Returns:
            HTML 字符串
        """
        messages = self.db.get_messages(
            documents_path, user_md5, table_name, limit, offset, start_date, end_date
        )
        
        # 如果是群聊，加载联系人信息用于解析昵称
        contacts_map: Dict[str, Contact] | None = None
        if chat_info.contact.is_group:
            contacts_map = self.db.get_contacts(documents_path, user_md5)
        
        # 构建 HTML
        html_content = self._build_html_head(chat_info)
        html_content += self._build_messages_html(messages, contacts_map, chat_info.contact.is_group)
        html_content += self._build_html_footer(
            documents_path, user_md5, table_name,
            chat_info.contact.nickname, chat_info.contact.is_group,
            len(messages), limit, start_date, end_date
        )
        
        return html_content
    
    def _build_html_head(self, chat_info: ChatTable) -> str:
        """构建 HTML 头部"""
        return f'''<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>聊天记录 - {self._escape_html(chat_info.contact.nickname)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }}
    .header {{ position: sticky; top: 0; background: #f5f5f5; padding: 10px 0; z-index: 100; border-bottom: 1px solid #ddd; }}
    .header h1 {{ color: #333; margin: 0 0 10px 0; }}
    .header .info {{ color: #666; margin: 5px 0; font-size: 14px; }}
    .date-filter {{ margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
    .date-filter label {{ margin-right: 10px; font-weight: bold; }}
    .date-filter input[type="text"] {{ padding: 6px 10px; margin-right: 10px; border: 1px solid #ddd; border-radius: 4px; width: 140px; cursor: pointer; }}
    .date-filter button {{ padding: 6px 15px; background: #07c160; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px; }}
    .date-filter button:hover {{ background: #06ad56; }}
    .date-filter button.secondary {{ background: #999; }}
    .date-filter button.secondary:hover {{ background: #777; }}
    
    .messages-container {{ margin-top: 20px; }}
    .message {{ margin: 10px 0; padding: 10px; clear: both; }}
    .message.sent {{ text-align: right; }}
    .message.received {{ text-align: left; }}
    .message-bubble {{ display: inline-block; max-width: 70%; padding: 10px 15px; border-radius: 10px; word-wrap: break-word; white-space: pre-wrap; text-align: left; }}
    .message.sent .message-bubble {{ background: #95ec69; }}
    .message.received .message-bubble {{ background: #fff; border: 1px solid #ddd; }}
    .time {{ font-size: 12px; color: #999; margin-bottom: 5px; }}
    .sender {{ font-size: 12px; color: #666; font-weight: bold; margin-bottom: 3px; }}
    
    .loading {{ text-align: center; padding: 20px; color: #999; }}
    .no-more {{ text-align: center; padding: 20px; color: #999; font-size: 14px; }}
    .error {{ text-align: center; padding: 20px; color: #f56c6c; }}
  </style>
</head>
<body>
  <div class="header">
    <h1>与 {self._escape_html(chat_info.contact.nickname)} 的聊天记录</h1>
    <p class="info">微信号: {self._escape_html(chat_info.contact.wechat_id)}</p>
    <div class="date-filter">
      <label>日期筛选：</label>
      <input type="text" id="startDate" placeholder="开始日期" readonly>
      <span>至</span>
      <input type="text" id="endDate" placeholder="结束日期" readonly>
      <button onclick="applyDateFilter()">筛选</button>
      <button class="secondary" onclick="clearDateFilter()">清除</button>
      <span id="filterInfo" style="margin-left: 15px; color: #666; font-size: 14px;"></span>
    </div>
  </div>
  
  <div class="messages-container" id="messages">
'''
    
    def _build_messages_html(
        self,
        messages: List[Dict[str, Any]],
        contacts_map: Dict[str, Contact] | None,
        is_group: bool
    ) -> str:
        """构建消息列表 HTML"""
        html_parts = []
        
        for msg in messages:
            time = datetime.fromtimestamp(msg['CreateTime']).strftime('%Y-%m-%d %H:%M:%S')
            class_name = 'sent' if msg['Des'] == 0 else 'received'
            sender = ''
            message_text = msg['Message']
            
            # 如果是群聊文本消息，先提取发送者
            if contacts_map and msg['Type'] == 1 and message_text and ':\n' in message_text:
                parts = message_text.split(':\n', 1)
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
                    
                    sender = sender_name
            
            # 格式化消息内容
            content = self._format_message_content(msg, message_text)
            
            sender_html = f'<div class="sender">{self._escape_html(sender)}</div>' if sender else ''
            
            html_parts.append(f'''
  <div class="message {class_name}">
    <div class="time">{self._escape_html(time)}</div>
    {sender_html}
    <div class="message-bubble">{content}</div>
  </div>
''')
        
        return ''.join(html_parts)
    
    def _build_html_footer(
        self,
        documents_path: str,
        user_md5: str,
        table_name: str,
        nickname: str,
        is_group: bool,
        messages_count: int,
        limit: int,
        start_date: Optional[str],
        end_date: Optional[str]
    ) -> str:
        """构建 HTML 尾部（包含 JavaScript）"""
        start_date_str = f"'{start_date}'" if start_date else 'null'
        end_date_str = f"'{end_date}'" if end_date else 'null'
        
        return f'''
  </div>
  
  <div class="loading" id="loading" style="display: none;">加载中...</div>
  <div class="no-more" id="noMore" style="display: none;">没有更多消息了</div>
  <div class="error" id="error" style="display: none;"></div>

  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
  <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/zh.js"></script>
  <script>
    const API_BASE = window.location.origin + '/api/chats/view/messages';
    const DATES_API = window.location.origin + '/api/chats/dates';
    const params = {{
      path: '{documents_path}',
      userMd5: '{user_md5}',
      tableName: '{table_name}',
      isGroup: '{str(is_group).lower()}'
    }};
    let currentOffset = {messages_count};
    let isLoading = false;
    let hasMore = {str(messages_count === limit).lower()};
    let currentStartDate = {start_date_str};
    let currentEndDate = {end_date_str};
    let startPicker = null;
    let endPicker = null;

    // 加载可用日期列表并初始化日期选择器
    async function loadAvailableDates() {{
      try {{
        const dateParams = new URLSearchParams(params);
        const response = await fetch(`${{DATES_API}}?${{dateParams.toString()}}`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {{
          const availableDates = data.data;
          
          startPicker = flatpickr('#startDate', {{
            locale: 'zh',
            dateFormat: 'Y-m-d',
            enable: availableDates,
            defaultDate: currentStartDate || null
          }});
          
          endPicker = flatpickr('#endDate', {{
            locale: 'zh',
            dateFormat: 'Y-m-d',
            enable: availableDates,
            defaultDate: currentEndDate || null
          }});
          
          updateFilterInfo();
        }}
      }} catch (error) {{
        console.error('加载日期列表失败:', error);
      }}
    }}

    // 更新筛选信息显示
    function updateFilterInfo() {{
      const infoEl = document.getElementById('filterInfo');
      if (currentStartDate || currentEndDate) {{
        const start = currentStartDate || '最早';
        const end = currentEndDate || '最新';
        infoEl.textContent = `当前显示：${{start}} 至 ${{end}}`;
      }} else {{
        infoEl.textContent = '当前显示：最新一天的消息';
      }}
    }}

    // 应用日期筛选
    function applyDateFilter() {{
      const startDate = startPicker.selectedDates[0];
      const endDate = endPicker.selectedDates[0];
      
      const urlParams = new URLSearchParams({{
        path: params.path,
        userMd5: params.userMd5,
        tableName: params.tableName,
        nickname: '{nickname}',
        isGroup: params.isGroup
      }});
      
      if (startDate) {{
        urlParams.set('startDate', flatpickr.formatDate(startDate, 'Y-m-d'));
      }}
      if (endDate) {{
        urlParams.set('endDate', flatpickr.formatDate(endDate, 'Y-m-d'));
      }}
      
      window.location.href = `/api/chats/view?${{urlParams.toString()}}`;
    }}

    // 清除日期筛选
    function clearDateFilter() {{
      const urlParams = new URLSearchParams({{
        path: params.path,
        userMd5: params.userMd5,
        tableName: params.tableName,
        nickname: '{nickname}',
        isGroup: params.isGroup
      }});
      
      window.location.href = `/api/chats/view?${{urlParams.toString()}}`;
    }}

    // 无限滚动加载更多消息
    async function loadMoreMessages() {{
      if (isLoading || !hasMore) return;
      
      isLoading = true;
      document.getElementById('loading').style.display = 'block';
      document.getElementById('error').style.display = 'none';
      
      try {{
        const loadParams = new URLSearchParams({{
          ...params,
          limit: {limit},
          offset: currentOffset
        }});
        
        if (currentStartDate) loadParams.set('startDate', currentStartDate);
        if (currentEndDate) loadParams.set('endDate', currentEndDate);
        
        const response = await fetch(`${{API_BASE}}?${{loadParams.toString()}}`);
        const data = await response.json();
        
        if (data.success && data.data) {{
          const messages = data.data;
          
          if (messages.length === 0) {{
            hasMore = false;
            document.getElementById('noMore').style.display = 'block';
          }} else {{
            messages.forEach(msg => {{
              const messageEl = createMessageElement(msg);
              document.getElementById('messages').appendChild(messageEl);
            }});
            currentOffset += messages.length;
            hasMore = messages.length === {limit};
          }}
        }} else {{
          throw new Error(data.error || '加载失败');
        }}
      }} catch (error) {{
        document.getElementById('error').textContent = '加载失败: ' + error.message;
        document.getElementById('error').style.display = 'block';
      }} finally {{
        isLoading = false;
        document.getElementById('loading').style.display = 'none';
      }}
    }}

    // 创建消息元素
    function createMessageElement(msg) {{
      const div = document.createElement('div');
      div.className = `message ${{msg.Des === 0 ? 'sent' : 'received'}}`;
      
      const time = new Date(msg.CreateTime * 1000).toLocaleString('zh-CN');
      let html = `<div class="time">${{time}}</div>`;
      
      if (msg.sender) {{
        html += `<div class="sender">${{msg.sender}}</div>`;
      }}
      
      let content = msg.cleanedMessage || msg.Message || '';
      content = formatMessageContent(msg, content);
      html += `<div class="message-bubble">${{content}}</div>`;
      
      div.innerHTML = html;
      return div;
    }}

    // 格式化消息内容
    function formatMessageContent(msg, text) {{
      const type = msg.Type;
      
      if (type === 1) {{
        return escapeHtml(text);
      }} else if (type === 3) {{
        return '[图片]';
      }} else if (type === 34) {{
        return '[语音]';
      }} else if (type === 43) {{
        return '[视频]';
      }} else if (type === 47) {{
        return '[表情]';
      }} else if (type === 49) {{
        return '[链接/文件]';
      }} else if (type === 48) {{
        return '[位置]';
      }} else {{
        return `[消息类型:${{type}}]`;
      }}
    }}

    // HTML 转义
    function escapeHtml(text) {{
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }}

    // 监听滚动事件
    window.addEventListener('scroll', () => {{
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {{
        loadMoreMessages();
      }}
    }});

    // 页面加载时初始化
    loadAvailableDates();
    updateFilterInfo();
  </script>
</body>
</html>
'''
    
    def _format_message_content(self, msg: Dict[str, Any], text: str) -> str:
        """格式化消息内容"""
        msg_type = msg.get('Type', 0)
        
        if msg_type == 1:
            # 文本消息
            return self._escape_html(text)
        elif msg_type == 3:
            return '[图片]'
        elif msg_type == 34:
            return '[语音]'
        elif msg_type == 43:
            return '[视频]'
        elif msg_type == 47:
            return '[表情]'
        elif msg_type == 49:
            return '[链接/文件]'
        elif msg_type == 48:
            return '[位置]'
        else:
            return f'[消息类型:{msg_type}]'
    
    def _escape_html(self, text: str) -> str:
        """HTML 转义"""
        return html.escape(text)

