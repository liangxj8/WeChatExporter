import { WeChatDatabase } from './database';
import { Message, ChatTable } from '../types';

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
    chatInfo: ChatTable
  ): Promise<string> {
    const messages = await this.db.getMessages(documentsPath, userMd5, tableName, 10000);

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>聊天记录 - ${chatInfo.contact.nickname}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .message { margin: 10px 0; padding: 10px; }
    .message.sent { text-align: right; background: #95ec69; border-radius: 10px; }
    .message.received { text-align: left; background: #fff; border: 1px solid #ddd; border-radius: 10px; }
    .time { font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <h1>与 ${chatInfo.contact.nickname} 的聊天记录</h1>
  <p>微信号: ${chatInfo.contact.wechatId}</p>
  <p>消息数量: ${chatInfo.messageCount}</p>
  <hr>
`;

    for (const msg of messages) {
      const time = new Date(msg.CreateTime * 1000).toLocaleString('zh-CN');
      const className = msg.Des === 0 ? 'sent' : 'received';
      const content = this.formatMessageContent(msg);
      
      html += `
  <div class="message ${className}">
    <div class="time">${time}</div>
    <div class="content">${this.escapeHtml(content)}</div>
  </div>
`;
    }

    html += `
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

