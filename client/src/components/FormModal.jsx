import { Modal, Form, Button, Space } from 'antd';
import './styles/FormModal.css';

function FormModal({ open, onClose, onSubmit, title, children, loading = false, width = 640, form }) {
  const handleOk = () => {
    form.validateFields()
      .then((values) => onSubmit(values))
      .catch(() => {});
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={title}
      width={width}
      footer={
        <Space>
          <Button onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button type="primary" onClick={handleOk} loading={loading} className="form-modal-submit-btn">
            Save
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="form-modal-form" autoComplete="off">
        {children}
      </Form>
    </Modal>
  );
}

export default FormModal;
