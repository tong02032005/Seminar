import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import ZoneFormModal from '../../components/admin/ZoneFormModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getZones, createZone, updateZone, deleteZone } from '../../services/api';

export default function AdminZones() {
  useDocumentTitle('Quản lý khu vực');
  const toast = useToast();
  const zones = useAsync(getZones, []);
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSave = async (form) => {
    setBusy(true);
    try {
      if (editing) await updateZone(editing.id, form);
      else await createZone(form);
      toast.success(editing ? `Đã lưu ${form.name}` : `Đã thêm ${form.name}`);
      setEditing(undefined);
      zones.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteZone(deleting.id);
      toast.success(`Đã xóa ${deleting.name}`);
      setDeleting(null);
      zones.reload();
    } catch (err) {
      toast.error(err.message);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Khu vực', render: (z) => (
      <div className="cell-media">
        <span className="color-dot" style={{ background: z.color }} />
        <div><strong>{z.emoji} {z.name}</strong><small>Mã: {z.id}</small></div>
      </div>
    ) },
    { key: 'animalCount', header: 'Số loài' },
    { key: 'openHours', header: 'Giờ mở cửa' },
    { key: 'area', header: 'Diện tích' },
    { key: 'actions', header: '', className: 'cell-actions', render: (z) => (
      <>
        <button className="icon-btn" onClick={() => setEditing(z)} aria-label={`Sửa ${z.name}`}><Pencil size={17} /></button>
        <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(z)} aria-label={`Xóa ${z.name}`}><Trash2 size={17} /></button>
      </>
    ) },
  ];

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <p className="muted">{zones.data?.length ?? 0} khu vực</p>
        <button className="btn btn--primary" onClick={() => setEditing(null)}><Plus size={18} /> Thêm khu vực</button>
      </div>
      <DataTable columns={columns} rows={zones.data} loading={zones.loading} error={zones.error} onRetry={zones.reload} />
      <ZoneFormModal open={editing !== undefined} zone={editing} saving={busy} onSave={handleSave} onClose={() => setEditing(undefined)} />
      <ConfirmModal
        open={Boolean(deleting)}
        title="Xóa khu vực"
        message={`Xóa "${deleting?.name}"? Chỉ xóa được khu vực không còn động vật.`}
        confirmLabel="Xóa khu vực"
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
