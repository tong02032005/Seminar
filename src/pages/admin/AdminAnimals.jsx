import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import AnimalFormModal from '../../components/admin/AnimalFormModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import ConservationBadge from '../../components/common/ConservationBadge';
import ImageWithFallback from '../../components/common/ImageWithFallback';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getAnimals, getZones, createAnimal, updateAnimal, deleteAnimal } from '../../services/api';
import { CATEGORIES, getCategoryLabel } from '../../constants/catalog';

export default function AdminAnimals() {
  useDocumentTitle('Quản lý động vật');
  const toast = useToast();
  const animals = useAsync(() => getAnimals({ sort: 'name-asc' }), []);
  const zones = useAsync(getZones, []);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState(undefined); // undefined = đóng, null = thêm mới, object = sửa
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return (animals.data ?? []).filter(
      (a) => (!category || a.category === category) && (a.name.toLowerCase().includes(q) || a.scientificName.toLowerCase().includes(q))
    );
  }, [animals.data, search, category]);

  const zoneName = (id) => zones.data?.find((z) => z.id === id)?.shortName ?? id;

  const handleSave = async (form) => {
    setBusy(true);
    try {
      if (editing) {
        const updated = await updateAnimal(editing.id, form);
        animals.setData((list) => list.map((a) => (a.id === updated.id ? updated : a)));
        toast.success(`Đã lưu thay đổi cho ${updated.name}`);
      } else {
        const created = await createAnimal(form);
        animals.setData((list) => [...list, created]);
        toast.success(`Đã thêm ${created.name}`);
      }
      setEditing(undefined);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteAnimal(deleting.id);
      animals.setData((list) => list.filter((a) => a.id !== deleting.id));
      toast.success(`Đã xóa ${deleting.name}`);
      setDeleting(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'name', header: 'Động vật',
      render: (a) => (
        <div className="cell-media">
          <ImageWithFallback src={a.image} alt="" fallbackEmoji={a.emoji} />
          <div><strong>{a.name}</strong><small className="scientific">{a.scientificName}</small></div>
        </div>
      ),
    },
    { key: 'category', header: 'Nhóm', render: (a) => getCategoryLabel(a.category) },
    { key: 'zone', header: 'Khu vực', render: (a) => zoneName(a.zone) },
    { key: 'status', header: 'Bảo tồn', render: (a) => <ConservationBadge status={a.conservationStatus} /> },
    { key: 'qrCode', header: 'Mã QR' },
    {
      key: 'actions', header: '', className: 'cell-actions',
      render: (a) => (
        <>
          <button className="icon-btn" onClick={() => setEditing(a)} aria-label={`Sửa ${a.name}`}><Pencil size={17} /></button>
          <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(a)} aria-label={`Xóa ${a.name}`}><Trash2 size={17} /></button>
        </>
      ),
    },
  ];

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <div className="search-input search-input--sm">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên động vật…" aria-label="Tìm động vật" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Lọc theo nhóm">
          <option value="">Tất cả nhóm</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button className="btn btn--primary" onClick={() => setEditing(null)}><Plus size={18} /> Thêm động vật</button>
      </div>

      <DataTable columns={columns} rows={rows} loading={animals.loading} error={animals.error} onRetry={animals.reload} />

      <AnimalFormModal
        open={editing !== undefined}
        animal={editing}
        zones={zones.data ?? []}
        saving={busy}
        onSave={handleSave}
        onClose={() => setEditing(undefined)}
      />
      <ConfirmModal
        open={Boolean(deleting)}
        title="Xóa động vật"
        message={`Xóa "${deleting?.name}" khỏi hệ thống? Nội dung thuyết minh và đánh giá liên quan cũng không còn hiển thị.`}
        confirmLabel="Xóa động vật"
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
