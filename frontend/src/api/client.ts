import axios from 'axios';
import type { 
  UserInfo, 
  ChatTable, 
  Message, 
  ApiResponse,
  ChatStatistics,
  UserActivity,
  WordFrequency,
  WordCloudImage,
  ChatSummary,
  SentimentAnalysis
} from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const userAPI = {
  getUsers: async (documentsPath: string) => {
    const response = await client.get<ApiResponse<Record<string, UserInfo>>>('/users', {
      params: { path: documentsPath },
    });
    return response.data;
  },

  getUserDetail: async (md5: string, documentsPath: string) => {
    const response = await client.get<ApiResponse<UserInfo>>(`/users/${md5}`, {
      params: { path: documentsPath },
    });
    return response.data;
  },
};

export const chatAPI = {
  getChats: async (documentsPath: string, userMd5: string, limit: number = 0) => {
    const response = await client.get<ApiResponse<ChatTable[]>>('/chats', {
      params: { path: documentsPath, userMd5, limit },
    });
    return response.data;
  },

  getMessages: async (
    documentsPath: string,
    userMd5: string,
    table: string,
    limit: number = 100,
    offset: number = 0
  ) => {
    const response = await client.get<ApiResponse<Message[]>>('/chats/messages', {
      params: { path: documentsPath, userMd5, table, limit, offset },
    });
    return response.data;
  },

  /**
   * 获取查看聊天记录的 URL（GET 请求，可直接在浏览器打开）
   */
  getViewUrl: (
    documentsPath: string,
    userMd5: string,
    tableName: string,
    nickname: string,
    isGroup: boolean
  ): string => {
    const params = new URLSearchParams({
      path: documentsPath,
      userMd5,
      tableName,
      nickname,
      isGroup: isGroup ? 'true' : 'false',
    });
    return `${API_BASE_URL}/chats/view?${params.toString()}`;
  },

};

// 数据分析 API
export const analyticsAPI = {
  /**
   * 获取聊天统计数据
   */
  getStatistics: async (
    documentsPath: string,
    userMd5: string,
    tableName: string,
    startDate?: string,
    endDate?: string
  ) => {
    const response = await client.get<ApiResponse<ChatStatistics>>('/analytics/statistics', {
      params: { path: documentsPath, userMd5, tableName, startDate, endDate },
    });
    return response.data;
  },

  /**
   * 获取用户活跃度分析
   */
  getActivity: async (
    documentsPath: string,
    userMd5: string,
    tableName: string,
    startDate?: string,
    endDate?: string
  ) => {
    const response = await client.get<ApiResponse<UserActivity>>('/analytics/activity', {
      params: { path: documentsPath, userMd5, tableName, startDate, endDate },
    });
    return response.data;
  },

  /**
   * 获取词频统计
   */
  getWordFrequency: async (
    documentsPath: string,
    userMd5: string,
    tableName: string,
    topN: number = 100,
    startDate?: string,
    endDate?: string
  ) => {
    const response = await client.get<ApiResponse<WordFrequency[]>>('/analytics/wordfreq', {
      params: { path: documentsPath, userMd5, tableName, topN, startDate, endDate },
    });
    return response.data;
  },

  /**
   * 生成词云图片
   */
  generateWordCloud: async (
    documentsPath: string,
    userMd5: string,
    tableName: string,
    width: number = 800,
    height: number = 600,
    backgroundColor: string = 'white',
    colormap: string = 'viridis',
    maxWords: number = 200,
    startDate?: string,
    endDate?: string
  ) => {
    const response = await client.get<ApiResponse<WordCloudImage>>('/analytics/wordcloud', {
      params: { 
        path: documentsPath,
        userMd5,
        tableName, 
        width, 
        height, 
        backgroundColor, 
        colormap, 
        maxWords,
        startDate, 
        endDate 
      },
    });
    return response.data;
  },
};

// AI 功能 API
export const aiAPI = {
  /**
   * 总结聊天内容
   */
  summarizeChat: async (
    documentsPath: string,
    userMd5: string,
    tableName: string,
    limit: number = 1000,
    startDate?: string,
    endDate?: string
  ) => {
    const response = await client.post<ApiResponse<ChatSummary>>('/ai/summarize', {
      path: documentsPath,
      userMd5,
      tableName,
      limit,
      startDate,
      endDate,
    });
    return response.data;
  },

  /**
   * 情感分析
   */
  analyzeSentiment: async (
    documentsPath: string,
    userMd5: string,
    tableName: string,
    limit: number = 1000,
    startDate?: string,
    endDate?: string
  ) => {
    const response = await client.post<ApiResponse<SentimentAnalysis>>('/ai/sentiment', {
      path: documentsPath,
      userMd5,
      tableName,
      limit,
      startDate,
      endDate,
    });
    return response.data;
  },

  /**
   * 智能问答
   */
  askQuestion: async (
    documentsPath: string,
    userMd5: string,
    tableName: string,
    question: string,
    limit: number = 1000,
    startDate?: string,
    endDate?: string
  ) => {
    const response = await client.post<ApiResponse<string>>('/ai/qa', {
      path: documentsPath,
      userMd5,
      tableName,
      question,
      limit,
      startDate,
      endDate,
    });
    return response.data;
  },
};

