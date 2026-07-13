import { Form, Select, InputNumber } from 'antd';
import { ROLE_TYPES, STATUS_OPTIONS } from '../../utils/constants';

/** Fields shown in both add and edit modes */
function MappingTermsFields() {
  return (
    <>
      <Form.Item name="moq" label="Minimum Order Quantity (MOQ)" rules={[
        { type: 'number', min: 0.01, message: 'MOQ must be greater than 0' },
        { type: 'number', max: 999999999, message: 'MOQ value is too large' },
      ]}>
        <InputNumber className="mapping-input-full" min={0.01} step={0.01} placeholder="e.g. 500" />
      </Form.Item>
      <Form.Item name="price_range_min" label="Price Range Min (₹)" rules={[
        { type: 'number', min: 0, message: 'Minimum price cannot be negative' },
      ]}>
        <InputNumber className="mapping-input-full" min={0} step={0.01} placeholder="e.g. 120.00" />
      </Form.Item>
      <Form.Item name="price_range_max" label="Price Range Max (₹)" dependencies={['price_range_min']} rules={[
        { type: 'number', min: 0, message: 'Maximum price cannot be negative' },
        ({ getFieldValue }) => ({
          validator(_, value) {
            const min = getFieldValue('price_range_min');
            if (!value || !min || value >= min) return Promise.resolve();
            return Promise.reject(new Error('Max price must be ≥ min price'));
          },
        }),
      ]}>
        <InputNumber className="mapping-input-full" min={0} step={0.01} placeholder="e.g. 150.00" />
      </Form.Item>
      <Form.Item name="lead_time_days" label="Lead Time (Days)" rules={[
        { type: 'number', min: 1, message: 'Lead time must be at least 1 day' },
        { type: 'number', max: 3650, message: 'Lead time cannot exceed 3650 days' },
        { type: 'integer', message: 'Lead time must be a whole number' },
      ]}>
        <InputNumber className="mapping-input-full" min={1} max={3650} step={1} precision={0} placeholder="e.g. 14" />
      </Form.Item>
      <Form.Item name="status_flag" label="Status" rules={[{ required: true, message: 'Please select status' }]}>
        <Select options={STATUS_OPTIONS} />
      </Form.Item>
    </>
  );
}

/** Add mode: shows company/product/role selectors + terms */
export function MappingAddForm({ companyOptions = [], productOptions = [] }) {
  return (
    <>
      <Form.Item name="company_id" label="Company" rules={[{ required: true, message: 'Select a company' }]}>
        <Select showSearch optionFilterProp="label" placeholder="Search company..." options={companyOptions} />
      </Form.Item>
      <Form.Item name="product_id" label="Product" rules={[{ required: true, message: 'Select a product' }]}>
        <Select showSearch optionFilterProp="label" placeholder="Search product..." options={productOptions} />
      </Form.Item>
      <Form.Item name="role_type" label="Role Type" rules={[{ required: true }]}>
        <Select options={ROLE_TYPES} />
      </Form.Item>
      <MappingTermsFields />
    </>
  );
}

/** Edit mode: shows read-only company/product/role info + editable terms */
export function MappingEditForm({ editData }) {
  return (
    <>
      <div className="mapping-edit-info">
        <p><strong>Company:</strong> {editData?.company?.company_name}</p>
        <p><strong>Product:</strong> {editData?.product?.product_name} ({editData?.product?.sku})</p>
        <p><strong>Role:</strong> {editData?.role_type}</p>
      </div>
      <MappingTermsFields />
    </>
  );
}
