import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { Contact, ChatTable, Message } from '../types';
import { md5, decode_user_name_info, getFriendlyName } from '../utils/crypto';

let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

async function getSQL() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

export class WeChatDatabase {
  /**
   * 打开联系人数据库
   */
  async openContactDb(documentsPath: string, userMd5: string): Promise<SqlJsDatabase | null> {
    const dbPath = path.join(documentsPath, userMd5, 'DB', 'WCDB_Contact.sqlite');
    
    if (!fs.existsSync(dbPath)) {
      console.log('WCDB_Contact.sqlite 不存在:', dbPath);
      return null;
    }

    try {
      const SQL = await getSQL();
      const buffer = fs.readFileSync(dbPath);
      return new SQL.Database(buffer);
    } catch (error) {
      console.error('打开联系人数据库失败:', error);
      return null;
    }
  }

  /**
   * 打开消息数据库
   */
  async openMessageDb(documentsPath: string, userMd5: string, dbIndex: number): Promise<SqlJsDatabase | null> {
    const dbPath = path.join(documentsPath, userMd5, 'DB', `message_${dbIndex}.sqlite`);
    
    if (!fs.existsSync(dbPath)) {
      return null;
    }

    try {
      const SQL = await getSQL();
      const buffer = fs.readFileSync(dbPath);
      return new SQL.Database(buffer);
    } catch (error) {
      console.error(`打开 message_${dbIndex}.sqlite 失败:`, error);
      return null;
    }
  }

  /**
   * 获取联系人列表
   */
  async getContacts(documentsPath: string, userMd5: string): Promise<Map<string, Contact>> {
    const contactsMap = new Map<string, Contact>();
    const db = await this.openContactDb(documentsPath, userMd5);

    if (!db) {
      return contactsMap;
    }

    try {
      const results = db.exec('SELECT *, lower(quote(dbContactRemark)) as cr FROM Friend');
      
      if (results.length > 0 && results[0].values.length > 0) {
        const columns = results[0].columns;
        const userNameIdx = columns.indexOf('userName');
        const crIdx = columns.indexOf('cr');

        for (const row of results[0].values) {
          const userName = row[userNameIdx] as string;
          const cr = row[crIdx] as string;
          const nameMd5 = md5(userName);
          
          contactsMap.set(nameMd5, {
            userName,
            dbContactRemark: cr,
          });
        }
      }

      console.log(`从 WCDB_Contact.sqlite 读取到 ${contactsMap.size} 个联系人`);
    } catch (error) {
      console.error('读取联系人失败:', error);
    } finally {
      db.close();
    }

    return contactsMap;
  }

