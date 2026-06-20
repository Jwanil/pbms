import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Form, Input, Button, Row, Col, Typography, Space, Spin, Modal, message, Tabs, Divider, Avatar } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined, EditOutlined, KeyOutlined } from '@ant-design/icons';
import { useProfile, useUpdateProfile, useChangePassword } from '../../api/profileApi';
import useFormErrors from '../../hooks/useFormErrors';
import PageHeader from '../../components/PageHeader';

const { Text, Title } = Typography;

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

  const handleUpdateProfile = useCallback((values) => {
    updateProfile(values, {
      onSuccess: () => {
        setIsModalVisible(false);
        message.success('Profile updated successfully');
      },
      onError: (err) => applyProfileErrors(err),
    });
  }, [updateProfile, applyProfileErrors]);

  const handleChangePassword = useCallback((values) => {
    changePassword(values, {
      onSuccess: () => {
        passwordForm.resetFields();
        message.success('Password updated successfully');
      },
      onError: (err) => applyPasswordErrors(err),
    });
  }, [changePassword, passwordForm, applyPasswordErrors]);

  const openEditModal = useCallback(() => setIsModalVisible(true), []);
  const closeEditModal = useCallback(() => setIsModalVisible(false), []);

  const InfoItem = useCallback(({ label, value }) => (
    <Col xs={24} sm={12}>
      <div style={{ marginBottom: 20 }}>
        <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
        <div style={{ marginTop: 4 }}>
          <Text strong style={{ fontSize: 15 }}>{value || <Text type="secondary">—</Text>}</Text>
        </div>
      </div>
    </Col>
  ), []);

  const personalInfoTab = useMemo(() => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
        <Avatar size={64} style={{ background: '#1F3A6E', fontSize: 26, fontWeight: 700 }}>
          {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
        </Avatar>
        <div>
          <Title level={4} style={{ margin: 0 }}>{profile?.name}</Title>
          <Text type="secondary">{profile?.role?.role_name} {profile?.department?.department_name ? `· ${profile.department.department_name}` : ''}</Text>
        </div>
        <Button type="primary" icon={<EditOutlined />} onClick={openEditModal} style={{ marginLeft: 'auto', background: '#1F3A6E' }}>
          Edit Profile
        </Button>
      </div>

      <Row gutter={[16, 4]}>
        <InfoItem label="Full Name" value={profile?.name} />
        <InfoItem label="Username" value={profile?.username} />
        <InfoItem label="Email Address" value={profile?.email} />
        <InfoItem label="Mobile Number" value={profile?.mobile} />
        <InfoItem label="Role" value={profile?.role?.role_name} />
        <InfoItem label="Department" value={profile?.department?.department_name} />
      </Row>

      <Modal title="Edit Personal Information" open={isModalVisible} onCancel={closeEditModal} footer={null}>
        <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile} style={{ marginTop: 8 }}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Full name is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="mobile"
            label="Mobile Number"
            rules={[
              { required: true, message: 'Mobile number is required' },
              { pattern: /^[+]?[\d\s\-\(\)]{7,20}$/, message: 'Enter a valid mobile number' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={closeEditModal} style={{ marginRight: 8 }}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updatingProfile} style={{ background: '#1F3A6E' }}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  ), [profile, isModalVisible, profileForm, openEditModal, closeEditModal, handleUpdateProfile, updatingProfile, InfoItem]);

  const changePasswordTab = useMemo(() => (
    <div style={{ maxWidth: 480 }}>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Keep your account secure by using a strong, unique password that you don't use elsewhere.
      </Text>
      <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
        <Form.Item
          name="current_password"
          label="Current Password"
          rules={[{ required: true, message: 'Current password is required' }]}
        >
          <Input.Password />
        </Form.Item>
        <Divider style={{ margin: '4px 0 16px' }} />
        <Form.Item
          name="new_password"
          label="New Password"
          rules={[
            { required: true, message: 'New password is required' },
            { min: 8, message: 'At least 8 characters required' },
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
                if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                return Promise.reject(new Error('Passwords do not match'));
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
    </div>
  ), [passwordForm, handleChangePassword, changingPassword]);

  const tabItems = useMemo(() => [
    {
      key: 'personal',
      label: (
        <Space>
          <UserOutlined />
          Personal Information
        </Space>
      ),
      children: personalInfoTab,
    },
    {
      key: 'password',
      label: (
        <Space>
          <KeyOutlined />
          Change Password
        </Space>
      ),
      children: changePasswordTab,
    },
  ], [personalInfoTab, changePasswordTab]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your personal information and security" breadcrumbs={['Profile']} />
      <Card variant="borderless">
        <Tabs items={tabItems} size="large" />
      </Card>
    </div>
  );
}

export default ProfilePage;