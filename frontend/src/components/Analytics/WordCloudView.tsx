import React, { useState } from 'react';
import { Card, Button, Spin, message, Form, InputNumber, Select, DatePicker, Space, Image } from 'antd';
import { CloudOutlined, ReloadOutlined } from '@ant-design/icons';
import { analyticsAPI } from '../../api/client';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface WordCloudViewProps {
  documentsPath: string;
  userMd5: string;
  tableName: string;
}

const WordCloudView: React.FC<WordCloudViewProps> = ({
  documentsPath,
  userMd5,
  tableName,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);

  const generateWordCloud = async (values: any) => {
    setLoading(true);
    try {
      const { dateRange, width, height, backgroundColor, colormap, maxWords } = values;
      
      const response = await analyticsAPI.generateWordCloud(
        documentsPath,
        userMd5,
        tableName,
        width || 800,
        height || 600,
        backgroundColor || 'white',
        colormap || 'viridis',
        maxWords || 200,
        dateRange ? dateRange[0].format('YYYY-MM-DD') : undefined,
        dateRange ? dateRange[1].format('YYYY-MM-DD') : undefined
      );

      if (response.success && response.data) {
        setImageData(response.data.image);
        message.success('词云生成成功');
      } else {
        message.error(response.error || '生成词云失败');
      }
    } catch (error: any) {
      message.error(error.message || '生成词云失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    form.validateFields().then(generateWordCloud);
  };

  return (
    <div>
      <Card title="词云配置" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          initialValues={{
            width: 800,
            height: 600,
            backgroundColor: 'white',
            colormap: 'viridis',
            maxWords: 200,
          }}
        >
          <Form.Item label="日期范围" name="dateRange">
            <RangePicker />
          </Form.Item>

          <Form.Item label="宽度" name="width">
            <InputNumber min={400} max={2000} step={100} />
          </Form.Item>

          <Form.Item label="高度" name="height">
            <InputNumber min={300} max={1500} step={100} />
          </Form.Item>

          <Form.Item label="背景色" name="backgroundColor">
            <Select style={{ width: 120 }}>
              <Option value="white">白色</Option>
              <Option value="black">黑色</Option>
              <Option value="#f0f2f5">浅灰</Option>
            </Select>
          </Form.Item>

          <Form.Item label="颜色方案" name="colormap">
            <Select style={{ width: 120 }}>
              <Option value="viridis">Viridis</Option>
              <Option value="plasma">Plasma</Option>
              <Option value="inferno">Inferno</Option>
              <Option value="magma">Magma</Option>
              <Option value="cividis">Cividis</Option>
            </Select>
          </Form.Item>

          <Form.Item label="最大词数" name="maxWords">
            <InputNumber min={50} max={500} step={50} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                icon={<CloudOutlined />} 
                onClick={handleSubmit}
                loading={loading}
              >
                生成词云
              </Button>
              {imageData && (
                <Button icon={<ReloadOutlined />} onClick={handleSubmit}>
                  重新生成
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" tip="正在生成词云，请稍候..." />
          </div>
        </Card>
      )}

      {!loading && imageData && (
        <Card title="词云图">
          <div style={{ textAlign: 'center' }}>
            <Image
              src={`data:image/png;base64,${imageData}`}
              alt="词云"
              style={{ maxWidth: '100%' }}
            />
          </div>
        </Card>
      )}

      {!loading && !imageData && (
        <Card>
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>
            <CloudOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>点击"生成词云"按钮开始分析</div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WordCloudView;