  /**
   * 获取聊天表列表
   */
  async getChatTables(documentsPath: string, userMd5: string, messageLimit: number = 0): Promise<ChatTable[]> {
    const chatTables: ChatTable[] = [];
    const contactsMap = await this.getContacts(documentsPath, userMd5);

    // 遍历 message_1.sqlite 到 message_4.sqlite
    for (let i = 1; i <= 4; i++) {
      const db = await this.openMessageDb(documentsPath, userMd5, i);
      if (!db) continue;

      try {
        const results = db.exec(`
          SELECT * FROM SQLITE_MASTER 
          WHERE type = 'table' 
          AND (name LIKE 'Chat/_%' ESCAPE '/' OR name LIKE 'ChatExt2/_%' ESCAPE '/')
        `);

        if (results.length > 0 && results[0].values.length > 0) {
          const columns = results[0].columns;
          const nameIdx = columns.indexOf('name');

          for (const row of results[0].values) {
            const tableName = row[nameIdx] as string;
            
            // 获取消息数量
            const countResults = db.exec(`SELECT COUNT(*) as count FROM "${tableName}"`);
            const messageCount = countResults[0]?.values[0]?.[0] as number || 0;

            // 如果消息数量太少，跳过
            if (messageLimit > 0 && messageCount <= messageLimit) {
              continue;
            }

            // 从表名提取聊天对象的 MD5
            const chatterMd5 = this.extractChatterMd5(tableName);
            const contact = contactsMap.get(chatterMd5);
            
            // 获取基本信息
            const wechatId = contact?.userName || '未知';
            const isGroup = wechatId.includes('@chatroom');

            // 获取最后一条消息（用于排序和预览）
            let lastMessageTime = 0;
            let lastMessagePreview = '';
            try {
              const lastMsgResults = db.exec(`
                SELECT CreateTime, Message, Type 
                FROM "${tableName}" 
                ORDER BY CreateTime DESC 
                LIMIT 1
              `);
              
              if (lastMsgResults.length > 0 && lastMsgResults[0].values.length > 0) {
                const lastMsg = lastMsgResults[0].values[0];
                lastMessageTime = lastMsg[0] as number || 0;
                
                // 处理可能是 Uint8Array 的 Message 字段
                let msgContent = '';
                if (typeof lastMsg[1] === 'string') {
                  msgContent = lastMsg[1];
                } else if (lastMsg[1] instanceof Uint8Array) {
                  msgContent = new TextDecoder('utf-8').decode(lastMsg[1]);
                } else if (lastMsg[1]) {
                  msgContent = String(lastMsg[1]);
                }
                
                const msgType = lastMsg[2] as number || 0;
                
                // 生成消息预览
                if (msgType === 1) {
                  // 文本消息
                  let preview = msgContent;
                  
                  // 如果是群聊，解析发送者昵称
                  if (isGroup && msgContent.includes(':\n')) {
                    const parts = msgContent.split(':\n');
                    if (parts.length >= 2) {
                      const senderId = parts[0].trim();
                      const content = parts.slice(1).join(':\n');
                      
                      // 查找发送者的昵称
                      const senderMd5 = md5(senderId);
                      const sender = contactsMap.get(senderMd5);
                      let senderName = '';
                      
                      if (sender) {
                        senderName = decode_user_name_info(sender.dbContactRemark);
                      }
                      
                      // 如果没找到昵称，使用友好名称
                      if (!senderName || senderName === senderId) {
                        senderName = getFriendlyName(senderId, '', false);
                      }
                      
                      preview = `${senderName}: ${content}`;
                    }
                  }
                  
                  // 限制长度
                  if (preview.length > 40) {
                    preview = preview.substring(0, 40) + '...';
                  }
                  
                  lastMessagePreview = preview;
                } else if (msgType === 3) {
                  lastMessagePreview = '[图片]';
                } else if (msgType === 34) {
                  lastMessagePreview = '[语音]';
                } else if (msgType === 43) {
                  lastMessagePreview = '[视频]';
                } else if (msgType === 47) {
                  lastMessagePreview = '[表情]';
                } else if (msgType === 49) {
                  lastMessagePreview = '[链接]';
                } else {
                  lastMessagePreview = '[消息]';
                }
              }
            } catch (e) {
              // 忽略获取最后消息失败的情况
            }
            
            // 尝试解析昵称
            let nickname = '';
            if (contact) {
              nickname = decode_user_name_info(contact.dbContactRemark);
            }
            
            // 如果没有昵称或昵称就是 wxid，使用友好名称
            if (!nickname || nickname === wechatId || nickname.startsWith('wxid_')) {
              nickname = getFriendlyName(wechatId, nickname, isGroup);
            }

            chatTables.push({
              tableName,
              messageCount,
              contact: {
                md5: chatterMd5,
                wechatId,
                nickname,
                isGroup,
              },
              lastMessageTime,
              lastMessagePreview,
              // 不设置 isPinned，纯按时间排序
            });
          }
        }
      } catch (error) {
        console.error(`扫描 message_${i}.sqlite 失败:`, error);
      } finally {
        db.close();
      }
    }

    // 按最后消息时间倒序排列（最近的聊天在最前面）
    chatTables.sort((a, b) => {
      const timeA = a.lastMessageTime || 0;
      const timeB = b.lastMessageTime || 0;
      return timeB - timeA; // 倒序：新的在前
    });

    console.log(`找到 ${chatTables.length} 个聊天表（已按最后消息时间倒序排列）`);
    return chatTables;
  }

