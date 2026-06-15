import React from 'react';
import { Drawer, Spin, Typography } from 'antd';

const { Title } = Typography;

const ViewDrawer = ({ open, onClose, title, loading, children, width = 900 }) => {
  return (
    <Drawer
      title={
        <span style={{ fontSize: 16, fontWeight: 600, color: '#1F3A6E' }}>
          {title}
        </span>
      }
      width={width}
      placement="right"
      onClose={onClose}
      open={open}
      destroyOnClose
      maskClosable={true}
      styles={{
        header: {
          borderBottom: '2px solid #e8edf5',
          background: '#f7f9fc',
          padding: '16px 24px',
        },
        body: {
          padding: '24px',
          background: '#fafbfd',
        },
      }}
    >
      <Spin spinning={loading}>
        {children}
      </Spin>
    </Drawer>
  );
};

export default ViewDrawer;
