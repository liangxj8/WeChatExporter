import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';

interface ConfigPageProps {
  onNext: (path: string) => void;
}

const ConfigPage: React.FC<ConfigPageProps> = ({ onNext }) => {
  const [form] = Form.useForm();
  const [path, setPath] = useState('/Users/hankin/Downloads/Documents');

  const handleSubmit = () => {
    if (path) {
      onNext(path);
    }
  };

  return (
    <Card title="配置微信数据目录">
      <Alert
        message="提示"
        description="请输入微信备份数据的 Documents 目录路径。通常位于 iTunes 或 iCloud 备份中。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Documents 目录路径"
          name="path"
          initialValue={path}
          rules={[{ required: true, message: '请输入目录路径' }]}
        >
          <Input
            size="large"
            placeholder="/Users/xxx/Downloads/Documents"
            prefix={<FolderOpenOutlined />}
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" block>
            下一步
          </Button>
        </Form.Item>
      </Form>

      <Alert
        message="示例路径"
        description={
          <div>
            <p>macOS: /Users/你的用户名/Downloads/Documents</p>
            <p>Windows: C:\\Users\\你的用户名\\Downloads\\Documents</p>
          </div>
        }
        type="warning"
        showIcon
      />
    </Card>
  );
};

export default ConfigPage;

