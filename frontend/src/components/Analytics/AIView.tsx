import React, { useState } from 'react';
import { Card, Button, Spin, message, Form, Input, DatePicker, Space, Tag, Alert, Typography } from 'antd';
import { RobotOutlined, SmileOutlined, MehOutlined, FrownOutlined } from '@ant-design/icons';
import { aiAPI } from '../../api/client';
import type { ChatSummary, SentimentAnalysis } from '../../types';

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

interface AIViewProps {
  documentsPath: string;
  userMd5: string;
  tableName: string;
}

const AIView: React.FC<AIViewProps> = ({
  documentsPath,
  userMd5,
  tableName,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<'summary' | 'sentiment' | 'qa' | null>(null);
  const [summary, setSummary] = useState<ChatSummary | null>(null);
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [qaResult, setQaResult] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const handleSummarize = async () => {
    setLoading('summary');
    try {
      const response = await aiAPI.summarizeChat(
        documentsPath,
        userMd5,
        tableName,
        1000,
        dateRange ? dateRange[0] : undefined,
        dateRange ? dateRange[1] : undefined
      );

      if (response.success && response.data) {
        setSummary(response.data);
        message.success('总结完成');
      } else {
        message.error(response.error || '总结失败');
      }
    } catch (error: any) {
      message.error(error.message || '总结失败');
    } finally {
      setLoading(null);
    }
  };

  const handleAnalyzeSentiment = async () => {
    setLoading('sentiment');
    try {
      const response = await aiAPI.analyzeSentiment(
        documentsPath,
        userMd5,
        tableName,
        1000,
        dateRange ? dateRange[0] : undefined,
        dateRange ? dateRange[1] : undefined
      );

      if (response.success && response.data) {
        setSentiment(response.data);
        message.success('分析完成');
      } else {
        message.error(response.error || '分析失败');
      }
    } catch (error: any) {
      message.error(error.message || '分析失败');
    } finally {
      setLoading(null);
    }
  };

  const handleAskQuestion = async (values: any) => {
    if (!values.question || !values.question.trim()) {
      message.warning('请输入问题');
      return;
    }

    setLoading('qa');
    try {
      const response = await aiAPI.askQuestion(
        documentsPath,
        userMd5,
        tableName,
        values.question,
        1000,
        dateRange ? dateRange[0] : undefined,
        dateRange ? dateRange[1] : undefined
      );

      if (response.success && response.data) {
        setQaResult(response.data);
        message.success('回答完成');
      } else {
        message.error(response.error || '问答失败');
      }
    } catch (error: any) {
      message.error(error.message || '问答失败');
    } finally {
      setLoading(null);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <SmileOutlined style={{ fontSize: 48, color: '#52c41a' }} />;
      case 'negative':
        return <FrownOutlined style={{ fontSize: 48, color: '#f5222d' }} />;
      default:
        return <MehOutlined style={{ fontSize: 48, color: '#faad14' }} />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'success';
      case 'negative':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <div>
      <Alert
        message="AI 功能说明"
        description="使用大语言模型分析聊天内容。需要配置 OpenAI API Key（在后端 .env 文件中设置 OPENAI_API_KEY）"
        type="info"
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 日期范围选择器 */}
        <Card size="small">
          <Space>
            <Text>分析范围：</Text>
            <RangePicker 
              onChange={(dates, dateStrings) => {
                setDateRange(dates ? [dateStrings[0], dateStrings[1]] : null);
              }} 
            />
            {dateRange && (
              <Button size="small" onClick={() => setDateRange(null)}>
                清除
              </Button>
            )}
          </Space>
        </Card>

        {/* 聊天内容总结 */}
        <Card 
          title="聊天内容总结" 
          extra={
            <Button 
              type="primary" 
              icon={<RobotOutlined />}
              onClick={handleSummarize}
              loading={loading === 'summary'}
            >
              生成总结
            </Button>
          }
        >
          {loading === 'summary' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <Spin tip="正在分析聊天内容..." />
            </div>
          )}

          {!loading && summary && (
            <div>
              <Title level={5}>摘要</Title>
              <Paragraph>{summary.summary}</Paragraph>

              <Title level={5}>主要话题</Title>
              <Space wrap>
                {summary.topics.map((topic, index) => (
                  <Tag color="blue" key={index}>{topic}</Tag>
                ))}
              </Space>
            </div>
          )}

          {!loading && !summary && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#999' }}>
              点击"生成总结"按钮开始分析
            </div>
          )}
        </Card>

        {/* 情感分析 */}
        <Card 
          title="情感分析" 
          extra={
            <Button 
              type="primary" 
              icon={<RobotOutlined />}
              onClick={handleAnalyzeSentiment}
              loading={loading === 'sentiment'}
            >
              分析情感
            </Button>
          }
        >
          {loading === 'sentiment' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <Spin tip="正在分析情感倾向..." />
            </div>
          )}

          {!loading && sentiment && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 24 }}>
                {getSentimentIcon(sentiment.sentiment)}
              </div>
              <Title level={4}>
                情感倾向：
                <Tag color={getSentimentColor(sentiment.sentiment)} style={{ marginLeft: 8 }}>
                  {sentiment.sentiment === 'positive' ? '积极' :
                   sentiment.sentiment === 'negative' ? '消极' : '中性'}
                </Tag>
              </Title>
              <Paragraph>
                评分：{(sentiment.score * 100).toFixed(1)}%
              </Paragraph>
              <Paragraph type="secondary">
                {sentiment.description}
              </Paragraph>
            </div>
          )}

          {!loading && !sentiment && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#999' }}>
              点击"分析情感"按钮开始分析
            </div>
          )}
        </Card>

        {/* 智能问答 */}
        <Card title="智能问答">
          <Form form={form} onFinish={handleAskQuestion}>
            <Form.Item name="question">
              <TextArea 
                rows={3} 
                placeholder="基于聊天记录提问，例如：这个聊天主要讨论了什么？有哪些重要的时间点？"
              />
            </Form.Item>
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit"
                icon={<RobotOutlined />}
                loading={loading === 'qa'}
              >
                提问
              </Button>
            </Form.Item>
          </Form>

          {loading === 'qa' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <Spin tip="正在思考答案..." />
            </div>
          )}

          {!loading && qaResult && (
            <Card type="inner" title="回答">
              <Paragraph>{qaResult}</Paragraph>
            </Card>
          )}
        </Card>
      </Space>
    </div>
  );
};

export default AIView;

