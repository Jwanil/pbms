import React, { useState } from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import api from '../api/axiosInstance';

const ExportCsvButton = ({ module, moduleName }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    const hide = message.loading(`Preparing ${moduleName} export...`, 0);
    try {
      const res = await api.get(`/${module}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${module}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success(`${moduleName} exported successfully`);
    } catch (error) {
      console.error('Export failed:', error);
      message.error(`Failed to export ${moduleName}`);
    } finally {
      hide();
      setLoading(false);
    }
  };

  return (
    <Button 
      icon={<DownloadOutlined />} 
      onClick={handleExport} 
      loading={loading}
    >
      Export
    </Button>
  );
};

export default ExportCsvButton;
