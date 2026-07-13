import { useMemo } from 'react';
import './ProductsPage.css';
import { Table, Button, Space, Input, Select, Modal } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import FormModal from '../../components/FormModal';
import ProductViewDrawer from '../../components/ProductViewDrawer';
import ColumnSelector from '../../components/ColumnSelector';
import ExportCsvButton from '../../components/ExportCsvButton';
import BulkImportModal from '../../components/BulkImportModal';
import PermissionGuard from '../../components/PermissionGuard';
import useColumnVisibility from '../../hooks/useColumnVisibility';
import { useProductsPage } from './useProductsPage';
import { buildProductColumns } from './productColumns';
import { PRODUCT_STATUS_OPTIONS } from '../../utils/constants';
import ProductFormTabs from './ProductFormTabs';

function ProductsPage() {
  const {
    page, setPage,
    search, setSearch,
    filterCategory, setFilterCategory,
    filterGrade, setFilterGrade,
    filterStatus, setFilterStatus,
    modalOpen, setModalOpen,
    importOpen, setImportOpen,
    editingId, setEditingId,
    viewId, setViewId,
    setUploadFiles,
    deleteTarget, setDeleteTarget,
    listData, isLoading, formData,
    creating, updating,
    handleAdd, handleEdit, handleDelete, handleSubmit, handleImportSuccess,
    deactivate, reactivate,
    queryClient, form,
  } = useProductsPage();

  const categoryOptions  = useMemo(() => (formData?.categories || []).map(c => ({ value: c.category_id, label: c.category_name })), [formData?.categories]);
  const gradeOptions     = useMemo(() => (formData?.grades     || []).map(g => ({ value: g.grade_id,    label: g.grade_name })),    [formData?.grades]);
  const packagingOptions = useMemo(() => (formData?.packaging  || []).map(p => ({ value: p.packaging_id, label: `${p.packaging_name} (${p.size_value} ${p.size_unit})` })), [formData?.packaging]);

  const allColumns = useMemo(() =>
    buildProductColumns({ onView: setViewId, onEdit: handleEdit, onDelete: setDeleteTarget, onDeactivate: deactivate, onReactivate: reactivate, queryClient }),
    [handleEdit, deactivate, reactivate, queryClient]);

  const { visibleColumns, toggleColumn, hiddenKeys } = useColumnVisibility(allColumns, []);

  return (
    <div>
      <PageHeader
        title="Products" subtitle="Manage product catalog" breadcrumbs={['Products']}
        extra={
          <Space>
            <ExportCsvButton module="products" moduleName="Products" />
            <PermissionGuard module="products" action="can_create">
              <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>Import</Button>
            </PermissionGuard>
            <PermissionGuard module="products" action="can_create">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="btn-primary-dark">
                Add Product
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      <div className="products-toolbar">
        <Input.Search
          placeholder="Search by name, SKU, CAS, or mapped company..."
          allowClear
          onChange={(e) => setSearch(e.target.value)}
          onSearch={setSearch}
          className="products-toolbar__search"
        />
        <div className="products-toolbar__filters">
          <Space wrap>
            <Select placeholder="Category" allowClear style={{ width: 160 }}
              value={filterCategory || undefined} onChange={(v) => { setFilterCategory(v || ''); setPage(1); }}
              options={categoryOptions} />
            <Select placeholder="Grade" allowClear style={{ width: 140 }}
              value={filterGrade || undefined} onChange={(v) => { setFilterGrade(v || ''); setPage(1); }}
              options={gradeOptions} />
            <Select placeholder="Status" allowClear style={{ width: 120 }}
              value={filterStatus || undefined} onChange={(v) => { setFilterStatus(v || ''); setPage(1); }}
              options={[{ value: 0, label: 'Active' }, { value: 2, label: 'Inactive' }]} />
          </Space>
          <ColumnSelector columns={allColumns} hiddenKeys={hiddenKeys} onToggle={toggleColumn} />
        </div>
      </div>

      <Table
        columns={visibleColumns} dataSource={listData?.data || []}
        loading={isLoading} rowKey="product_id"
        pagination={{ current: page, total: listData?.pagination?.total || 0, pageSize: 20,
          showSizeChanger: false, showTotal: (t) => `Total ${t} products`, onChange: setPage }}
        size="middle"
      />

      <Modal open={!!deleteTarget} title="Permanently delete this product?"
        onOk={handleDelete} onCancel={() => setDeleteTarget(null)} okText="Delete" okType="danger">
        {deleteTarget && <p><strong>"{deleteTarget.product_name}"</strong> will be permanently removed. This action cannot be undone.</p>}
      </Modal>

      <FormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }}
        onSubmit={handleSubmit} title={editingId ? 'Edit Product' : 'Add Product'}
        loading={creating || updating} width={720} form={form}>
        <ProductFormTabs
          categoryOptions={categoryOptions} gradeOptions={gradeOptions}
          packagingOptions={packagingOptions} isEditing={!!editingId}
          onFileChange={(e) => setUploadFiles(Array.from(e.target.files))}
        />
      </FormModal>

      <ProductViewDrawer open={!!viewId} productId={viewId} onClose={() => setViewId(null)} />

      <BulkImportModal open={importOpen} onClose={() => setImportOpen(false)}
        module="products" moduleName="Products" onImportSuccess={handleImportSuccess} />
    </div>
  );
}

export default ProductsPage;