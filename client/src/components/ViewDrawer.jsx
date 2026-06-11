import React from 'react';
import { Drawer, Spin } from 'antd';

const ViewDrawer = ({ open, onClose, title, loading, children, width = 680 }) => {
  return (
    <Drawer
      title={title}
      width={width}
      placement="right"
      onClose={onClose}
      open={open}
      destroyOnClose
      maskClosable={true}
    >
      <Spin spinning={loading}>
        {children}
      </Spin>
    </Drawer>
  );
};

export default ViewDrawer;