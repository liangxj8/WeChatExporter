import { WeChatDatabase } from './database';
import { Message, ChatTable, Contact } from '../types';
import { md5, decode_user_name_info, getFriendlyName } from '../utils/crypto';

export class WeChatExporter {
  private db: WeChatDatabase;

  constructor() {
    this.db = new WeChatDatabase();
  }

  /**
   * 导出聊天记录为 HTML 格式
   */
  async exportToHtml(
    documentsPath: string,
    userMd5: string,
    tableName: string,
    chatInfo: ChatTable,
    limit: number = 100,
    offset: number = 0,
    startDate?: string,
    endDate?: string
  ): Promise<string> {
    const messages = await this.db.getMessages(
      documentsPath, 
      userMd5, 
      tableName, 
      limit,
      offset,
      startDate,
      endDate
    );
    
    // 如果是群聊，加载联系人信息用于解析昵称
    let contactsMap: Map<string, Contact> | null = null;
    if (chatInfo.contact.isGroup) {
      contactsMap = await this.db.getContacts(documentsPath, userMd5);
    }

    // 构建 URL 参数
    const urlParams = new URLSearchParams({
      path: documentsPath,
      userMd5,
      tableName,
      nickname: chatInfo.contact.nickname,
      isGroup: chatInfo.contact.isGroup ? 'true' : 'false',
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>聊天记录 - ${this.escapeHtml(chatInfo.contact.nickname)}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .header { position: sticky; top: 0; background: #f5f5f5; padding: 10px 0; z-index: 100; border-bottom: 1px solid #ddd; }
    .header h1 { color: #333; margin: 0 0 10px 0; }
    .header .info { color: #666; margin: 5px 0; font-size: 14px; }
    .date-filter { margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .date-filter label { margin-right: 10px; font-weight: bold; }
    .date-filter input[type="date"] { padding: 5px; margin-right: 10px; border: 1px solid #ddd; border-radius: 4px; }
    .date-filter button { padding: 6px 15px; background: #07c160; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px; }
    .date-filter button:hover { background: #06ad56; }
    .date-filter button.secondary { background: #999; }
    .date-filter button.secondary:hover { background: #777; }
    
    .messages-container { margin-top: 20px; }
    .message { margin: 10px 0; padding: 10px; clear: both; }
    .message.sent { text-align: right; }
    .message.received { text-align: left; }
    .message-bubble { display: inline-block; max-width: 70%; padding: 10px 15px; border-radius: 10px; word-wrap: break-word; white-space: pre-wrap; }
    .message.sent .message-bubble { background: #95ec69; }
    .message.received .message-bubble { background: #fff; border: 1px solid #ddd; }
    .time { font-size: 12px; color: #999; margin-bottom: 5px; }
    .sender { font-size: 12px; color: #666; font-weight: bold; margin-bottom: 3px; }
    
    .loading { text-align: center; padding: 20px; color: #999; }
    .no-more { text-align: center; padding: 20px; color: #999; font-size: 14px; }
    .error { text-align: center; padding: 20px; color: #f56c6c; }
  </style>
</head>
<body>
  <div class="header">
    <h1>与 ${this.escapeHtml(chatInfo.contact.nickname)} 的聊天记录</h1>
    <p class="info">微信号: ${this.escapeHtml(chatInfo.contact.wechatId)}</p>
    <div class="date-filter">
      <label>日期筛选：</label>
      <input type="date" id="startDate" value="${startDate || ''}">
      <span>至</span>
      <input type="date" id="endDate" value="${endDate || ''}">
      <button onclick="applyDateFilter()">筛选</button>
      <button class="secondary" onclick="clearDateFilter()">清除</button>
      <span id="filterInfo" style="margin-left: 15px; color: #666; font-size: 14px;"></span>
    </div>
  </div>
  
  <div class="messages-container" id="messages">
`;

    for (const msg of messages) {
      const time = new Date(msg.CreateTime * 1000).toLocaleString('zh-CN');
      const className = msg.Des === 0 ? 'sent' : 'received';
      let sender = '';
      let messageToFormat = msg;
      
      // 如果是群聊文本消息，先提取发送者
      if (contactsMap && msg.Type === 1 && msg.Message && msg.Message.includes(':\n')) {
        const parts = msg.Message.split(':\n');
        if (parts.length >= 2) {
          const senderId = parts[0].trim();
          const messageText = parts.slice(1).join(':\n');
          
          // 查找发送者昵称
          const senderMd5 = md5(senderId);
          const senderContact = contactsMap.get(senderMd5);
          let senderName = '';
          
          if (senderContact) {
            senderName = decode_user_name_info(senderContact.dbContactRemark);
          }
          
          // 如果没找到昵称，使用友好名称
          if (!senderName || senderName === senderId) {
            senderName = getFriendlyName(senderId, '', false);
          }
          
          sender = senderName;
          // 创建一个新的消息对象，Message 字段只包含实际内容
          messageToFormat = { ...msg, Message: messageText };
        }
      }
      
      // 格式化消息内容
      const content = this.formatMessageContent(messageToFormat);
      
      html += `
  <div class="message ${className}">
    <div class="time">${this.escapeHtml(time)}</div>
    ${sender ? `<div class="sender">${this.escapeHtml(sender)}</div>` : ''}
    <div class="message-bubble">${this.escapeHtml(content)}</div>
  </div>
`;
    }

    html += `
  </div>
  
  <div class="loading" id="loading" style="display: none;">加载中...</div>
  <div class="no-more" id="noMore" style="display: none;">没有更多消息了</div>
  <div class="error" id="error" style="display: none;"></div>

  <script>
    const API_BASE = window.location.origin + '/api/chats/view/messages';
    const params = new URLSearchParams(window.location.search);
    let currentOffset = ${messages.length};
    let isLoading = false;
    let hasMore = ${messages.length === limit ? 'true' : 'false'};
    let currentStartDate = params.get('startDate') || '';
    let currentEndDate = params.get('endDate') || '';

    // 更新筛选信息显示
    function updateFilterInfo() {
      const info = document.getElementById('filterInfo');
      if (currentStartDate || currentEndDate) {
        const start = currentStartDate || '最早';
        const end = currentEndDate || '最新';
        info.textContent = \`当前筛选: \${start} 至 \${end}\`;
      } else {
        info.textContent = '显示最新一天的消息';
      }
    }
    updateFilterInfo();

    // 应用日期筛选
    function applyDateFilter() {
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      
      const newParams = new URLSearchParams(window.location.search);
      if (startDate) newParams.set('startDate', startDate);
      else newParams.delete('startDate');
      
      if (endDate) newParams.set('endDate', endDate);
      else newParams.delete('endDate');
      
      window.location.search = newParams.toString();
    }

    // 清除日期筛选
    function clearDateFilter() {
      document.getElementById('startDate').value = '';
      document.getElementById('endDate').value = '';
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete('startDate');
      newParams.delete('endDate');
      window.location.search = newParams.toString();
    }

    // 加载更多消息
    async function loadMore() {
      if (isLoading || !hasMore) return;
      
      isLoading = true;
      document.getElementById('loading').style.display = 'block';
      document.getElementById('error').style.display = 'none';
      
      try {
        const fetchParams = new URLSearchParams({
          path: params.get('path'),
          userMd5: params.get('userMd5'),
          tableName: params.get('tableName'),
          isGroup: params.get('isGroup') || 'false',
          limit: '100',
          offset: String(currentOffset),
          ...(currentStartDate && { startDate: currentStartDate }),
          ...(currentEndDate && { endDate: currentEndDate }),
        });
        
        const response = await fetch(\`\${API_BASE}?\${fetchParams.toString()}\`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          appendMessages(data.data);
          currentOffset += data.data.length;
          hasMore = data.data.length === 100;
        } else {
          hasMore = false;
          document.getElementById('noMore').style.display = 'block';
        }
      } catch (error) {
        console.error('加载失败:', error);
        document.getElementById('error').textContent = '加载失败，请刷新重试';
        document.getElementById('error').style.display = 'block';
      } finally {
        isLoading = false;
        document.getElementById('loading').style.display = 'none';
      }
    }

    // 添加消息到页面
    function appendMessages(messages) {
      const container = document.getElementById('messages');
      
      messages.forEach(msg => {
        const time = new Date(msg.CreateTime * 1000).toLocaleString('zh-CN');
        const className = msg.Des === 0 ? 'sent' : 'received';
        
        // 使用后端解析好的发送者和消息内容
        const sender = msg.sender || '';
        const content = formatMessageContent({
          ...msg,
          Message: msg.cleanedMessage || msg.Message
        });
        
        const html = \`
          <div class="message \${className}">
            <div class="time">\${escapeHtml(time)}</div>
            \${sender ? \`<div class="sender">\${escapeHtml(sender)}</div>\` : ''}
            <div class="message-bubble">\${escapeHtml(content)}</div>
          </div>
        \`;
        container.innerHTML += html;
      });
    }
    
    // 格式化消息内容
    function formatMessageContent(msg) {
      switch (msg.Type) {
        case 1: return msg.Message || '[文本消息]';
        case 3: return '[图片]';
        case 34: return '[语音]';
        case 43: return '[视频]';
        case 47: return '[表情]';
        case 48: return '[位置]';
        case 49: return '[分享]';
        case 10000: return msg.Message || '[系统消息]';
        default: return msg.Message || \`[消息类型: \${msg.Type}]\`;
      }
    }
    
    // HTML 转义
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // 滚动监听
    window.addEventListener('scroll', () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMore();
      }
    });
  </script>
</body>
</html>
`;

    return html;
  }

  /**
   * 导出聊天记录为 JSON 格式
   */
  async exportToJson(
    documentsPath: string,
    userMd5: string,
    tableName: string,
    chatInfo: ChatTable
  ): Promise<object> {
    const messages = await this.db.getMessages(documentsPath, userMd5, tableName, 10000);

    return {
      chatInfo: {
        wechatId: chatInfo.contact.wechatId,
        nickname: chatInfo.contact.nickname,
        isGroup: chatInfo.contact.isGroup,
        messageCount: chatInfo.messageCount,
      },
      messages: messages.map(msg => ({
        id: msg.MesLocalID,
        serverId: msg.MesSvrID,
        time: new Date(msg.CreateTime * 1000).toISOString(),
        content: this.formatMessageContent(msg),
        rawContent: msg.Type === 1 ? msg.Message : undefined, // 仅文本消息保留原始内容
        type: msg.Type,
        direction: msg.Des === 0 ? 'sent' : 'received',
      })),
    };
  }

  /**
   * 根据消息类型格式化内容
   */
  private formatMessageContent(msg: Message): string {
    // 检查消息内容是否可能是二进制数据或乱码
    const isBinaryOrCorrupt = (text: string): boolean => {
      if (!text || text.length === 0) return false;
      
      // 检查是否包含大量控制字符或非打印字符
      let controlCharCount = 0;
      for (let i = 0; i < Math.min(text.length, 100); i++) {
        const code = text.charCodeAt(i);
        // 控制字符（0-31，除了常见的换行、制表符等）和高位字符
        if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127 || code === 65533) {
          controlCharCount++;
        }
      }
      
      // 如果超过 20% 是控制字符，认为是二进制数据
      return controlCharCount > Math.min(text.length, 100) * 0.2;
    };

    // 从 XML 中提取标签内容的辅助函数
    const extractXmlTag = (text: string, tagName: string): string | null => {
      const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tagName}>`, 'i');
      const cdataMatch = text.match(regex);
      if (cdataMatch && cdataMatch[1]) {
        return cdataMatch[1].trim();
      }
      
      const simpleRegex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`, 'i');
      const simpleMatch = text.match(simpleRegex);
      if (simpleMatch && simpleMatch[1]) {
        return simpleMatch[1].trim();
      }
      
      return null;
    };

    switch (msg.Type) {
      case 1: // 文本消息
        if (msg.Message && !isBinaryOrCorrupt(msg.Message)) {
          return msg.Message;
        }
        return '[文本消息]';
      
      case 3: // 图片
        return '[图片]';
      
      case 34: // 语音
        // 尝试提取语音时长
        if (msg.Message && msg.Message.includes('voicelength')) {
          const lengthMatch = msg.Message.match(/voicelength="(\d+)"/);
          if (lengthMatch && lengthMatch[1]) {
            const seconds = Math.ceil(parseInt(lengthMatch[1]) / 1000);
            return `[语音 ${seconds}"]`;
          }
        }
        return '[语音]';
      
      case 43: // 视频
        // 尝试提取视频时长
        if (msg.Message && msg.Message.includes('playlength')) {
          const lengthMatch = msg.Message.match(/playlength="(\d+)"/);
          if (lengthMatch && lengthMatch[1]) {
            const seconds = parseInt(lengthMatch[1]);
            return `[视频 ${seconds}"]`;
          }
        }
        return '[视频]';
      
      case 47: // 表情/动画表情
        if (msg.Message) {
          // 尝试提取表情描述
          const emojiDesc = extractXmlTag(msg.Message, 'fromusername');
          if (emojiDesc && !isBinaryOrCorrupt(emojiDesc)) {
            return `[表情]`;
          }
          
          // 检查是否有文字描述
          if (msg.Message.includes('[') && msg.Message.includes(']')) {
            const textMatch = msg.Message.match(/\[([^\]]+)\]/);
            if (textMatch && textMatch[1] && !isBinaryOrCorrupt(textMatch[1])) {
              return `[表情: ${textMatch[1]}]`;
            }
          }
        }
        return '[表情]';
      
      case 48: // 位置
        if (msg.Message) {
          // 提取位置名称
          const locationName = extractXmlTag(msg.Message, 'label');
          if (locationName && !isBinaryOrCorrupt(locationName)) {
            return `[位置] ${locationName}`;
          }
        }
        return '[位置]';
      
      case 49: // 分享链接/小程序/文件
        if (msg.Message) {
          // 提取标题
          const title = extractXmlTag(msg.Message, 'title');
          if (title && !isBinaryOrCorrupt(title)) {
            // 判断是否是小程序
            if (msg.Message.includes('weapp')) {
              return `[小程序] ${title}`;
            }
            // 判断是否是文件
            if (msg.Message.includes('type="6"') || msg.Message.includes('appmsg_file_type')) {
              const fileExt = msg.Message.match(/fileext="([^"]+)"/);
              if (fileExt && fileExt[1]) {
                return `[文件] ${title}.${fileExt[1]}`;
              }
              return `[文件] ${title}`;
            }
            // 默认是分享链接
            return `[分享] ${title}`;
          }
        }
        return '[分享]';
      
      case 10000: // 系统消息
        if (msg.Message && !isBinaryOrCorrupt(msg.Message)) {
          return msg.Message;
        }
        return '[系统消息]';
      
      case 10002: // 撤回消息
        if (msg.Message && !isBinaryOrCorrupt(msg.Message)) {
          return `[撤回] ${msg.Message}`;
        }
        return '[撤回了一条消息]';
      
      default:
        // 其他类型，如果内容看起来是正常文本则显示，否则显示类型标签
        if (msg.Message && !isBinaryOrCorrupt(msg.Message)) {
          return msg.Message;
        }
        return `[消息类型: ${msg.Type}]`;
    }
  }

  /**
   * HTML 转义
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

