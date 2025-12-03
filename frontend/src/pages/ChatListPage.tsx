import React, { useState, useEffect } from 'react';
import { Card, List, Button, Spin, Alert, Tag, Input, message, Space } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { chatAPI } from '../api/client';
import type { UserInfo, ChatTable } from '../types';

const { Search } = Input;

interface ChatListPageProps {
  documentsPath: string;
  user: UserInfo;
  onBack: () => void;
}

const ChatListPage: React.FC<ChatListPageProps> = ({ documentsPath, user, onBack }) => {
  const [chats, setChats] = useState<ChatTable[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);

  // 格式化时间
  const formatTime = (timestamp?: number): string => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    // 今天：显示时分
    if (date >= today) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 昨天
    if (date >= yesterday) {
      return '昨天';
    }
    
    // 本周：显示星期
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
    if (daysDiff < 7) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekdays[date.getDay()];
    }
    
    // 本年：显示月日
    if (date.getFullYear() === now.getFullYear()) {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
    
    // 更早：显示年月日
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  useEffect(() => {
    loadChats();
  }, [documentsPath, user]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = chats.filter(
        (chat) =>
          chat.contact.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          chat.contact.wechatId.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [searchTerm, chats]);

  const loadChats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await chatAPI.getChats(documentsPath, user.md5, 0);
      if (response.success && response.data) {
        setChats(response.data);
        setFilteredChats(response.data);
        if (response.data.length === 0) {
          setError('未找到任何聊天记录');
        }
      } else {
        setError(response.error || '加载聊天列表失败');
      }
    } catch (err: any) {
      console.error('加载聊天失败:', err);
      setError(err.response?.data?.error || err.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (chat: ChatTable, format: 'html' | 'json') => {
    setExporting(chat.tableName);
    try {
      const result = await chatAPI.exportChat(documentsPath, user.md5, chat.tableName, format, chat);
      
      // 创建下载链接
      const blob = new Blob([typeof result === 'string' ? result : JSON.stringify(result, null, 2)], {
        type: format === 'html' ? 'text/html' : 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chat.contact.nickname}_chat.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      message.success('导出成功！');
    } catch (err: any) {
      console.error('导出失败:', err);
      message.error(err.response?.data?.error || err.message || '导出失败');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div>
      <Button onClick={onBack} icon={<ArrowLeftOutlined />} style={{ marginBottom: 16 }}>
        返回
      </Button>

      <Card
        title={`${user.nickname} 的聊天记录 (${filteredChats.length})`}
        extra={
          <Search
            placeholder="搜索联系人"
            allowClear
            style={{ width: 250 }}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        }
      >
        {loading && (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" tip="正在加载聊天列表..." />
          </div>
        )}

        {error && (
          <Alert message="加载失败" description={error} type="error" showIcon closable />
        )}

        {!loading && !error && filteredChats.length > 0 && (
          <List
            dataSource={filteredChats}
            renderItem={(chat) => (
              <List.Item
                actions={[
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => handleExport(chat, 'html')}
                    loading={exporting === chat.tableName}
                  >
                    HTML
                  </Button>,
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => handleExport(chat, 'json')}
                    loading={exporting === chat.tableName}
                  >
                    JSON
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <span>
                      {chat.contact.nickname}
                      {chat.contact.isGroup && (
                        <Tag color="blue" style={{ marginLeft: 8 }}>
                          群聊
                        </Tag>
                      )}
                    </span>
                  }
                  description={
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <span style={{ color: '#999', fontSize: '12px' }}>
                        {typeof chat.lastMessagePreview === 'string' 
                          ? (chat.lastMessagePreview || '暂无消息')
                          : '暂无消息'}
                      </span>
                      <Space style={{ fontSize: '12px', color: '#999' }}>
                        {chat.lastMessageTime && (
                          <>
                            <ClockCircleOutlined />
                            <span>{formatTime(chat.lastMessageTime)}</span>
                            <span>·</span>
                          </>
                        )}
                        <span>{chat.messageCount} 条消息</span>
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default ChatListPage;

