import React, { useState } from 'react';
import { Layout, Typography, Steps } from 'antd';
import ConfigPage from './pages/ConfigPage';
import UserSelectPage from './pages/UserSelectPage';
import ChatListPage from './pages/ChatListPage';
import AnalyticsPage from './pages/AnalyticsPage';
import type { UserInfo, ChatTable } from './types';
import './styles/global.css';

const { Header, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [documentsPath, setDocumentsPath] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatTable | null>(null);

  const handlePathConfig = (path: string) => {
    setDocumentsPath(path);
    setCurrentStep(1);
  };

  const handleUserSelect = (user: UserInfo) => {
    setSelectedUser(user);
    setCurrentStep(2);
  };

  const handleAnalytics = (chat: ChatTable) => {
    setSelectedChat(chat);
    setCurrentStep(3);
  };

  const steps = [
    {
      title: '配置路径',
      description: '设置微信数据目录',
    },
    {
      title: '选择用户',
      description: '选择要导出的微信账号',
    },
    {
      title: '聊天列表',
      description: '选择聊天记录',
    },
    {
      title: '数据分析',
      description: '查看统计和 AI 分析',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 50px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Title level={3} style={{ margin: '14px 0' }}>
          微信聊天记录导出工具 2.0
        </Title>
      </Header>
      <Content style={{ padding: '50px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Steps current={currentStep} items={steps} style={{ marginBottom: 40 }} />

          {currentStep === 0 && <ConfigPage onNext={handlePathConfig} />}
          {currentStep === 1 && (
            <UserSelectPage
              documentsPath={documentsPath}
              onSelect={handleUserSelect}
              onBack={() => setCurrentStep(0)}
            />
          )}
          {currentStep === 2 && selectedUser && (
            <ChatListPage
              documentsPath={documentsPath}
              user={selectedUser}
              onBack={() => setCurrentStep(1)}
              onAnalytics={handleAnalytics}
            />
          )}
          {currentStep === 3 && selectedUser && selectedChat && (
            <AnalyticsPage
              documentsPath={documentsPath}
              userMd5={selectedUser.md5}
              chatInfo={selectedChat}
              onBack={() => setCurrentStep(2)}
            />
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default App;

