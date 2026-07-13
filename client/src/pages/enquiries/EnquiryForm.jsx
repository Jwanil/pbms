/**
 * EnquiryForm.jsx
 * The form any logged-in user can use to submit an enquiry to the superadmin.
 * Place this file at: client/src/pages/enquiries/EnquiryForm.jsx
 */

import { Form, Modal, Input, Select, Button, Card, Typography, Alert } from 'antd';
import './Enquiries.css';
import { SendOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useCreateEnquiry } from '../../api/enquiryApi';
import useFormErrors from '../../hooks/useFormErrors';
import useAuthStore from '../../store/authStore';
import { useCompanies } from '../../api/companiesApi';
import { useProducts } from '../../api/productsApi';
import { useMappings } from '../../api/mappingsApi';
import { Checkbox, Table as AntTable, message } from 'antd';

import { ALL_MODULES, ACTION_LABELS, ALL_MODULE_OPTIONS, MODULES_WITH_RECORDS } from '../../utils/constants';
// { module_name: { can_view: bool, can_create: bool, ... } }

export default function EnquiryForm() {
  const [form] = Form.useForm();
  const { mutate: submit, isPending: submitting, isSuccess } = useCreateEnquiry();
  const { Title, Text } = Typography;
  const [selectedModule, setSelectedModule] = useState(null);
  const [permissionDraft, setPermissionDraft] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const { applyServerErrors } = useFormErrors(form);


  // Is this permission already granted? → disable the checkbox
  const alreadyHas = (moduleName, action) =>
    !!permissions?.[moduleName]?.[action];

  // Toggle a checkbox in the draft
  const togglePerm = (moduleName, action, checked) => {
    setPermissionDraft(prev => ({
      ...prev,
      [moduleName]: { ...prev[moduleName], [action]: checked },
    }));
  };

  // Convert draft object → array format for the API
  const buildRequestedPermissions = () =>
    Object.entries(permissionDraft)
      .filter(([, actions]) => Object.values(actions).some(Boolean))
      .map(([module, actions]) => ({ module, ...actions }));

  // Read permissions from auth store — same source as roleGuard on the backend
  const permissions = useAuthStore((state) => state.permissions);
  const canViewProducts = !!permissions?.products?.can_view;
  const canViewCompanies = !!permissions?.companies?.can_view;
  const canViewMappings = !!permissions?.mappings?.can_view;

  // Filter module options based on what the user can actually see
  const moduleOptions = ALL_MODULE_OPTIONS.filter(
    (opt) => opt.permKey === null || permissions?.[opt.permKey]?.can_view
  );

  // Only fetch data if user has the matching permission — prevents 403 errors
  const { data: productsData } = useProducts({ limit: 999, enabled: canViewProducts });
  const { data: companiesData } = useCompanies({ limit: 999, enabled: canViewCompanies });
  const { data: mappingsData } = useMappings({ limit: 999, enabled: canViewMappings });

  const handleModuleChange = (value) => {
    setSelectedModule(value);
    // Always clear the reference field when the module changes to avoid stale IDs
    form.setFieldValue('reference_id', undefined);
  };

  const getRecordOptions = () => {
    if (selectedModule === 'PRODUCT') {
      return productsData?.data?.map(p => ({ value: p.product_id, label: p.product_name })) || [];
    }
    if (selectedModule === 'COMPANY') {
      return companiesData?.data?.map(c => ({ value: c.company_id, label: c.company_name })) || [];
    }
    if (selectedModule === 'MAPPING') {
      return mappingsData?.data?.map(m => ({ value: m.mapping_id, label: `${m.company?.company_name} - ${m.product?.product_name}` })) || [];
    }
    return [];
  };

  const handleSubmit = (values) => {
    const payload = { ...values };

    if (values.module_type === 'PERMISSION') {
      const requested = buildRequestedPermissions();
      if (requested.length === 0) {
        message.error('Please select at least one permission to request');
        return;
      }
      payload.requested_permissions = requested;
    }

    submit(payload, {
      onSuccess: () => {
        form.resetFields();
        setSelectedModule(null);
        setPermissionDraft({});   // ← reset picker
      },
      onError: (err) => applyServerErrors(err),
    });
  };


  return (
    <div className="enquiry-form-page">
      <Card>
        <Title level={4} className="enquiry-form-page__title">Submit an Enquiry</Title>
        <Text type="secondary" className="enquiry-form-page__subtitle">
          Raise a question or request to the administrator.
        </Text>

        {isSuccess && (
          <Alert
            message="Enquiry submitted successfully! The admin will review it shortly."
            type="success"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>

          <Form.Item
            name="enquiry_name"
            label="Enquiry Subject / Title"
            rules={[{ required: true, message: 'Please provide a title' }]}
          >
            <Input placeholder="Short title for your enquiry" />
          </Form.Item>

          <Form.Item
            name="module_type"
            label="What is your enquiry about?"
            rules={[{ required: true, message: 'Please select a module' }]}
          >
            <Select
              placeholder="Select a module..."
              options={moduleOptions}
              onChange={handleModuleChange}
            />
          </Form.Item>



          {/* Conditional: only show when module requires selecting a record */}
          {selectedModule && MODULES_WITH_RECORDS.includes(selectedModule) && (
            <Form.Item
              name="reference_id"
              label={`Which ${selectedModule.charAt(0) + selectedModule.slice(1).toLowerCase()}?`}
              rules={[{ required: true, message: 'Please select a record' }]}
            >
              <Select
                showSearch
                placeholder={`Select a ${selectedModule.toLowerCase()}...`}
                // TODO: Replace [] with getRecordOptions()
                options={getRecordOptions()}
                filterOption={(input, option) =>
                  option?.label?.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          )}

          {selectedModule === 'PERMISSION' && (
            <Form.Item
              label="Permissions to Request"
              required
              help={
                buildRequestedPermissions().length > 0
                  ? `${buildRequestedPermissions().length} module(s) with new permissions selected`
                  : 'Click the button below to pick which permissions you need'
              }
            >
              <Button onClick={() => setPickerOpen(true)}>
                {buildRequestedPermissions().length > 0
                  ? 'Edit Permission Request'
                  : 'Select Permissions →'}
              </Button>
            </Form.Item>
          )}

          <Form.Item
            name="description"
            label="Describe your query"
            rules={[{ required: true, message: 'Please describe your query' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Describe what you need help with..."
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={submitting}
              className="enquiry-form-submit-btn"
            >
              Submit Enquiry
            </Button>
          </Form.Item>

        </Form>
      </Card>
      <Modal
        title="Select Permissions to Request"
        open={pickerOpen}
        onOk={() => setPickerOpen(false)}
        onCancel={() => setPickerOpen(false)}
        okText="Done"
        width={680}
      >
        <AntTable
          dataSource={ALL_MODULES.map(m => ({ key: m, module: m }))}
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Module',
              dataIndex: 'module',
              render: (m) => (
                <span className="module-name-capitalize">
                  {m.replace(/_/g, ' ')}
                </span>
              ),
            },
            ...Object.entries(ACTION_LABELS).map(([action, label]) => ({
              title: label,
              key: action,
              width: 80,
              align: 'center',
              render: (_, row) => {
                const has = alreadyHas(row.module, action);
                const isRequested = !!permissionDraft[row.module]?.[action];
                const checked = has || isRequested;
                return (
                  <div style={{
                    padding: '4px',
                    backgroundColor: isRequested ? '#e6f4ff' : 'transparent',
                    borderRadius: '4px',
                    transition: 'background-color 0.3s'
                  }}>
                    <Checkbox
                      checked={checked}
                      disabled={has}
                      onChange={(e) => togglePerm(row.module, action, e.target.checked)}
                    />
                  </div>
                );
              },
            })),
          ]}
        />
      </Modal>
    </div>
  );
}
