import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import ZoneFormModal from '../../components/admin/ZoneFormModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import { useAsync } from '../../hooks/useAsync';
import { useAdminLanguages } from '../../hooks/useAdminLookups';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { mediaUrl } from '../../services/config';
import { formatArea, formatHours } from '../../utils/format';
import { getZonesAdmin, deleteZone } from '../../services/api';

/** UC07 – quản lý khu vực */
export default function AdminZones() {
  useDocumentTitle('Quản lý khu vực');
  const toast = useToast();
  const { languages, defaultLang, ready } = useAdminLanguages();
  const zones = useAsync(getZonesAdmin, []);
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSaved = (saved, isNew) => {
    toast.success(isNew ? 'Đã thêm khu vực' : 'Đã lưu khu vực');
    setEditing(undefined);
    zones.reload();
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteZone(deleting.id);
      toast.success(`Đã xóa ${deleting.name}`);
      zones.reload();
    } catch (err) {
      toast.error(err.message); // 409: khu vực còn động vật
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  };

  const columns = [
    {
      key: 'name', header: 'Khu vực',
      render: (z) => (
        <div className="cell-media">
          <ImageWithFallback src={mediaUrl(z.image)} alt="" fallbackEmoji="🌿" />
          <div><strong>{z.name}</strong></div>
        </div>
      ),
    },
    { key: 'color', header: 'Màu', render: (z) => <span className="color-dot" style={{ background: z.color ?? '#ccc', display: 'inline-block' }} title={z.color} /> },
    { key: 'open_hours', header: 'Giờ mở cửa', render: (z) => formatHours(z.open_hours) },
    { key: 'area_m2', header: 'Diện tích', render: (z) => formatArea(z.area_m2) },
    { key: 'animal_count', header: 'Số động vật' },
    {
      key: 'actions', header: '', className: 'cell-actions',
      render: (z) => (
        <>
          <button className="icon-btn" onClick={() => setEditing(z.id)} aria-label={`Sửa ${z.name}`}><Pencil size={17} /></button>
          <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(z)} aria-label={`Xóa ${z.name}`}><Trash2 size={17} /></button>
        </>
      ),
    },
  ];

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <button className="btn btn--primary" onClick={() => setEditing(null)} disabled={!ready}><Plus size={18} /> Thêm khu vực</button>
      </div>
      <DataTable columns={columns} rows={zones.data} loading={zones.loading} error={zones.error} onRetry={zones.reload} />
      {ready && (
        <ZoneFormModal open={editing !== undefined} zoneId={editing} languages={languages} defaultLang={defaultLang} onSaved={handleSaved} onClose={() => setEditing(undefined)} />
      )}
      <ConfirmModal
        open={Boolean(deleting)}
        title="Xóa khu vực"
        message={deleting?.animal_count
          ? `Khu vực "${deleting.name}" còn ${deleting.animal_count} động vật nên chưa xóa được. Hãy chuyển các động vật sang khu vực khác trước.`
          : `Xóa khu vực "${deleting?.name}"?`}
        confirmLabel="Xóa khu vực"
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
