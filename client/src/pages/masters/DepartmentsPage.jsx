import { departmentHooks } from '../../api/mastersApi';
import MasterPage from '../../components/MasterPage';

function DepartmentsPage() {
  const { data, isLoading } = departmentHooks.useList();
  const { mutate: create, isPending: isCreating } = departmentHooks.useCreate();
  const { mutate: update, isPending: isUpdating } = departmentHooks.useUpdate();
  const { mutate: remove } = departmentHooks.useDelete();

  return (
    <MasterPage
      title="Departments"
      subtitle="Manage internal departments"
      module="departments"
      data={data || []}
      isLoading={isLoading}
      rowKey="department_id"
      nameField="department_name"
      nameLabel="Department Name"
      onAdd={create}
      onEdit={update}
      onDelete={remove}
      isSubmitting={isCreating || isUpdating}
    />
  );
}

export default DepartmentsPage;
