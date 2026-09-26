import { useState } from 'react';
import { Check, EyeOff, Trash2 } from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import ConfirmModal from '../../components/common/ConfirmModal';
import StarRating from '../../components/common/StarRating';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getReviews, updateReviewStatus, deleteReview } from '../../services/api';
import { formatDate } from '../../utils/format';

const STATUS = { pending: 'Chờ duyệt', approved: 'Đã duyệt', hidden: 'Đã ẩn' };

export default function AdminReviews() {
  useDocumentTitle('Đánh giá');
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const reviews = useAsync(() => getReviews({ status: filter }), [filter]);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const setStatus = async (r, status) => {
    try {
      await updateReviewStatus(r.id, status);
      reviews.setData((list) =>
        filter && filter !== status ? list.filter((x) => x.id !== r.id) : list.map((x) => (x.id === r.id ? { ...x, status } : x))
      );
      toast.success(status === 'approved' ? 'Đã duyệt đánh giá' : 'Đã ẩn đánh giá');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteReview(deleting.id);
      reviews.setData((list) => list.filter((x) => x.id !== deleting.id));
      toast.success('Đã xóa đánh giá');
      setDeleting(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'userName', header: 'Người gửi', render: (r) => <div><strong>{r.userName}</strong><small className="block">{formatDate(r.createdAt)}</small></div> },
    { key: 'animalName', header: 'Động vật' },
    { key: 'rating', header: 'Điểm', render: (r) => <StarRating value={r.rating} size={14} /> },
    { key: 'comment', header: 'Nội dung', className: 'cell-wide' },
    { key: 'status', header: 'Trạng thái', render: (r) => <span className={`status status--${r.status}`}>{STATUS[r.status]}</span> },
    { key: 'actions', header: '', className: 'cell-actions', render: (r) => (
      <>
        {r.status !== 'approved' && (
          <button className="icon-btn icon-btn--success" onClick={() => setStatus(r, 'approved')} aria-label="Duyệt" title="Duyệt"><Check size={17} /></button>
        )}
        {r.status !== 'hidden' && (
          <button className="icon-btn" onClick={() => setStatus(r, 'hidden')} aria-label="Ẩn" title="Ẩn"><EyeOff size={17} /></button>
        )}
        <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(r)} aria-label="Xóa" title="Xóa"><Trash2 size={17} /></button>
      </>
    ) },
  ];

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <div className="chip-row" role="group" aria-label="Lọc trạng thái">
          {[['', 'Tất cả'], ...Object.entries(STATUS)].map(([k, v]) => (
            <button key={k || 'all'} className={`chip ${filter === k ? 'is-active' : ''}`} onClick={() => setFilter(k)}>{v}</button>
          ))}
        </div>
      </div>
      <DataTable columns={columns} rows={reviews.data} loading={reviews.loading} error={reviews.error} onRetry={reviews.reload} emptyMessage="Không có đánh giá ở trạng thái này." />
      <ConfirmModal
        open={Boolean(deleting)}
        title="Xóa đánh giá"
        message={`Xóa đánh giá của ${deleting?.userName} về ${deleting?.animalName}? Không thể hoàn tác.`}
        confirmLabel="Xóa đánh giá"
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
