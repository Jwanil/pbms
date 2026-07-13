import { useMemo } from 'react';
import './MappingPage.css';
import { Table, Button, Select, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import FormModal from '../../components/FormModal';
import MappingViewDrawer from '../../components/MappingViewDrawer';
import ColumnSelector from '../../components/ColumnSelector';
import PermissionGuard from '../../components/PermissionGuard';
import useColumnVisibility from '../../hooks/useColumnVisibility';
import { useMappingPage } from './useMappingPage';
import { buildMappingColumns } from './mappingColumns';
import { ROLE_TYPES } from '../../utils/constants';
import { MappingAddForm, MappingEditForm } from './MappingFormFields';

function MappingPage() {
  const {
    page, setPage,
    filterCompany, setFilterCompany,
    filterProduct, setFilterProduct,
    filterRole, setFilterRole,
    filterActive, setFilterActive,
    modalOpen, setModalOpen,
    editingId, setEditingId,
    viewId, setViewId,
    deleteTarget, setDeleteTarget,
    listData, isLoading,
    creating, updating,
    editData,
    companyOptions, productOptions,
    handleAdd, handleEdit, handleSubmit, handleDeleteConfirm,
    deactivate, reactivate,
    queryClient, form,
  } = useMappingPage();

  const allColumns = useMemo(() =>
    buildMappingColumns({ onView: setViewId, onEdit: handleEdit, onDelete: setDeleteTarget, onDeactivate: deactivate, onReactivate: reactivate, queryClient }),
    [handleEdit, deactivate, reactivate, queryClient]);

  const { visibleColumns, toggleColumn, hiddenKeys } = useColumnVisibility(allColumns, []);

  return (
    <div>
      <PageHeader
        title="Company Product Mapping" subtitle="Manage company-product relationships" breadcrumbs={['Mappings']}
        extra={
          <PermissionGuard module="mappings" action="can_create">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="btn-primary-dark">
              Add Mapping
            </Button>
          </PermissionGuard>
        }
      />

      <div className="mapping-toolbar">
        <Select placeholder="Company" allowClear showSearch optionFilterProp="label"
          className="mapping-filter-company"
          value={filterCompany || undefined} onChange={(v) => { setFilterCompany(v || ''); setPage(1); }}
          options={companyOptions || []} />
        <Select placeholder="Product" allowClear showSearch optionFilterProp="label"
          className="mapping-filter-product"
          value={filterProduct || undefined} onChange={(v) => { setFilterProduct(v || ''); setPage(1); }}
          options={productOptions || []} />
        <Select placeholder="Role Type" allowClear className="mapping-filter-role"
          value={filterRole || undefined} onChange={(v) => { setFilterRole(v || ''); setPage(1); }}
          options={ROLE_TYPES} />
        <Select placeholder="Status" allowClear className="mapping-filter-status"
          value={filterActive === '' ? undefined : filterActive}
          onChange={(v) => { setFilterActive(v !== undefined && v !== null ? v : ''); setPage(1); }}
          options={[{ value: 0, label: 'Active' }, { value: 2, label: 'Inactive' }]} />
        <ColumnSelector columns={allColumns} hiddenKeys={hiddenKeys} onToggle={toggleColumn} />
      </div>

      <Table
        columns={visibleColumns} dataSource={listData?.data || []}
        loading={isLoading} rowKey="mapping_id"
        pagination={{ current: page, total: listData?.pagination?.total || 0, pageSize: 20,
          showSizeChanger: false, showTotal: (t) => `Total ${t} mappings`, onChange: setPage }}
        size="middle"
      />

      <FormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }}
        onSubmit={handleSubmit} title={editingId ? 'Edit Mapping' : 'Add Mapping'}
        loading={creating || updating} width={600} form={form}>
        {editingId
          ? <MappingEditForm editData={editData} />
          : <MappingAddForm companyOptions={companyOptions || []} productOptions={productOptions || []} />
        }
      </FormModal>

      <MappingViewDrawer open={!!viewId} mappingId={viewId} onClose={() => setViewId(null)} />

      <Modal open={!!deleteTarget} title="Permanently delete this mapping?"
        onOk={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} okText="Delete" okType="danger">
        {deleteTarget && (
          <p><strong>{deleteTarget.company?.company_name} – {deleteTarget.product?.product_name}</strong> will be permanently removed. This action cannot be undone.</p>
        )}
      </Modal>
    </div>
  );
}

export default MappingPage;