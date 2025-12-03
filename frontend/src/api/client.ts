import axios from 'axios';
import type { UserInfo, ChatTable, Message, ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const userAPI = {
  getUsers: async (documentsPath: string) => {
    const response = await client.get<ApiResponse<UserInfo[]>>('/users', {
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
    nickname: string
  ): string => {
    const params = new URLSearchParams({
      path: documentsPath,
      userMd5,
      tableName,
      nickname,
    });
    return `${API_BASE_URL}/chats/view?${params.toString()}`;
  },

  /**
   * 下载聊天记录（JSON 格式）
   */
  downloadChat: async (
    documentsPath: string,
    userMd5: string,
    table: string,
    chatInfo: ChatTable
  ) => {
    const response = await client.post(
      '/chats/download',
      {
        path: documentsPath,
        userMd5,
        table,
        chatInfo,
      },
      {
        responseType: 'json',
      }
    );
    return response.data;
  },
};

