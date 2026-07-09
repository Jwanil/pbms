import { useState } from 'react';
import './styles/DocumentsPanel.css';
import { Upload, Button, List, Typography, Space, Popconfirm } from 'antd';
import { UploadOutlined, FileOutlined, DeleteOutlined } from '@ant-design/icons';
import { useDocuments, useUploadDocument, useDeleteDocument } from '../api/documentsApi';

const { Text } = Typography;
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5001';

export default function DocumentsPanel({ entityType, entityId, canUpload = true }) {
  const [fileList, setFileList] = useState([]);
  
  const typeLower = entityType.toLowerCase();
  const { data: documents = [], isLoading } = useDocuments(typeLower, entityId);
  const { mutate: uploadDoc, isPending: isUploading } = useUploadDocument();
  const { mutate: deleteDoc } = useDeleteDocument(typeLower, entityId);

  const handleUpload = () => {
    if (fileList.length === 0) return;
    const formData = new FormData();
    formData.append('file', fileList[0]);
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId);

    uploadDoc(formData, {
      onSuccess: () => setFileList([])
    });
  };

  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file) => {
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        import('antd').then(({ message }) => message.error('Document must be smaller than 5MB!'));
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      return false; // Prevent automatic upload
    },
    fileList,
    maxCount: 1
  };

  return (
    <div className="documents-panel">
      {canUpload && (
        <div className="documents-panel__upload-row">
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>Select File (Max 5MB)</Button>
          </Upload>
          <Button 
            type="primary" 
            onClick={handleUpload} 
            disabled={fileList.length === 0} 
            loading={isUploading}
          >
            Upload
          </Button>
        </div>
      )}

      <List
        loading={isLoading}
        dataSource={documents}
        renderItem={(item) => (
          <List.Item
            actions={canUpload ? [
              <Popconfirm
                title="Delete document"
                description="Are you sure? This cannot be undone."
                onConfirm={() => deleteDoc(item.document_id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ] : []}
          >
            <List.Item.Meta
              avatar={<FileOutlined className="documents-panel__file-icon" />}
              title={<a href={`${API_BASE_URL}${item.file_url}`} target="_blank" rel="noreferrer">{item.file_name}</a>}
              description={`Uploaded by ${item.uploader?.name || 'Unknown'} on ${new Date(item.uploaded_at).toLocaleDateString()}`}
            />
          </List.Item>
        )}
      />
    </div>
  );
}
