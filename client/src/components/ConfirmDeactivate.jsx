import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import './styles/ConfirmDeactivate.css';

function ConfirmDeactivate({ open, onConfirm, onCancel, recordName = 'this record', loading = false }) {
  return (
    <Modal
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Deactivate"
      cancelText="Cancel"
      okButtonProps={{ danger: true, loading }}
      title={
        <span>
          <ExclamationCircleOutlined className="confirm-deactivate__icon" />
          Confirm Deactivation
        </span>
      }
    >
      <p>
        Are you sure you want to deactivate <strong>{recordName}</strong>?
        The record will be set to Inactive and can be reactivated later.
      </p>
    </Modal>
  );
}

export default ConfirmDeactivate;