  /**
   * 获取消息列表
   * @param startDate - 开始日期（YYYY-MM-DD），如果未指定则默认只返回最新一天
   * @param endDate - 结束日期（YYYY-MM-DD）
   */
  async getMessages(
    documentsPath: string,
    userMd5: string,
    tableName: string,
    limit: number = 100,
    offset: number = 0,
    startDate?: string,
    endDate?: string
  ): Promise<Message[]> {
    const messages: Message[] = [];

    // 尝试从各个 message 数据库中查找
    for (let i = 1; i <= 4; i++) {
      const db = await this.openMessageDb(documentsPath, userMd5, i);
      if (!db) continue;

      try {
        // 检查表是否存在
        const tableExistsResults = db.exec(`
          SELECT name FROM SQLITE_MASTER 
          WHERE type = 'table' AND name = '${tableName}'
        `);

        if (tableExistsResults.length > 0 && tableExistsResults[0].values.length > 0) {
          // 构建日期筛选条件
          let dateCondition = '';
          
          if (startDate || endDate) {
            // 用户指定了日期范围
            const conditions: string[] = [];
            if (startDate) {
              const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
              conditions.push(`CreateTime >= ${startTimestamp}`);
            }
            if (endDate) {
              const endTimestamp = Math.floor(new Date(endDate + ' 23:59:59').getTime() / 1000);
              conditions.push(`CreateTime <= ${endTimestamp}`);
            }
            dateCondition = 'WHERE ' + conditions.join(' AND ');
          } else {
            // 默认只返回最新一天的数据
            // 先查询最新消息的时间
            const maxTimeResults = db.exec(`
              SELECT MAX(CreateTime) as maxTime FROM "${tableName}"
            `);
            
            if (maxTimeResults.length > 0 && maxTimeResults[0].values.length > 0) {
              const maxTime = maxTimeResults[0].values[0][0] as number;
              if (maxTime) {
                // 计算最新消息当天的开始时间（00:00:00）
                const maxDate = new Date(maxTime * 1000);
                maxDate.setHours(0, 0, 0, 0);
                const dayStartTimestamp = Math.floor(maxDate.getTime() / 1000);
                dateCondition = `WHERE CreateTime >= ${dayStartTimestamp}`;
              }
            }
          }

          const results = db.exec(`
            SELECT * FROM "${tableName}" 
            ${dateCondition}
            ORDER BY CreateTime DESC 
            LIMIT ${limit} OFFSET ${offset}
          `);

          if (results.length > 0 && results[0].values.length > 0) {
            const columns = results[0].columns;
            
            for (const row of results[0].values) {
              const message: any = {};
              columns.forEach((col: string, idx: number) => {
                let value = row[idx];
                
                // 如果是 Message 字段且是 Uint8Array，转换为字符串
                if (col === 'Message' && value instanceof Uint8Array) {
                  value = new TextDecoder('utf-8').decode(value);
                }
                
                message[col] = value;
              });
              messages.push(message as Message);
            }
          }

          db.close();
          break;
        }
      } catch (error) {
        console.error(`从 message_${i}.sqlite 读取消息失败:`, error);
      } finally {
        if (db) db.close();
      }
    }

    return messages;
  }

  /**
   * 从表名提取聊天对象的 MD5
   */
  private extractChatterMd5(tableName: string): string {
    // tableName 格式: Chat_xxxxx 或 ChatExt2_xxxxx
    const parts = tableName.split('_');
    return parts.length > 1 ? parts[1] : '';
  }
}

