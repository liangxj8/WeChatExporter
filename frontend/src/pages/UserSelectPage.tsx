import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Avatar, Typography, Button, Spin, Alert } from 'antd';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { userAPI } from '../api/client';
import type { UserInfo } from '../types';

const { Title, Text } = Typography;

interface UserSelectPageProps {
  documentsPath: string;
  onSelect: (user: UserInfo) => void;
  onBack: () => void;
}

const UserSelectPage: React.FC<UserSelectPageProps> = ({ documentsPath, onSelect, onBack }) => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, [documentsPath]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await userAPI.getUsers(documentsPath);
      if (response.success && response.data) {
        setUsers(response.data);
        if (response.data.length === 0) {
          setError('未找到任何微信账号，请检查目录路径是否正确');
        }
      } else {
        setError(response.error || '加载用户列表失败');
      }
    } catch (err: any) {
      console.error('加载用户失败:', err);
      setError(err.response?.data?.error || err.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={onBack} icon={<ArrowLeftOutlined />} style={{ marginBottom: 16 }}>
        返回
      </Button>

      <Card title={`选择微信账号 (${users.length})`}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" tip="正在加载微信账号..." />
          </div>
        )}

        {error && (
          <Alert message="加载失败" description={error} type="error" showIcon closable />
        )}

        {!loading && !error && users.length > 0 && (
          <Row gutter={[16, 16]}>
            {users.map((user) => (
              <Col xs={24} sm={12} md={8} lg={6} key={user.md5}>
                <Card
                  hoverable
                  onClick={() => onSelect(user)}
                  style={{ textAlign: 'center' }}
                >
                  <Avatar size={80} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
                  <Title level={5} ellipsis={{ rows: 1 }}>
                    {user.nickname}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {user.wechatId}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
};

export default UserSelectPage;

