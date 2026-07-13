import { Form, Input, Select, Tabs, Row, Col } from 'antd';
import { CONTACT_TYPES, LANGUAGES, STATUS_OPTIONS } from '../../utils/constants';



export default function ContactFormTabs({ companyOptions = [], productOptions = [], branchOptions = [], selectedCompanyId, onCompanyChange }) {
  const items = [
    {
      key: 'basic',
      label: 'Contact Details',
      children: (
        <Row gutter={16}>
          <Col span={12}><Form.Item name="first_name" label="First Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="last_name"  label="Last Name"><Input /></Form.Item></Col>
          <Col span={12}>
            <Form.Item name="mobile" label="Mobile" rules={[
              { required: true, message: 'Mobile number is required' },
              { pattern: /^[+]?[\d\s\-\(\)]{7,20}$/, message: 'Enter a valid mobile number' },
            ]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="alternate_mobile" label="Alternate Mobile" dependencies={['mobile']} rules={[
              { pattern: /^[+]?[\d\s\-\(\)]{7,20}$/, message: 'Enter a valid phone number' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value) return Promise.resolve();
                  const mobile = getFieldValue('mobile');
                  if (mobile && value.replace(/\s/g, '') === mobile.replace(/\s/g, '')) {
                    return Promise.reject(new Error('Must be different from primary mobile'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}>
              <Input placeholder="+91 98765 43210" />
            </Form.Item>
          </Col>
          <Col span={12}><Form.Item name="email"       label="Email"       rules={[{ type: 'email', message: 'Invalid email format' }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="designation" label="Designation"><Input /></Form.Item></Col>
          <Col span={12}><Form.Item name="contact_type" label="Contact Type"><Select allowClear options={CONTACT_TYPES} /></Form.Item></Col>
          <Col span={12}><Form.Item name="preferred_language" label="Preferred Language"><Select allowClear options={LANGUAGES} /></Form.Item></Col>
          <Col span={12}>
            <Form.Item name="status_flag" label="Status" rules={[{ required: true }]}>
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'company',
      label: 'Company & Branch',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="company_id" label="Company">
              <Select allowClear showSearch optionFilterProp="label"
                placeholder="Select company..." options={companyOptions} onChange={onCompanyChange} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="branch_id" label="Branch">
              <Select allowClear showSearch optionFilterProp="label"
                placeholder={selectedCompanyId ? 'Select branch...' : 'Select company first'}
                disabled={!selectedCompanyId} options={branchOptions} />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: 'interests',
      label: 'Product Interests & Tags',
      children: (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="product_ids" label="Product Interests">
              <Select mode="multiple" showSearch optionFilterProp="label"
                placeholder="Select products this contact is interested in..."
                options={productOptions} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="tags" label="Tags">
              <Select mode="tags" placeholder='Type and press Enter (e.g. "Bulk Buyer", "High Priority")' />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
  ];

  return <Tabs items={items} />;
}
