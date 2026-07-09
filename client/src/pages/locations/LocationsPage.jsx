import { useState } from 'react';
import './LocationsPage.css';
import { Table, Button, Space, Input, Select, Tag, Form, Tabs, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import FormModal from '../../components/FormModal';
import StatusBadge from '../../components/StatusBadge';
import PermissionGuard from '../../components/PermissionGuard';
import {
  useCountries, useCreateCountry, useUpdateCountry, useDeactivateCountry, useReactivateCountry,
  useStates,    useCreateState,   useUpdateState,   useDeactivateState,   useReactivateState,
  useCities,    useCreateCity,    useUpdateCity,    useDeactivateCity,    useReactivateCity,
} from '../../api/locationsApi';
import useDebounce from "../../hooks/useDebounce";
// ─── COUNTRIES TAB ────────────────────────────────────────────────────────────
function CountriesTab() {
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [includeInactive, setIncludeInactive] = useState(false);

  const { data: countries = [], isLoading } = useCountries({ includeInactive });
  const { mutate: create, isPending: creating } = useCreateCountry();
  const { mutate: update, isPending: updating } = useUpdateCountry();
  const { mutate: deactivate } = useDeactivateCountry();
  const { mutate: reactivate } = useReactivateCountry();

  const filtered = countries.filter(c => c.country_name.toLowerCase().includes(debouncedSearch.toLowerCase()));

  const handleAdd = () => { setEditingId(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (r) => { setEditingId(r.country_id); form.setFieldsValue(r); setModalOpen(true); };

  const handleSubmit = (values) => {
    if (editingId) {
      update({ id: editingId, data: values }, { onSuccess: () => { setModalOpen(false); setEditingId(null); } });
    } else {
      create(values, { onSuccess: () => setModalOpen(false) });
    }
  };

  const columns = [
    { title: 'Country Name', dataIndex: 'country_name', key: 'name' },
    { title: 'Code', dataIndex: 'country_code', key: 'code', render: v => v ? <Tag>{v}</Tag> : '—' },
    { title: 'States', key: 'states', render: (_, r) => r._count?.states ?? 0 },
    { title: 'Status', key: 'status', render: (_, r) => <StatusBadge status={r.is_active ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      title: 'Actions', key: 'actions',
      render: (_, r) => (
        <Space>
          <PermissionGuard module="locations_countries" action="can_edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>Edit</Button>
          </PermissionGuard>
          <PermissionGuard module="locations_countries" action="can_delete">
            {r.is_active ? (
              <Popconfirm title="Deactivate this country? All its states and cities will also be deactivated." onConfirm={() => deactivate(r.country_id)}>
                <Button size="small" danger icon={<StopOutlined />}>Deactivate</Button>
              </Popconfirm>
            ) : (
              <Button size="small" icon={<CheckCircleOutlined />} onClick={() => reactivate(r.country_id)}>Reactivate</Button>
            )}
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="locations-toolbar">
        <Input.Search placeholder="Search countries..." allowClear onChange={e => setSearch(e.target.value)} className="locations-search" />
        <div className="locations-toolbar__left">
          <Select value={includeInactive} onChange={setIncludeInactive} className="locations-filter-active"
            options={[{ value: false, label: 'Active only' }, { value: true, label: 'Include inactive' }]} />
          <PermissionGuard module="locations_countries" action="can_create">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="btn-primary-dark">Add Country</Button>
          </PermissionGuard>
        </div>
      </div>
      <Table columns={columns} dataSource={filtered} rowKey="country_id" loading={isLoading} size="middle" pagination={{ pageSize: 20 }} />
      <FormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }} onSubmit={handleSubmit}
        title={editingId ? 'Edit Country' : 'Add Country'} loading={creating || updating} form={form}>
        <Form.Item name="country_name" label="Country Name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="country_code" label="Country Code (ISO 3)" extra="e.g. IND, USA, GBR"><Input maxLength={3} className="locations-country-code-input" /></Form.Item>
      </FormModal>
    </div>
  );
}

// ─── STATES TAB ───────────────────────────────────────────────────────────────
function StatesTab() {
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterCountryId, setFilterCountryId] = useState(undefined);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [includeInactive, setIncludeInactive] = useState(false);

  const { data: countries = [] } = useCountries({ includeInactive: true });
  const { data: states = [], isLoading } = useStates({ countryId: filterCountryId, includeInactive });
  const { mutate: create, isPending: creating } = useCreateState();
  const { mutate: update, isPending: updating } = useUpdateState();
  const { mutate: deactivate } = useDeactivateState();
  const { mutate: reactivate } = useReactivateState();

  const filtered = states.filter(s => s.state_name.toLowerCase().includes(debouncedSearch.toLowerCase()));

  const handleAdd = () => { setEditingId(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (r) => { setEditingId(r.state_id); form.setFieldsValue({ state_name: r.state_name, country_id: r.country?.country_id }); setModalOpen(true); };

  const handleSubmit = (values) => {
    if (editingId) {
      update({ id: editingId, data: values }, { onSuccess: () => { setModalOpen(false); setEditingId(null); } });
    } else {
      create(values, { onSuccess: () => setModalOpen(false) });
    }
  };

  const columns = [
    { title: 'State Name', dataIndex: 'state_name', key: 'name' },
    { title: 'Country', key: 'country', render: (_, r) => r.country?.country_name || '—' },
    { title: 'Cities', key: 'cities', render: (_, r) => r._count?.cities ?? 0 },
    { title: 'Status', key: 'status', render: (_, r) => <StatusBadge status={r.is_active ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      title: 'Actions', key: 'actions',
      render: (_, r) => (
        <Space>
          <PermissionGuard module="locations_states" action="can_edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>Edit</Button>
          </PermissionGuard>
          <PermissionGuard module="locations_states" action="can_delete">
            {r.is_active ? (
              <Popconfirm title="Deactivate this state? All its cities will also be deactivated." onConfirm={() => deactivate(r.state_id)}>
                <Button size="small" danger icon={<StopOutlined />}>Deactivate</Button>
              </Popconfirm>
            ) : (
              <Button size="small" icon={<CheckCircleOutlined />} onClick={() => reactivate(r.state_id)}>Reactivate</Button>
            )}
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="locations-toolbar">
        <Input.Search placeholder="Search states..." allowClear onChange={e => setSearch(e.target.value)} className="locations-search" />
        <div className="locations-toolbar__left">
          <Select allowClear placeholder="Filter by Country" className="locations-filter-country"
            value={filterCountryId} onChange={v => setFilterCountryId(v)}
            options={countries.map(c => ({ value: c.country_id, label: c.country_name }))} />
          <Select value={includeInactive} onChange={setIncludeInactive} className="locations-filter-active"
            options={[{ value: false, label: 'Active only' }, { value: true, label: 'Include inactive' }]} />
          <PermissionGuard module="locations_states" action="can_create">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="btn-primary-dark">Add State</Button>
          </PermissionGuard>
        </div>
      </div>
      <Table columns={columns} dataSource={filtered} rowKey="state_id" loading={isLoading} size="middle" pagination={{ pageSize: 20 }} />
      <FormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }} onSubmit={handleSubmit}
        title={editingId ? 'Edit State' : 'Add State'} loading={creating || updating} form={form}>
        <Form.Item name="country_id" label="Country" rules={[{ required: true, message: 'Select a country' }]}>
          <Select showSearch placeholder="Select Country" filterOption={(i, o) => o?.label?.toLowerCase().includes(i.toLowerCase())}
            options={countries.filter(c => c.is_active).map(c => ({ value: c.country_id, label: c.country_name }))} />
        </Form.Item>
        <Form.Item name="state_name" label="State Name" rules={[{ required: true }]}><Input /></Form.Item>
      </FormModal>
    </div>
  );
}

// ─── CITIES TAB ───────────────────────────────────────────────────────────────
function CitiesTab() {
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterCountryId, setFilterCountryId] = useState(undefined);
  const [filterStateId, setFilterStateId] = useState(undefined);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [includeInactive, setIncludeInactive] = useState(false);

  const { data: countries = [] } = useCountries({ includeInactive: true });
  const { data: allStates = [] } = useStates({ countryId: filterCountryId, includeInactive: true });
  const { data: formStates = [] } = useStates({ includeInactive: true });
  const { data: cities = [], isLoading } = useCities({ stateId: filterStateId, includeInactive });
  const { mutate: create, isPending: creating } = useCreateCity();
  const { mutate: update, isPending: updating } = useUpdateCity();
  const { mutate: deactivate } = useDeactivateCity();
  const { mutate: reactivate } = useReactivateCity();

  const filtered = cities.filter(c => c.city_name.toLowerCase().includes(debouncedSearch.toLowerCase()));

  const handleAdd = () => { setEditingId(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (r) => { setEditingId(r.city_id); form.setFieldsValue({ city_name: r.city_name, state_id: r.state?.state_id }); setModalOpen(true); };

  const handleSubmit = (values) => {
    if (editingId) {
      update({ id: editingId, data: values }, { onSuccess: () => { setModalOpen(false); setEditingId(null); } });
    } else {
      create(values, { onSuccess: () => setModalOpen(false) });
    }
  };

  const columns = [
    { title: 'City Name', dataIndex: 'city_name', key: 'name' },
    { title: 'State', key: 'state', render: (_, r) => r.state?.state_name || '—' },
    { title: 'Country', key: 'country', render: (_, r) => r.state?.country?.country_name || '—' },
    { title: 'Status', key: 'status', render: (_, r) => <StatusBadge status={r.is_active ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      title: 'Actions', key: 'actions',
      render: (_, r) => (
        <Space>
          <PermissionGuard module="locations_cities" action="can_edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>Edit</Button>
          </PermissionGuard>
          <PermissionGuard module="locations_cities" action="can_delete">
            {r.is_active ? (
              <Popconfirm title="Deactivate this city?" onConfirm={() => deactivate(r.city_id)}>
                <Button size="small" danger icon={<StopOutlined />}>Deactivate</Button>
              </Popconfirm>
            ) : (
              <Button size="small" icon={<CheckCircleOutlined />} onClick={() => reactivate(r.city_id)}>Reactivate</Button>
            )}
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="locations-toolbar">
        <Input.Search placeholder="Search cities..." allowClear onChange={e => setSearch(e.target.value)} className="locations-search" />
        <div className="locations-toolbar__left">
          <Select allowClear placeholder="Filter by Country" className="locations-filter-country-sm"
            value={filterCountryId} onChange={v => { setFilterCountryId(v); setFilterStateId(undefined); }}
            options={countries.map(c => ({ value: c.country_id, label: c.country_name }))} />
          <Select allowClear placeholder="Filter by State" className="locations-filter-state"
            value={filterStateId} onChange={v => setFilterStateId(v)} disabled={!filterCountryId}
            options={allStates.map(s => ({ value: s.state_id, label: s.state_name }))} />
          <Select value={includeInactive} onChange={setIncludeInactive} className="locations-filter-active"
            options={[{ value: false, label: 'Active only' }, { value: true, label: 'Include inactive' }]} />
          <PermissionGuard module="locations_cities" action="can_create">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="btn-primary-dark">Add City</Button>
          </PermissionGuard>
        </div>
      </div>
      <Table columns={columns} dataSource={filtered} rowKey="city_id" loading={isLoading} size="middle" pagination={{ pageSize: 20 }} />
      <FormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }} onSubmit={handleSubmit}
        title={editingId ? 'Edit City' : 'Add City'} loading={creating || updating} form={form}>
        <Form.Item name="state_id" label="State" rules={[{ required: true, message: 'Select a state' }]}>
          <Select showSearch placeholder="Select State" filterOption={(i, o) => o?.label?.toLowerCase().includes(i.toLowerCase())}
            options={formStates.filter(s => s.is_active).map(s => ({ value: s.state_id, label: `${s.state_name} (${s.country?.country_name})` }))} />
        </Form.Item>
        <Form.Item name="city_name" label="City Name" rules={[{ required: true }]}><Input /></Form.Item>
      </FormModal>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function LocationsPage() {
  const tabs = [
    {
      key: 'countries',
      label: <span><EnvironmentOutlined className="locations-tab-icon" />Countries</span>,
      children: <CountriesTab />,
    },
    {
      key: 'states',
      label: <span><EnvironmentOutlined className="locations-tab-icon" />States</span>,
      children: <StatesTab />,
    },
    {
      key: 'cities',
      label: <span><EnvironmentOutlined className="locations-tab-icon" />Cities</span>,
      children: <CitiesTab />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Location Masters"
        subtitle="Manage countries, states, and cities used across the system"
        breadcrumbs={['Location Masters']}
      />
      <Tabs defaultActiveKey="countries" items={tabs} />
    </div>
  );
}
