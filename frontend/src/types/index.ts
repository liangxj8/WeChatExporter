export interface UserInfo {
  md5: string;
  wechatId: string;
  nickname: string;
  avatar?: string;
}

export interface ChatTable {
  tableName: string;
  messageCount: number;
  contact: {
    md5: string;
    wechatId: string;
    nickname: string;
    isGroup: boolean;
  };
  lastMessageTime?: number;
  isPinned?: boolean;
  lastMessagePreview?: string;
}

export interface Message {
  mesLocalID: number;
  mesSvrID: number;
  createTime: number;
  message: string;
  messageType: number;
  des: number;
  status: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

