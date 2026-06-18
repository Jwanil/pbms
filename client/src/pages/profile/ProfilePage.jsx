import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Row, Col, Typography, Space, Divider, Spin, Modal, message } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons';
import { useProfile, useUpdateProfile, useChangePassword } from '../../api/profileApi';
import useFormErrors from '../../hooks/useFormErrors';
import PageHeader from '../../components/PageHeader';

const { Text } = Typography;

function ProfilePage() {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending: updatingProfile } = useUpdateProfile();
  const { mutate: changePassword, isPending: changingPassword } = useChangePassword();

  const { applyServerErrors: applyProfileErrors } = useFormErrors(profileForm);
  const { applyServerErrors: applyPasswordErrors } = useFormErrors(passwordForm);

  useEffect(() => {
    if (profile) {
      profileForm.setFieldsValue({ name: profile.name, mobile: profile.mobile });
    }
  }, [profile, profileForm]);

  const handleUpdateProfile = (values) => {
    updateProfile(values, {
      onSuccess: () => {
        setIsModalVisible(false);
        message.success('Profile updated successfully');
      },
      onError: (err) => applyProfileErrors(err)
    });
  };

  const handleChangePassword = (values) => {
    changePassword(values, {
      onSuccess: () => {
        passwordForm.resetFields();
        message.success('Password updated successfully');
      },
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

  const InfoItem = ({ label, value }) => (
    <Col span={12}>
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">{label}</Text>
        <div><Text strong style={{ fontSize: 16 }}>{value || '-'}</Text></div>
      </div>
    </Col>
  );

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your personal information and security" breadcrumbs={['Profile']} />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title={<Space><UserOutlined /> Personal Information</Space>}
            variant="borderless"
            extra={<Button type="primary" icon={<EditOutlined />} onClick={() => setIsModalVisible(true)}>Edit</Button>}
          >
            <Row gutter={[16, 16]}>
              <InfoItem label="Full Name" value={profile?.name} />
              <InfoItem label="Username" value={profile?.username} />
              <InfoItem label="Email Address" value={profile?.email} />
              <InfoItem label="Mobile Number" value={profile?.mobile} />
              <InfoItem label="Role" value={profile?.role?.role_name} />
              <InfoItem label="Department" value={profile?.department?.department_name} />
            </Row>

            <Modal
              title="Edit Personal Information"
              open={isModalVisible}
              onCancel={() => setIsModalVisible(false)}
              footer={null}
            >
              <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
                <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Full name is required' }]}>
                  <Input />
                </Form.Item>
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
                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                  <Button onClick={() => setIsModalVisible(false)} style={{ marginRight: 8 }}>Cancel</Button>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updatingProfile} style={{ background: '#1F3A6E' }}>
                    Save Changes
                  </Button>
                </Form.Item>
              </Form>
            </Modal>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<Space><LockOutlined /> Change Password</Space>} variant="borderless">
            <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
              <Form.Item name="current_password" label="Current Password" rules={[{ required: true, message: 'Current password is required' }]}>
                <Input.Password />
              </Form.Item>
              <Form.Item name="new_password" label="New Password" rules={[{ required: true, message: 'New password is required' }, { min: 8, message: 'At least 8 characters' }]}>
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
                      if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                      return Promise.reject(new Error('The two passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={changingPassword} style={{ background: '#1F3A6E' }}>
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