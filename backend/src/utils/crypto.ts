import crypto from 'crypto';

export function md5(input: string): string {
  return crypto.createHash('md5').update(input).digest('hex');
}

/**
 * 将 hex 字符串转换为 UTF-8 字符串
 */
function hexToUtf8(hexString: string): string {
  if (!hexString || hexString.length === 0) {
    return '';
  }

  try {
    const buffer = Buffer.from(hexString, 'hex');
    return buffer.toString('utf8');
  } catch (error) {
    return '';
  }
}

/**
 * 解析结构化的用户信息 hex 字符串
 * 格式：标记(2位) + 长度(2位) + 数据(长度*2位)
 * 标记说明：
 *   0a - nickname (昵称)
 *   12 - wechatID (微信号)
 *   1a - remark (备注)
 */
export function decode_user_name_info(quotedHexString: string | null): string {
  if (!quotedHexString) return '';
  
  try {
    // 移除 X' 或 x' 前缀和 ' 后缀
    let hexString = quotedHexString.trim();
    if (hexString.toLowerCase().startsWith("x'")) {
      hexString = hexString.substring(2);
    }
    if (hexString.endsWith("'")) {
      hexString = hexString.substring(0, hexString.length - 1);
    }

    // 解析结构化数据
    const allData: Record<string, string> = {};
    let i = 0;

    while (i < hexString.length - 4) {
      // 读取标记（2位hex）
      const currentMark = hexString.substring(i, i + 2);
      
      // 读取数据长度（2位hex）
      const dataLengthHex = hexString.substring(i + 2, i + 4);
      const dataLength = parseInt(dataLengthHex, 16) * 2; // hex转dec，再乘2因为是hex字符串

      if (dataLength <= 0 || i + 4 + dataLength > hexString.length) {
        break; // 数据长度异常，退出
      }

      // 读取数据
      const hexData = hexString.substring(i + 4, i + 4 + dataLength);
      const utf8Data = hexToUtf8(hexData);

      // 存储
      allData[currentMark] = utf8Data;

      // 移动指针
      i += 4 + dataLength;
    }

    // 优先返回备注(1a)，其次昵称(0a)，最后微信号(12)
    if (allData['1a'] && allData['1a'].trim()) {
      return allData['1a'].trim();
    }
    if (allData['0a'] && allData['0a'].trim()) {
      return allData['0a'].trim();
    }
    if (allData['12'] && allData['12'].trim()) {
      return allData['12'].trim();
    }

    return '';
  } catch (error) {
    console.error('decode_user_name_info error:', error);
    return '';
  }
}

/**
 * 生成友好的显示名称
 */
export function getFriendlyName(wechatId: string, nickname: string, isGroup: boolean): string {
  // 如果有昵称且不是 wxid 格式，直接使用
  if (nickname && !nickname.startsWith('wxid_') && nickname !== wechatId) {
    return nickname;
  }
  
  // 生成友好名称
  const prefix = isGroup ? '群聊' : '联系人';
  
  // 如果是 wxid 格式，提取一部分作为标识
  if (wechatId.startsWith('wxid_')) {
    const idPart = wechatId.substring(5, 13); // wxid_ 后面取8位
    return `${prefix}-${idPart}`;
  }
  
  // 如果是群聊 ID (@chatroom 结尾)
  if (wechatId.includes('@chatroom')) {
    const idPart = wechatId.substring(0, 8);
    return `${prefix}-${idPart}`;
  }
  
  // 其他格式，直接取前8位
  const idPart = wechatId.substring(0, 8);
  return `${prefix}-${idPart}`;
}

