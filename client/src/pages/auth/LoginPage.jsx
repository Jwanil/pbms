import { Form, Input, Button, Card, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function LoginPage() {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    console.log('Login submitted — Phase 2 will handle this:', values);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1F3A6E 0%, #2E75B6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Card
        style={{ width: 400, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        styles={{ body: { padding: '40px 40px 32px' } }}
      >
        <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 32, textAlign: 'center' }}>
          <Title level={3} style={{ margin: 0, color: '#1F3A6E' }}>PBMS</Title>
          <Text type="secondary">Product & Buyer Management System</Text>
        </Space>

        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off" size="large">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="admin@pbms.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Enter password" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button type="primary" htmlType="submit" block style={{ height: 44, background: '#1F3A6E' }}>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default LoginPage;
