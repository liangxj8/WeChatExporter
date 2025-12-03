// 用户信息
export interface UserInfo {
  md5: string;
  wechatId: string;
  nickname: string;
  avatar?: string;
}

// 联系人
export interface Contact {
  userName: string;
  dbContactRemark: string;
  dbContactProfile?: string;
  dbContactHeadImage?: string;
}

// 聊天表
export interface ChatTable {
  tableName: string;
  messageCount: number;
  contact: {
    md5: string;
    wechatId: string;
    nickname: string;
    isGroup: boolean;
  };
  lastMessageTime?: number;  // 最后一条消息的时间戳
  isPinned?: boolean;         // 是否置顶
  lastMessagePreview?: string; // 最后一条消息预览
}

// 消息
export interface Message {
  mesLocalID: number;
  mesSvrID: number;
  createTime: number;
  message: string;
  messageType: number;
  des: number;
  status: number;
}

// API 响应
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

