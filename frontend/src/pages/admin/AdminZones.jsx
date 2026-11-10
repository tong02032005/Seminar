import { useState } from 'react';
import { Pencil } from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import ZoneFormModal from '../../components/admin/ZoneFormModal';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import { useAsync } from '../../hooks/useAsync';
import { useAdminLanguages } from '../../hooks/useAdminLookups';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { mediaUrl } from '../../services/config';
import { formatHours } from '../../utils/format';
import { getZonesAdmin } from '../../services/api';

/** UC07 – quản lý khu vực: 5 khu cố định, chỉ sửa (không thêm/xóa) */
export default function AdminZones() {
  useDocumentTitle('Quản lý khu vực');
  const toast = useToast();
  const { languages, defaultLang, ready } = useAdminLanguages();
  const zones = useAsync(getZonesAdmin, []);
  const [editing, setEditing] = useState(undefined);

  const handleSaved = () => {
    toast.success('Đã lưu khu vực');
    setEditing(undefined);
    zones.reload();
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
    { key: 'animal_count', header: 'Số động vật' },
    {
      key: 'actions', header: '', className: 'cell-actions',
      render: (z) => (
        <button className="icon-btn" onClick={() => setEditing(z.id)} aria-label={`Sửa ${z.name}`}><Pencil size={17} /></button>
      ),
    },
  ];

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <span className="field__hint">Sở thú có 5 khu cố định, vị trí trên bản đồ không đổi. Bạn có thể sửa tên, mô tả, màu, giờ mở cửa và ảnh.</span>
      </div>
      <DataTable columns={columns} rows={zones.data} loading={zones.loading} error={zones.error} onRetry={zones.reload} />
      {ready && (
        <ZoneFormModal open={editing !== undefined} zoneId={editing} languages={languages} defaultLang={defaultLang} onSaved={handleSaved} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}
