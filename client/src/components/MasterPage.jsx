import { useState } from 'react';
import { Button, Form, Input, InputNumber, Space, Popconfirm, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import PageHeader from './PageHeader';
import DataTable from './DataTable';
import FormModal from './FormModal';
import PermissionGuard from './PermissionGuard';

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
  const [modalOpen, setModalOpen] = useState(false);
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

  const handleSubmit = (values) => {
    if (editingRecord) {
      onEdit({ id: editingRecord[rowKey], data: values }, {
        onSuccess: () => setModalOpen(false),
        onError: (err) => {
          applyServerErrors(err);
          if (!err?.response?.data?.errors?.length) {
            message.error(err?.response?.data?.message || 'Failed to update record');
          }
        }
      });
    } else {
      onAdd(values, {
        onSuccess: () => setModalOpen(false),
        onError: (err) => {
          applyServerErrors(err);
          if (!err?.response?.data?.errors?.length) {
            message.error(err?.response?.data?.message || 'Failed to add record');
          }
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

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={['Masters', title]}
        extra={
          <PermissionGuard module={module} action="can_create">
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} style={{ background: '#1F3A6E' }}>
              Add {title.replace(' Master', '')}
            </Button>
          </PermissionGuard>
        }
      />

      <DataTable
        columns={columns}
        dataSource={data}
        loading={isLoading}
        rowKey={rowKey}
        total={data.length}
        searchPlaceholder={`Search ${title.toLowerCase()}...`}
        onSearch={() => {}}
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
              ? <InputNumber style={{ width: '100%' }} placeholder={`Enter ${f.label.toLowerCase()}`} min={0} />
              : <Input placeholder={`Enter ${f.label.toLowerCase()}`} />
            }
          </Form.Item>
        ))}
      </FormModal>
    </div>
  );
}

export default MasterPage;
