import fs from 'fs';
import path from 'path';
import { md5 } from '../utils/crypto';
import { UserInfo } from '../types';

export class WeChatParser {
  /**
   * 解析 LoginInfo2.dat 文件，提取微信号和昵称
   * 核心算法从旧代码 parseLoginInfo 迁移
   */
  parseLoginInfo(documentsPath: string): Map<string, UserInfo> {
    const userInfoMap = new Map<string, UserInfo>();
    const loginInfoPath = path.join(documentsPath, 'LoginInfo2.dat');

    if (!fs.existsSync(loginInfoPath)) {
      console.log('LoginInfo2.dat 不存在');
      return userInfoMap;
    }

    try {
      const buffer = fs.readFileSync(loginInfoPath);
      const content = buffer.toString('binary');

      // 查找所有 wxid_ 模式的微信号
      const wxidPattern = /(wxid_[a-z0-9]{10,20})/g;
      const matches = content.match(wxidPattern);

      if (!matches) {
        console.log('未找到任何微信号');
        return userInfoMap;
      }

      // 去重
      const uniqueWxids = Array.from(new Set(matches));
      console.log(`LoginInfo2.dat 中找到 ${uniqueWxids.length} 个微信号:`, uniqueWxids);

      // 为每个微信号提取昵称
      for (const wxid of uniqueWxids) {
        const wxidIndex = content.indexOf(wxid);

        if (wxidIndex > -1) {
          // 在微信号后面的 100 个字节内查找昵称
          const afterWxid = content.substring(wxidIndex + wxid.length, wxidIndex + wxid.length + 100);
          const possibleNames: string[] = [];
          let currentName = '';

          // 提取可打印字符串
          for (let k = 0; k < afterWxid.length; k++) {
            const charCode = afterWxid.charCodeAt(k);
            // ASCII 可打印字符或中文字符
            if ((charCode >= 0x20 && charCode <= 0x7E) || charCode >= 0x4E00) {
              currentName += afterWxid[k];
            } else {
              if (currentName.length >= 2 && currentName.length <= 30) {
                possibleNames.push(currentName);
              }
              currentName = '';
            }
          }

          // 过滤出最可能的昵称
          let nickname = '';
          for (const name of possibleNames) {
            const trimmed = name.trim();
            // 排除全大写、纯数字、纯符号的字符串
            if (
              trimmed &&
              !/^[A-Z_]+$/.test(trimmed) &&
              !/^\+?\d+$/.test(trimmed) &&
              !/^[^a-zA-Z0-9\u4e00-\u9fa5]+$/.test(trimmed)
            ) {
              nickname = trimmed;
              break;
            }
          }

          // 计算 MD5
          const wxidMd5 = md5(wxid);
          userInfoMap.set(wxidMd5, {
            md5: wxidMd5,
            wechatId: wxid,
            nickname: nickname || wxid,
          });
        }
      }

      console.log(`成功解析 ${userInfoMap.size} 个用户信息`);
      return userInfoMap;
    } catch (error) {
      console.error('parseLoginInfo 错误:', error);
      return userInfoMap;
    }
  }

  /**
   * 扫描 documents 目录，查找所有用户目录
   */
  scanUsers(documentsPath: string): string[] {
    const userMd5s: string[] = [];

    if (!fs.existsSync(documentsPath)) {
      console.log('微信数据目录不存在:', documentsPath);
      return userMd5s;
    }

    const items = fs.readdirSync(documentsPath);

    for (const item of items) {
      const itemPath = path.join(documentsPath, item);
      const stat = fs.statSync(itemPath);

      // 检查是否是 32 位 MD5 格式的目录
      if (stat.isDirectory() && /^[a-f0-9]{32}$/i.test(item)) {
        // 检查是否包含 DB 目录
        const dbPath = path.join(itemPath, 'DB');
        if (fs.existsSync(dbPath) && fs.statSync(dbPath).isDirectory()) {
          userMd5s.push(item.toLowerCase());
        }
      }
    }

    console.log(`找到 ${userMd5s.length} 个用户目录`);
    return userMd5s;
  }

  /**
   * 获取用户头像路径
   */
  getUserAvatar(documentsPath: string, userMd5: string): string | undefined {
    const avatarPath = path.join(documentsPath, userMd5, 'Avatar', 'lastHeadImage');
    return fs.existsSync(avatarPath) ? avatarPath : undefined;
  }
}

