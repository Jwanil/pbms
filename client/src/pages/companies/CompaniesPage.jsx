import { useMemo } from 'react';
import './CompaniesPage.css';
import { Table, Button, Space, Input, Select, Modal } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import FormModal from '../../components/FormModal';
import CompanyViewDrawer from '../../components/CompanyViewDrawer';
import ColumnSelector from '../../components/ColumnSelector';
import ExportCsvButton from '../../components/ExportCsvButton';
import BulkImportModal from '../../components/BulkImportModal';
import PermissionGuard from '../../components/PermissionGuard';
import useColumnVisibility from '../../hooks/useColumnVisibility';
import { useCompaniesPage } from './useCompaniesPage';
import { buildCompanyColumns } from './companyColumns';
import { COMPANY_TYPES } from '../../utils/constants';
import CompanyFormTabs from './CompanyFormTabs';

function CompaniesPage() {
  const {
    page, setPage,
    search, setSearch,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    modalOpen, setModalOpen,
    importOpen, setImportOpen,
    editingId, setEditingId,
    viewId, setViewId,
    setUploadFiles,
    deleteTarget, setDeleteTarget,
    listData, isLoading,
    creating, updating,
    handleAdd, handleEdit, handleDeleteConfirm, handleSubmit, handleImportSuccess,
    deactivate, reactivate,
    queryClient, form,
  } = useCompaniesPage();

  const allColumns = useMemo(() =>
    buildCompanyColumns({ onView: setViewId, onEdit: handleEdit, onDelete: setDeleteTarget, onDeactivate: deactivate, onReactivate: reactivate, queryClient }),
    [handleEdit, deactivate, reactivate, queryClient]);

  const { visibleColumns, toggleColumn, hiddenKeys } = useColumnVisibility(allColumns, []);

  return (
    <div>
      <PageHeader
        title="Companies" subtitle="Manage manufacturers, suppliers, buyers and distributors" breadcrumbs={['Companies']}
        extra={
          <Space>
            <ExportCsvButton module="companies" moduleName="Companies" />
            <PermissionGuard module="companies" action="can_create">
              <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>Import</Button>
            </PermissionGuard>
            <PermissionGuard module="companies" action="can_create">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="btn-primary-dark">
                Add Company
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      <div className="companies-toolbar">
        <Input.Search
          placeholder="Search by name, email, GST, or mapped product..."
          allowClear
          onChange={(e) => setSearch(e.target.value)}
          onSearch={setSearch}
          className="companies-toolbar__search"
        />
        <div className="companies-toolbar__filters">
          <Select placeholder="Company Type" allowClear className="companies-filter-type"
            value={filterType || undefined} onChange={(v) => { setFilterType(v || ''); setPage(1); }}
            options={COMPANY_TYPES} />
          <Select placeholder="Status" allowClear className="companies-filter-status"
            value={filterStatus || undefined} onChange={(v) => { setFilterStatus(v || ''); setPage(1); }}
            options={[{ value: 0, label: 'Active' }, { value: 2, label: 'Inactive' }]} />
          <ColumnSelector columns={allColumns} hiddenKeys={hiddenKeys} onToggle={toggleColumn} />
        </div>
      </div>

      <Table
        columns={visibleColumns} dataSource={listData?.data || []}
        loading={isLoading} rowKey="company_id"
        pagination={{ current: page, total: listData?.pagination?.total || 0, pageSize: 20,
          showSizeChanger: false, showTotal: (t) => `Total ${t} companies`, onChange: setPage }}
        size="middle"
      />

      <Modal open={!!deleteTarget} title="Permanently delete this company?"
        onOk={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} okText="Delete" okType="danger">
        {deleteTarget && <p><strong>"{deleteTarget.company_name}"</strong> will be permanently removed. This action cannot be undone.</p>}
      </Modal>

      <FormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }}
        onSubmit={handleSubmit} title={editingId ? 'Edit Company' : 'Add Company'}
        loading={creating || updating} width={800} form={form}>
        <CompanyFormTabs isEditing={!!editingId} onFileChange={(e) => setUploadFiles(Array.from(e.target.files))} />
      </FormModal>

      <CompanyViewDrawer open={!!viewId} companyId={viewId} onClose={() => setViewId(null)} />

      <BulkImportModal open={importOpen} onClose={() => setImportOpen(false)}
        module="companies" moduleName="Companies" onImportSuccess={handleImportSuccess} />
    </div>
  );
}

export default CompaniesPage;