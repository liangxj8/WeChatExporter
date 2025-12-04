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

// 数据分析相关类型
export interface ChatStatistics {
  totalMessages: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  messageTypes: Record<string, number>;
  dailyCount: Array<{
    date: string;
    count: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    count: number;
  }>;
}

export interface UserActivity {
  totalUsers: number;
  ranking: Array<{
    rank: number;
    userName: string;
    messageCount: number;
  }>;
}

export interface WordFrequency {
  word: string;
  count: number;
}

export interface WordCloudImage {
  image: string; // base64 编码的图片
}

// AI 功能相关类型
export interface ChatSummary {
  summary: string;
  topics: string[];
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  description: string;
}

