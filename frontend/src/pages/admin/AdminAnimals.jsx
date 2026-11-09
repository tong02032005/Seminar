import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, MapPin } from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import AnimalFormModal from '../../components/admin/AnimalFormModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import ConservationBadge from '../../components/common/ConservationBadge';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useAdminLanguages } from '../../hooks/useAdminLookups';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { mediaUrl } from '../../services/config';
import { getAnimalsAdmin, getZonesAdmin, getCategories, getConservationStatuses, updateAnimal, deleteAnimal } from '../../services/api';

const PAGE_SIZE = 20;

/** UC04 – quản lý động vật (gồm cả động vật đang ẩn) */
export default function AdminAnimals() {
  useDocumentTitle('Quản lý động vật');
  const toast = useToast();
  const { languages, defaultLang, ready } = useAdminLanguages();
  const [search, setSearch] = useState('');
  const q = useDebounce(search, 300);
  const [zoneId, setZoneId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);

  const animals = useAsync(
    () => getAnimalsAdmin({ q: q || undefined, zone_id: zoneId || undefined, category_id: categoryId || undefined, page, size: PAGE_SIZE, lang: 'vi' }),
    [q, zoneId, categoryId, page]
  );
  const zones = useAsync(getZonesAdmin, []);
  const categories = useAsync(() => getCategories('vi'), []);
  const statuses = useAsync(() => getConservationStatuses('vi'), []);

  const [editing, setEditing] = useState(undefined); // undefined = đóng, null = thêm mới, số = id đang sửa
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [busy, setBusy] = useState(false);

  const status = (code) => statuses.data?.find((s) => s.code === code);
  const totalPages = Math.max(1, Math.ceil((animals.data?.total ?? 0) / PAGE_SIZE));
  const filter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  const toggleAvailable = async (a) => {
    try {
      await updateAnimal(a.id, { available: !a.available });
      animals.setData((d) => ({ ...d, items: d.items.map((x) => (x.id === a.id ? { ...x, available: !a.available } : x)) }));
      toast.success(a.available ? `Đã ẩn ${a.name}` : `Đã hiện ${a.name}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaved = (saved, isNew) => {
    const name = saved.translations.find((t) => t.lang === defaultLang)?.name ?? saved.scientific_name;
    toast.success(isNew ? `Đã thêm ${name}` : `Đã lưu ${name}`);
    setEditing(undefined);
    animals.reload();
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteAnimal(deleting.id);
      toast.success(`Đã xóa ${deleting.name}`);
      setDeleting(null);
      animals.reload();
    } catch (err) {
      if (err.status === 409) setDeleteError(err.message);
      else toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'name', header: 'Động vật',
      render: (a) => (
        <div className="cell-media">
          <ImageWithFallback src={mediaUrl(a.image)} alt="" fallbackEmoji="🐾" />
          <div><strong>{a.name}</strong><small className="scientific">{a.scientific_name}</small></div>
        </div>
      ),
    },
    { key: 'category_name', header: 'Nhóm' },
    { key: 'zone_name', header: 'Khu vực' },
    { key: 'status', header: 'Bảo tồn', render: (a) => <ConservationBadge code={a.conservation_status_code} color={status(a.conservation_status_code)?.color} /> },
    { key: 'poi', header: 'POI', render: (a) => (a.has_poi ? <span className="tag tag--ok"><MapPin size={13} /> Có</span> : <span className="tag">Chưa có</span>) },
    {
      key: 'available', header: 'Hiển thị',
      render: (a) => (
        <button className={`tag tag--button ${a.available ? 'tag--ok' : 'tag--off'}`} onClick={() => toggleAvailable(a)} title="Bấm để đổi ẩn/hiện">
          {a.available ? <><Eye size={13} /> Đang hiện</> : <><EyeOff size={13} /> Đang ẩn</>}
        </button>
      ),
    },
    {
      key: 'actions', header: '', className: 'cell-actions',
      render: (a) => (
        <>
          <button className="icon-btn" onClick={() => setEditing(a.id)} aria-label={`Sửa ${a.name}`}><Pencil size={17} /></button>
          <button className="icon-btn icon-btn--danger" onClick={() => { setDeleteError(''); setDeleting(a); }} aria-label={`Xóa ${a.name}`}><Trash2 size={17} /></button>
        </>
      ),
    },
  ];

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <div className="search-input search-input--sm">
          <Search size={16} />
          <input value={search} onChange={filter(setSearch)} placeholder="Tìm tên hoặc tên khoa học…" aria-label="Tìm động vật" />
        </div>
        <select value={zoneId} onChange={filter(setZoneId)} aria-label="Lọc theo khu vực">
          <option value="">Tất cả khu vực</option>
          {zones.data?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        <select value={categoryId} onChange={filter(setCategoryId)} aria-label="Lọc theo nhóm">
          <option value="">Tất cả nhóm</option>
          {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn--primary" onClick={() => setEditing(null)} disabled={!ready}><Plus size={18} /> Thêm động vật</button>
      </div>

      <DataTable columns={columns} rows={animals.data?.items} loading={animals.loading} error={animals.error} onRetry={animals.reload} />

      {totalPages > 1 && (
        <div className="pager">
          <button className="btn btn--ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Trước</button>
          <span>Trang {page}/{totalPages} · {animals.data?.total} động vật</span>
          <button className="btn btn--ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau ›</button>
        </div>
      )}

      {ready && (
        <AnimalFormModal
          open={editing !== undefined}
          animalId={editing}
          zones={zones.data ?? []}
          categories={categories.data ?? []}
          statuses={statuses.data ?? []}
          languages={languages}
          defaultLang={defaultLang}
          onSaved={handleSaved}
          onClose={() => setEditing(undefined)}
        />
      )}
      <ConfirmModal
        open={Boolean(deleting)}
        title="Xóa động vật"
        message={deleteError ? (
          <>{deleteError}. <Link to={`/admin/pois?animal=${deleting?.id}`}>Mở trang POI</Link></>
        ) : `Xóa "${deleting?.name}" và toàn bộ nội dung của nó? Nếu chỉ muốn tạm không cho khách thấy, hãy dùng nút Ẩn.`}
        confirmLabel="Xóa động vật"
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
