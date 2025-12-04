import React, { useState } from 'react';
import { Card, Tabs, Button, Spin, message, Row, Col, Statistic, Empty } from 'antd';
import { 
  BarChartOutlined, 
  CloudOutlined, 
  RobotOutlined,
  ArrowLeftOutlined 
} from '@ant-design/icons';
import { analyticsAPI, aiAPI } from '../api/client';
import type { 
  ChatTable, 
  ChatStatistics, 
  UserActivity, 
  WordFrequency,
  ChatSummary,
  SentimentAnalysis 
} from '../types';
import StatisticsView from '../components/Analytics/StatisticsView';
import WordCloudView from '../components/Analytics/WordCloudView';
import AIView from '../components/Analytics/AIView';

const { TabPane } = Tabs;

interface AnalyticsPageProps {
  documentsPath: string;
  userMd5: string;
  chatInfo: ChatTable;
  onBack: () => void;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  documentsPath,
  userMd5,
  chatInfo,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState('statistics');

  return (
    <div>
      <Button 
        onClick={onBack} 
        icon={<ArrowLeftOutlined />} 
        style={{ marginBottom: 16 }}
      >
        返回聊天列表
      </Button>

      <Card 
        title={`数据分析 - ${chatInfo.contact.nickname}`}
        extra={
          <Button 
            type="link" 
            href={`/api/chats/view?path=${encodeURIComponent(documentsPath)}&userMd5=${userMd5}&tableName=${chatInfo.tableName}&nickname=${encodeURIComponent(chatInfo.contact.nickname)}&isGroup=${chatInfo.contact.isGroup}`}
            target="_blank"
          >
            查看原始聊天记录
          </Button>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                <BarChartOutlined />
                数据统计
              </span>
            } 
            key="statistics"
          >
            <StatisticsView
              documentsPath={documentsPath}
              userMd5={userMd5}
              tableName={chatInfo.tableName}
              isGroup={chatInfo.contact.isGroup}
            />
          </TabPane>

          <TabPane 
            tab={
              <span>
                <CloudOutlined />
                词云分析
              </span>
            } 
            key="wordcloud"
          >
            <WordCloudView
              documentsPath={documentsPath}
              userMd5={userMd5}
              tableName={chatInfo.tableName}
            />
          </TabPane>

          <TabPane 
            tab={
              <span>
                <RobotOutlined />
                AI 分析
              </span>
            } 
            key="ai"
          >
            <AIView
              documentsPath={documentsPath}
              userMd5={userMd5}
              tableName={chatInfo.tableName}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default AnalyticsPage;

