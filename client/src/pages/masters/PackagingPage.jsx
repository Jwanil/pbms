import { packagingHooks } from '../../api/mastersApi';
import MasterPage from '../../components/MasterPage';

function PackagingPage() {
  const { data, isLoading } = packagingHooks.useList();
  const { mutate: create, isPending: isCreating } = packagingHooks.useCreate();
  const { mutate: update, isPending: isUpdating } = packagingHooks.useUpdate();
  const { mutate: remove } = packagingHooks.useDelete();

  return (
    <MasterPage
      title="Packaging"
      subtitle="Manage packaging types"
      module="packaging"
      data={data || []}
      isLoading={isLoading}
      rowKey="packaging_id"
      nameField="packaging_name"
      nameLabel="Packaging Name"
      extraFields={[
        { name: 'size_unit', label: 'Size Unit', rules: [{ required: true }] },
        { name: 'size_value', label: 'Size Value', type: 'number', rules: [{ required: true }] },
      ]}
      onAdd={create}
      onEdit={update}
      onDelete={remove}
      isSubmitting={isCreating || isUpdating}
    />
  );
}

export default PackagingPage;
