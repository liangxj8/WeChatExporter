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

// 消息（字段名与数据库一致）
export interface Message {
  MesLocalID: number;
  MesSvrID: number;
  CreateTime: number;
  Message: string;
  Type: number;
  Des: number;
  Status: number;
  ImgStatus?: number;
  TableVer?: number;
}

// API 响应
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

