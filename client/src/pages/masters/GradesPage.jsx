import { gradeHooks } from '../../api/mastersApi';
import MasterPage from '../../components/MasterPage';

function GradesPage() {
  const { data, isLoading } = gradeHooks.useList();
  const { mutate: create, isPending: isCreating } = gradeHooks.useCreate();
  const { mutate: update, isPending: isUpdating } = gradeHooks.useUpdate();
  const { mutate: remove } = gradeHooks.useDelete();

  return (
    <MasterPage
      title="Grades"
      subtitle="Manage product grades"
      module="grades"
      data={data || []}
      isLoading={isLoading}
      rowKey="grade_id"
      nameField="grade_name"
      nameLabel="Grade Name"
      onAdd={create}
      onEdit={update}
      onDelete={remove}
      isSubmitting={isCreating || isUpdating}
    />
  );
}

export default GradesPage;
