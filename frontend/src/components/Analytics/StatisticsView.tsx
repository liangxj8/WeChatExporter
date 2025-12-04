import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Spin, message, DatePicker, Button, Space } from 'antd';
import { MessageOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { analyticsAPI } from '../../api/client';
import type { ChatStatistics, UserActivity } from '../../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const { RangePicker } = DatePicker;

interface StatisticsViewProps {
  documentsPath: string;
  userMd5: string;
  tableName: string;
  isGroup: boolean;
}

const StatisticsView: React.FC<StatisticsViewProps> = ({
  documentsPath,
  userMd5,
  tableName,
  isGroup,
}) => {
  const [statistics, setStatistics] = useState<ChatStatistics | null>(null);
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      // 加载统计数据
      const statsResponse = await analyticsAPI.getStatistics(
        documentsPath,
        userMd5,
        tableName,
        start,
        end
      );

      if (statsResponse.success && statsResponse.data) {
        setStatistics(statsResponse.data);
      } else {
        message.error(statsResponse.error || '加载统计数据失败');
      }

      // 如果是群聊，加载活跃度数据
      if (isGroup) {
        const activityResponse = await analyticsAPI.getActivity(
          documentsPath,
          userMd5,
          tableName,
          start,
          end
        );

        if (activityResponse.success && activityResponse.data) {
          setActivity(activityResponse.data);
        }
      }
    } catch (error: any) {
      message.error(error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
    if (dates) {
      setDateRange(dateStrings);
      loadData(dateStrings[0], dateStrings[1]);
    } else {
      setDateRange(null);
      loadData();
    }
  };

  if (loading && !statistics) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" tip="正在分析数据..." />
      </div>
    );
  }

  if (!statistics) {
    return <div>暂无数据</div>;
  }

  // 消息类型分布图表数据
  const messageTypesData = {
    labels: Object.keys(statistics.messageTypes),
    datasets: [
      {
        data: Object.values(statistics.messageTypes),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
      },
    ],
  };

  // 每日消息数量图表数据
  const dailyCountData = {
    labels: statistics.dailyCount.slice(-30).map(d => d.date.substring(5)), // 只显示月-日
    datasets: [
      {
        label: '消息数量',
        data: statistics.dailyCount.slice(-30).map(d => d.count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  // 每小时分布图表数据
  const hourlyData = {
    labels: statistics.hourlyDistribution.map(h => `${h.hour}:00`),
    datasets: [
      {
        label: '消息数量',
        data: statistics.hourlyDistribution.map(h => h.count),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      },
    ],
  };

  // 活跃度排名表格列
  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
    },
    {
      title: '用户',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: '发言次数',
      dataIndex: 'messageCount',
      key: 'messageCount',
      width: 120,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <RangePicker onChange={handleDateRangeChange} />
        {dateRange && (
          <Button onClick={() => {
            setDateRange(null);
            loadData();
          }}>
            清除筛选
          </Button>
        )}
      </Space>

      {/* 基本统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总消息数"
              value={statistics.totalMessages}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="开始日期"
              value={statistics.dateRange.start || '无数据'}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="结束日期"
              value={statistics.dateRange.end || '无数据'}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="消息类型分布">
            <Pie data={messageTypesData} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="每小时活跃度分布">
            <Bar data={hourlyData} options={{ maintainAspectRatio: true }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card title="每日消息数量趋势（最近30天）">
            <Bar data={dailyCountData} options={{ maintainAspectRatio: true }} />
          </Card>
        </Col>
      </Row>

      {/* 群聊活跃度排名 */}
      {isGroup && activity && (
        <Row gutter={16}>
          <Col span={24}>
            <Card title={`用户活跃度排名（共 ${activity.totalUsers} 人）`}>
              <Table
                columns={columns}
                dataSource={activity.ranking}
                rowKey="rank"
                pagination={{ pageSize: 20 }}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default StatisticsView;

