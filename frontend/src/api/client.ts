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

  exportChat: async (
    documentsPath: string,
    userMd5: string,
    table: string,
    format: 'html' | 'json',
    chatInfo: ChatTable
  ) => {
    const response = await client.post(
      '/chats/export',
      {
        path: documentsPath,
        userMd5,
        table,
        format,
        chatInfo,
      },
      {
        responseType: format === 'html' ? 'text' : 'json',
      }
    );
    return response.data;
  },
};

