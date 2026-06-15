import { useEffect } from 'react';
import { Card, Form, Input, Button, Row, Col, Typography, Space, Divider, Spin } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { useProfile, useUpdateProfile, useChangePassword } from '../../api/profileApi';
import useFormErrors from '../../hooks/useFormErrors';
import PageHeader from '../../components/PageHeader';

const { Title, Text } = Typography;

function ProfilePage() {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending: updatingProfile } = useUpdateProfile();
  const { mutate: changePassword, isPending: changingPassword } = useChangePassword();

  const { applyServerErrors: applyProfileErrors } = useFormErrors(profileForm);
  const { applyServerErrors: applyPasswordErrors } = useFormErrors(passwordForm);

  useEffect(() => {
    if (profile) {
      profileForm.setFieldsValue({
        first_name: profile.first_name,
        last_name: profile.last_name,
        mobile: profile.mobile,
      });
    }
  }, [profile, profileForm]);

  const handleUpdateProfile = (values) => {
    updateProfile(values, {
      onError: (err) => applyProfileErrors(err)
    });
  };

  const handleChangePassword = (values) => {
    changePassword(values, {
      onSuccess: () => passwordForm.resetFields(),
      onError: (err) => applyPasswordErrors(err)
    });
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information and security"
        breadcrumbs={['Profile']}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card 
            title={<Space><UserOutlined /> Personal Information</Space>} 
            bordered={false}
          >
            <div style={{ marginBottom: 24 }}>
              <Text type="secondary">Role</Text>
              <div><Text strong style={{ fontSize: 16 }}>{profile?.role?.role_name || '—'}</Text></div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <Text type="secondary">Email Address</Text>
              <div><Text strong style={{ fontSize: 16 }}>{profile?.email}</Text></div>
            </div>
            
            <Divider />

            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleUpdateProfile}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    name="first_name" 
                    label="First Name" 
                    rules={[{ required: true, message: 'First name is required' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    name="last_name" 
                    label="Last Name"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item 
                name="mobile" 
                label="Mobile Number"
                rules={[
                  { required: true, message: 'Mobile number is required' },
                  { pattern: /^[+]?[\d\s\-\(\)]{7,20}$/, message: 'Enter a valid mobile number' }
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SaveOutlined />} 
                  loading={updatingProfile}
                  style={{ background: '#1F3A6E' }}
                >
                  Save Changes
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={<Space><LockOutlined /> Change Password</Space>} 
            bordered={false}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item 
                name="current_password" 
                label="Current Password" 
                rules={[{ required: true, message: 'Current password is required' }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item 
                name="new_password" 
                label="New Password" 
                rules={[
                  { required: true, message: 'New password is required' },
                  { min: 8, message: 'Password must be at least 8 characters' }
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item 
                name="confirm_password" 
                label="Confirm New Password" 
                dependencies={['new_password']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('new_password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SaveOutlined />} 
                  loading={changingPassword}
                  style={{ background: '#1F3A6E' }}
                >
                  Update Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProfilePage;