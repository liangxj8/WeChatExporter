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
      const time = new Date(msg.createTime * 1000).toLocaleString('zh-CN');
      const className = msg.des === 0 ? 'sent' : 'received';
      
      html += `
  <div class="message ${className}">
    <div class="time">${time}</div>
    <div class="content">${this.escapeHtml(msg.message || '')}</div>
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
        id: msg.mesLocalID,
        serverId: msg.mesSvrID,
        time: new Date(msg.createTime * 1000).toISOString(),
        content: msg.message,
        type: msg.messageType,
        direction: msg.des === 0 ? 'sent' : 'received',
      })),
    };
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

