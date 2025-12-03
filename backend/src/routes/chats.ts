import { Router, Request, Response } from 'express';
import { WeChatDatabase } from '../services/database';
import { WeChatExporter } from '../services/exporter';
import { ChatTable, Message, ApiResponse } from '../types';

const router = Router();
const db = new WeChatDatabase();
const exporter = new WeChatExporter();

/**
 * GET /api/chats?path=/path/to/documents&userMd5=xxx&limit=0
 * 获取聊天列表
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const documentsPath = req.query.path as string;
    const userMd5 = req.query.userMd5 as string;
    const messageLimit = parseInt(req.query.limit as string) || 0;

    if (!documentsPath || !userMd5) {
      return res.status(400).json({
        success: false,
        error: '请提供 path 和 userMd5 参数',
      } as ApiResponse<null>);
    }

    const chatTables = await db.getChatTables(documentsPath, userMd5, messageLimit);

    console.log(`✅ 返回 ${chatTables.length} 个聊天`);

    res.json({
      success: true,
      data: chatTables,
    } as ApiResponse<ChatTable[]>);
  } catch (error: any) {
    console.error('获取聊天列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '服务器错误',
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/chats/messages?path=/path/to/documents&userMd5=xxx&table=Chat_xxx&limit=100&offset=0
 * 获取消息列表
 */
router.get('/messages', async (req: Request, res: Response) => {
  try {
    const documentsPath = req.query.path as string;
    const userMd5 = req.query.userMd5 as string;
    const tableName = req.query.table as string;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!documentsPath || !userMd5 || !tableName) {
      return res.status(400).json({
        success: false,
        error: '请提供 path, userMd5, table 参数',
      } as ApiResponse<null>);
    }

    const messages = await db.getMessages(documentsPath, userMd5, tableName, limit, offset);

    console.log(`✅ 返回 ${messages.length} 条消息`);

    res.json({
      success: true,
      data: messages,
    } as ApiResponse<Message[]>);
  } catch (error: any) {
    console.error('获取消息列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '服务器错误',
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/chats/view
 * 查看聊天记录 HTML
 * Query: path, userMd5, tableName, nickname, isGroup, startDate, endDate
 */
router.get('/view', async (req: Request, res: Response) => {
  try {
    const { 
      path: documentsPath, 
      userMd5, 
      tableName, 
      nickname,
      isGroup,
      startDate,
      endDate
    } = req.query;

    if (!documentsPath || !userMd5 || !tableName) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>错误</title></head>
        <body><h1>参数错误</h1><p>缺少必要参数</p></body>
        </html>
      `);
    }

    // 构造 chatInfo 用于导出
    const chatInfo: ChatTable = {
      tableName: tableName as string,
      messageCount: 0,
      contact: {
        md5: '',
        wechatId: '',
        nickname: (nickname as string) || '未知',
        isGroup: isGroup === 'true',
      },
    };

    const html = await exporter.exportToHtml(
      documentsPath as string,
      userMd5 as string,
      tableName as string,
      chatInfo,
      100, // limit
      0,   // offset
      startDate as string | undefined,
      endDate as string | undefined
    );
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error: any) {
    console.error('查看聊天记录失败:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>错误</title></head>
      <body><h1>加载失败</h1><p>${error.message || '服务器错误'}</p></body>
      </html>
    `);
  }
});

/**
 * GET /api/chats/view/messages
 * 获取消息列表（用于无限滚动）
 * Query: path, userMd5, tableName, isGroup, limit, offset, startDate, endDate
 */
router.get('/view/messages', async (req: Request, res: Response) => {
  try {
    const { 
      path: documentsPath, 
      userMd5, 
      tableName,
      isGroup,
      limit = '100',
      offset = '0',
      startDate,
      endDate
    } = req.query;

    if (!documentsPath || !userMd5 || !tableName) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数',
      } as ApiResponse<null>);
    }

    const messages = await db.getMessages(
      documentsPath as string,
      userMd5 as string,
      tableName as string,
      parseInt(limit as string),
      parseInt(offset as string),
      startDate as string | undefined,
      endDate as string | undefined
    );

    // 如果是群聊，解析发送者昵称
    let processedMessages = messages;
    if (isGroup === 'true') {
      const contactsMap = await db.getContacts(documentsPath as string, userMd5 as string);
      const { md5 } = await import('../utils/crypto');
      const { decode_user_name_info, getFriendlyName } = await import('../utils/crypto');
      
      processedMessages = messages.map(msg => {
        const processed: any = { ...msg };
        
        // 如果是文本消息且包含发送者信息
        if (msg.Type === 1 && msg.Message && msg.Message.includes(':\n')) {
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
            
            processed.sender = senderName;
            processed.cleanedMessage = messageText;
          }
        }
        
        return processed;
      });
    }

    res.json({
      success: true,
      data: processedMessages,
    } as ApiResponse<any[]>);
  } catch (error: any) {
    console.error('获取消息列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '服务器错误',
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/chats/download
 * 下载聊天记录（JSON 格式）
 * Body: { path, userMd5, table, chatInfo }
 */
router.post('/download', async (req: Request, res: Response) => {
  try {
    const { path: documentsPath, userMd5, table: tableName, chatInfo } = req.body;

    if (!documentsPath || !userMd5 || !tableName || !chatInfo) {
      return res.status(400).json({
        success: false,
        error: '请提供完整的参数',
      } as ApiResponse<null>);
    }

    // 对文件名进行编码，避免特殊字符导致 header 错误
    const safeFilename = encodeURIComponent(chatInfo.contact.nickname);
    
    const json = await exporter.exportToJson(documentsPath, userMd5, tableName, chatInfo);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${safeFilename}_chat.json`);
    res.json(json);
  } catch (error: any) {
    console.error('下载聊天记录失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '服务器错误',
    } as ApiResponse<null>);
  }
});

export default router;

