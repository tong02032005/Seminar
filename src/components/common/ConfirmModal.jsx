import Modal from './Modal';

export default function ConfirmModal({
  open, title = 'Xác nhận', message, confirmLabel = 'Xóa', loading = false, onConfirm, onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <button className="btn btn--ghost" onClick={onCancel} disabled={loading}>Hủy</button>
          <button className="btn btn--danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Đang xử lý…' : confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
