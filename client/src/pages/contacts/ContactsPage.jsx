import { useMemo } from 'react';
import './ContactsPage.css';
import { Table, Button, Space, Input, Select, Modal } from 'antd';
import { PlusOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import FormModal from '../../components/FormModal';
import ContactViewDrawer from '../../components/ContactViewDrawer';
import ColumnSelector from '../../components/ColumnSelector';
import ExportCsvButton from '../../components/ExportCsvButton';
import BulkImportModal from '../../components/BulkImportModal';
import PermissionGuard from '../../components/PermissionGuard';
import useColumnVisibility from '../../hooks/useColumnVisibility';
import { useContactsPage } from './useContactsPage';
import { buildContactColumns } from './contactColumns';
import { CONTACT_TYPES, LANGUAGES } from '../../utils/constants';
import ContactFormTabs from './ContactFormTabs';

function ContactsPage() {
  const {
    page, setPage,
    search, setSearch,
    filterType, setFilterType,
    filterLang, setFilterLang,
    filterProduct, setFilterProduct,
    filterStatus, setFilterStatus,
    modalOpen, setModalOpen,
    importOpen, setImportOpen,
    editingId, setEditingId,
    selectedCompanyId,
    viewId, setViewId,
    deleteTarget, setDeleteTarget,
    listData, isLoading,
    creating, updating,
    companyOptions, productOptions, branchOptions,
    handleAdd, handleEdit, handleCompanyChange, handleSubmit,
    handleDeleteConfirm, handleImportSuccess,
    deactivate, reactivate,
    queryClient, form,
  } = useContactsPage();

  const allColumns = useMemo(() =>
    buildContactColumns({ onView: setViewId, onEdit: handleEdit, onDelete: setDeleteTarget, onDeactivate: deactivate, onReactivate: reactivate, queryClient }),
    [handleEdit, deactivate, reactivate, queryClient]);

  const { visibleColumns, toggleColumn, hiddenKeys } = useColumnVisibility(allColumns, []);

  return (
    <div>
      <PageHeader
        title="Contacts" subtitle="Manage buyer and company contacts" breadcrumbs={['Contacts']}
        extra={
          <Space>
            <ExportCsvButton module="contacts" moduleName="Contacts" />
            <PermissionGuard module="contacts" action="can_create">
              <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>Import</Button>
            </PermissionGuard>
            <PermissionGuard module="contacts" action="can_create">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="btn-primary-dark">
                Add Contact
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      <div className="contacts-toolbar">
        <Input.Search
          placeholder="Search by name, mobile, or email..."
          allowClear
          onChange={(e) => setSearch(e.target.value)}
          onSearch={setSearch}
          className="contacts-toolbar__search"
          prefix={<SearchOutlined />}
        />
        <Select placeholder="Contact Type" allowClear className="contacts-filter-type"
          value={filterType || undefined} onChange={(v) => { setFilterType(v || ''); setPage(1); }}
          options={CONTACT_TYPES} />
        <Select placeholder="Language" allowClear className="contacts-filter-lang"
          value={filterLang || undefined} onChange={(v) => { setFilterLang(v || ''); setPage(1); }}
          options={LANGUAGES} />
        <Select placeholder="Product Interest" allowClear showSearch optionFilterProp="label" className="contacts-filter-product"
          value={filterProduct || undefined} onChange={(v) => { setFilterProduct(v || ''); setPage(1); }}
          options={productOptions || []} />
        <Select placeholder="Status" allowClear className="contacts-filter-status"
          value={filterStatus === '' ? undefined : filterStatus} onChange={(v) => { setFilterStatus(v ?? ''); setPage(1); }}
          options={[{ value: 0, label: 'Active' }, { value: 2, label: 'Inactive' }]} />
        <ColumnSelector columns={allColumns} hiddenKeys={hiddenKeys} onToggle={toggleColumn} />
      </div>

      <Table
        columns={visibleColumns} dataSource={listData?.data || []}
        loading={isLoading} rowKey="contact_id"
        pagination={{ current: page, total: listData?.pagination?.total || 0, pageSize: 20,
          showSizeChanger: false, showTotal: (t) => `Total ${t} contacts`, onChange: setPage }}
        size="middle"
      />

      <FormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }}
        onSubmit={handleSubmit} title={editingId ? 'Edit Contact' : 'Add Contact'}
        loading={creating || updating} width={800} form={form}>
        <ContactFormTabs
          companyOptions={companyOptions || []} productOptions={productOptions || []}
          branchOptions={branchOptions || []} selectedCompanyId={selectedCompanyId}
          onCompanyChange={handleCompanyChange}
        />
      </FormModal>

      <ContactViewDrawer open={!!viewId} contactId={viewId} onClose={() => setViewId(null)} />

      <BulkImportModal open={importOpen} onClose={() => setImportOpen(false)}
        module="contacts" moduleName="Contacts" onImportSuccess={handleImportSuccess} />

      <Modal open={!!deleteTarget} title="Permanently delete this contact?"
        onOk={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} okText="Delete" okType="danger">
        {deleteTarget && (
          <p><strong>"{deleteTarget.first_name} {deleteTarget.last_name || ''}"</strong> will be permanently removed. This action cannot be undone.</p>
        )}
      </Modal>
    </div>
  );
}

export default ContactsPage;