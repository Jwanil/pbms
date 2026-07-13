import { Form, Input, Select, Tabs, Divider } from 'antd';

import { UOM_OPTIONS, STATUS_OPTIONS } from '../../utils/constants';

export default function ProductFormTabs({ categoryOptions = [], gradeOptions = [], packagingOptions = [], isEditing, onFileChange }) {
  const items = [
    {
      key: 'basic',
      label: 'Basic Info',
      children: (
        <>
          <Form.Item name="product_name" label="Product Name" rules={[
            { required: true, message: 'Product name is required' },
            { max: 255 },
            { whitespace: true, message: 'Cannot be blank spaces' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="sku" label="SKU" rules={[
            { required: true },
            { max: 100 },
            { pattern: /^[a-zA-Z0-9\-_\/\.]+$/, message: 'Only letters, numbers, and -_/.' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="status_flag" label="Status" rules={[{ required: true }]}>
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item name="composition" label="Composition"><Input /></Form.Item>
          <Form.Item name="cas_number" label="CAS Number" rules={[
            { pattern: /^\d{2,7}-\d{2}-\d{1}$/, message: 'Format: XXXXXXX-XX-X (e.g. 67-64-1)' },
          ]}>
            <Input />
          </Form.Item>
          <Form.Item name="category_id" label="Category">
            <Select allowClear placeholder="Select category" options={categoryOptions} />
          </Form.Item>
          <Form.Item name="grade_id" label="Grade">
            <Select allowClear placeholder="Select grade" options={gradeOptions} />
          </Form.Item>
          <Form.Item name="packaging_id" label="Packaging">
            <Select allowClear placeholder="Select packaging" options={packagingOptions} />
          </Form.Item>
          <Form.Item name="unit_of_measure" label="Unit of Measure">
            <Select allowClear placeholder="Select UOM" options={UOM_OPTIONS} />
          </Form.Item>
        </>
      ),
    },
    {
      key: 'business',
      label: 'Business Info',
      children: (
        <>
          <Form.Item name="hsn_code"            label="HSN Code"><Input /></Form.Item>
          <Form.Item name="shelf_life"           label="Shelf Life"><Input placeholder="e.g. 24 months" /></Form.Item>
          <Form.Item name="industry_application" label="Industry Application"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="description"          label="Description"><Input.TextArea rows={4} /></Form.Item>
          {!isEditing && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <Form.Item label="Initial Documents">
                <Input type="file" multiple onChange={onFileChange} />
              </Form.Item>
            </>
          )}
        </>
      ),
    },
  ];

  return <Tabs items={items} />;
}
