import { useState } from 'react';
import '../pages/masters/Masters.css';
import { Button, Form, Input, InputNumber, Space, Popconfirm, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from './PageHeader';
import DataTable from './DataTable';
import FormModal from './FormModal';
import PermissionGuard from './PermissionGuard';
import ExportCsvButton from './ExportCsvButton';
import BulkImportModal from './BulkImportModal';

import useFormErrors from '../hooks/useFormErrors';
import { message } from 'antd';

function MasterPage({
  title,
  subtitle,
  module,         // permission module name e.g. 'categories'
  data = [],
  isLoading = false,
  rowKey,         // primary key field name e.g. 'category_id'
  nameField,      // name field e.g. 'category_name'
  nameLabel,      // form label e.g. 'Category Name'
  extraFields,    // optional array of { name, label, type, rules } for packaging
  onAdd,
  onEdit,
  onDelete,
  isSubmitting = false,
}) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const { applyServerErrors } = useFormErrors(form);

  const openAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [module] });
  };

  const handleSubmit = (values) => {
    if (editingRecord) {
      onEdit({ id: editingRecord[rowKey], data: values }, {
        onSuccess: () => setModalOpen(false),
        onError: (err) => {
          applyServerErrors(err);
          
        }
      });
    } else {
      onAdd(values, {
        onSuccess: () => setModalOpen(false),
        onError: (err) => {
          applyServerErrors(err);
          
        }
      });
    }
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: nameLabel,
      dataIndex: nameField,
      key: nameField,
      sorter: (a, b) => a[nameField].localeCompare(b[nameField]),
    },
    ...(extraFields || []).map(f => ({
      title: f.label,
      dataIndex: f.name,
      key: f.name,
    })),
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <PermissionGuard module={module} action="can_edit">
            <Tooltip title="Edit">
              <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard module={module} action="can_delete">
            <Popconfirm
              title="Delete this record?"
              description="This cannot be undone. Records in use cannot be deleted."
              onConfirm={() => onDelete(record[rowKey])}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete">
                <Button icon={<DeleteOutlined />} size="small" danger />
              </Tooltip>
            </Popconfirm>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const [searchText, setSearchText] = useState('');

  // Client-side search filtering (since Masters usually fetch all data at once)
  const filteredData = data.filter(record => {
    if (!searchText) return true;
    const lowerSearch = debouncedSearch.toLowerCase();
    
    // Check the primary name field (e.g., category_name)
    if (record[nameField]?.toString().toLowerCase().includes(lowerSearch)) return true;
    
    // Check any extra fields if they exist
    if (extraFields) {
      for (const f of extraFields) {
        if (record[f.name]?.toString().toLowerCase().includes(lowerSearch)) return true;
      }
    }
    return false;
  });

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={['Masters', title]}
        extra={
          <Space>
            <ExportCsvButton module={module} moduleName={title} />
            <PermissionGuard module={module} action="can_create">
              <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>Import</Button>
            </PermissionGuard>
            <PermissionGuard module={module} action="can_create">
              <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} className="btn-primary-dark">
                Add {title.replace(' Master', '')}
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      <DataTable
        columns={columns}
        dataSource={filteredData}
        loading={isLoading}
        rowKey={rowKey}
        total={filteredData.length}
        searchPlaceholder={`Search ${title.toLowerCase()}...`}
        onSearch={setSearchText}
      />




      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingRecord ? `Edit ${title}` : `Add ${title}`}
        form={form}
        loading={isSubmitting}
        width={480}
      >
        <Form.Item
          name={nameField}
          label={nameLabel}
          rules={[
            { required: true, message: `${nameLabel} is required` },
            { max: 100, message: 'Cannot exceed 100 characters' },
            { whitespace: true, message: 'Cannot be blank spaces' },
            {
              pattern: /^[^\<\>\{\}\[\]\\\/\|\*\?\:\"\`]+$/,
              message: 'Contains invalid special characters'
            }
          ]}
        >
          <Input placeholder={`Enter ${nameLabel.toLowerCase()}`} />
        </Form.Item>

        {(extraFields || []).map(f => (
          <Form.Item
            key={f.name}
            name={f.name}
            label={f.label}
            rules={f.rules || [{ required: true }]}
          >
            {f.type === 'number'
              ? <InputNumber className="masters-input-full" placeholder={`Enter ${f.label.toLowerCase()}`} min={0} />
              : <Input placeholder={`Enter ${f.label.toLowerCase()}`} />
            }
          </Form.Item>
        ))}
      </FormModal>

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        module={module}
        moduleName={title}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}

export default MasterPage;