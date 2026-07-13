import { Form, Input, Select, Tabs, Row, Col, Divider, Card, Button, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import LocationFields from '../../components/LocationFields';
import { COMPANY_TYPES } from '../../utils/constants';

const STATUS_OPTIONS = [
  { value: 0, label: 'Active' },
  { value: 2, label: 'Inactive' },
];

export default function CompanyFormTabs({ isEditing, onFileChange }) {
  const items = [
    {
      key: 'details',
      label: 'Company Details',
      children: (
        <Row gutter={16}>
          <Col span={12}><Form.Item name="company_name" label="Company Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col span={12}>
            <Form.Item name="company_type" label="Company Type" rules={[{ required: true }]}>
              <Select options={COMPANY_TYPES} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="status_flag" label="Status" rules={[{ required: true }]}>
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={24}><Form.Item name="address" label="Address"><Input.TextArea rows={2} /></Form.Item></Col>
          <LocationFields namePrefix={[]} colSpan={8} />
          <Col span={12}><Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Invalid email format' }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="phone" label="Phone" rules={[{ pattern: /^[0-9]{10,15}$/, message: 'Must be 10–15 digits' }]}><Input /></Form.Item></Col>
          <Col span={8}><Form.Item name="gst_number" label="GST Number"><Input maxLength={15} /></Form.Item></Col>
          <Col span={8}><Form.Item name="pan_number" label="PAN Number"><Input maxLength={10} /></Form.Item></Col>
          <Col span={8}><Form.Item name="cin_number" label="CIN Number"><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="website"       label="Website"><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="industry_type" label="Industry Type"><Input /></Form.Item></Col>
          <Col span={24}><Form.Item name="remarks" label="Remarks"><Input.TextArea rows={2} /></Form.Item></Col>
          {!isEditing && (
            <Col span={24}>
              <Divider style={{ margin: '12px 0' }} />
              <Form.Item label="Initial Documents">
                <Input type="file" multiple onChange={onFileChange} />
              </Form.Item>
            </Col>
          )}
        </Row>
      ),
    },
    {
      key: 'branches',
      label: 'Branches',
      children: (
        <Form.List name="branches">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card key={key} size="small" style={{ marginBottom: 12 }}
                  extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />}
                  title={`Branch ${name + 1}`}
                >
                  <Row gutter={12}>
                    <Col span={12}><Form.Item {...restField} name={[name, 'branch_name']} label="Branch Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                    <Col span={12}><Form.Item {...restField} name={[name, 'gst_number']} label="GST"><Input maxLength={15} /></Form.Item></Col>
                    <Col span={12}><Form.Item {...restField} name={[name, 'address_line1']} label="Address Line 1"><Input /></Form.Item></Col>
                    <Col span={12}><Form.Item {...restField} name={[name, 'address_line2']} label="Address Line 2"><Input /></Form.Item></Col>
                    <LocationFields restField={restField} namePrefix={[name]} />
                    <Col span={8}><Form.Item {...restField} name={[name, 'pincode']} label="Pincode"><Input /></Form.Item></Col>
                    <Col span={8}><Form.Item {...restField} name={[name, 'contact_number']} label="Contact Number" rules={[{ pattern: /^[0-9]{10,15}$/, message: 'Must be 10–15 digits' }]}><Input /></Form.Item></Col>
                    <Col span={8}><Form.Item {...restField} name={[name, 'email']} label="Email" rules={[{ type: 'email', message: 'Invalid email format' }]}><Input /></Form.Item></Col>
                    <Col span={4}><Form.Item {...restField} name={[name, 'latitude']}  label="Latitude"  rules={[{ type: 'number', min: -90,  max: 90  }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    <Col span={4}><Form.Item {...restField} name={[name, 'longitude']} label="Longitude" rules={[{ type: 'number', min: -180, max: 180 }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                  </Row>
                  <Form.Item {...restField} name={[name, 'branch_id']} hidden><Input /></Form.Item>
                </Card>
              ))}
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Branch</Button>
            </>
          )}
        </Form.List>
      ),
    },
  ];

  return <Tabs items={items} />;
}
