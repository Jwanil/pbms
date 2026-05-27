import { categoryHooks } from '../../api/mastersApi';
import MasterPage from '../../components/MasterPage';

function CategoriesPage() {
  const { data, isLoading } = categoryHooks.useList();
  const { mutate: create, isPending: isCreating } = categoryHooks.useCreate();
  const { mutate: update, isPending: isUpdating } = categoryHooks.useUpdate();
  const { mutate: remove } = categoryHooks.useDelete();

  return (
    <MasterPage
      title="Categories"
      subtitle="Manage product categories"
      module="categories"
      data={data || []}
      isLoading={isLoading}
      rowKey="category_id"
      nameField="category_name"
      nameLabel="Category Name"
      onAdd={create}
      onEdit={update}
      onDelete={remove}
      isSubmitting={isCreating || isUpdating}
    />
  );
}

export default CategoriesPage;
