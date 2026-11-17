import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import PoiFormModal from '../../components/admin/PoiFormModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAsync } from '../../hooks/useAsync';
import { useAdminLanguages } from '../../hooks/useAdminLookups';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getPoisAdmin, getAnimalsAdmin, getZonesAdmin, deletePoi } from '../../services/api';

/** UC08 – quản lý POI (vị trí chuồng) và thuyết minh 3 ngôn ngữ */
export default function AdminPois() {
  useDocumentTitle('POI & thuyết minh');
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { languages, defaultLang, ready } = useAdminLanguages();
  const pois = useAsync(getPoisAdmin, []);
  // ponytail: lấy tối đa 100 động vật cho ô chọn; cần thêm thì đổi sang ô tìm kiếm
  const animals = useAsync(() => getAnimalsAdmin({ size: 100, lang: 'vi' }), []);
  const zones = useAsync(getZonesAdmin, []);
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  // Mở thẳng POI của động vật khi đi từ trang Động vật (?animal=id)
  useEffect(() => {
    const animalId = Number(params.get('animal'));
    const poi = animalId && pois.data?.find((p) => p.animal_id === animalId);
    if (poi) { setEditing(poi.id); setParams({}, { replace: true }); }
  }, [params, pois.data, setParams]);

  const reloadAll = () => { pois.reload(); animals.reload(); };
  const handleSaved = (poi, isNew) => {
    if (isNew) toast.success('Đã thêm POI');
    reloadAll();
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deletePoi(deleting.id);
      toast.success(`Đã xóa POI ${deleting.name}`);
      setDeleting(null);
      reloadAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const langTags = (have) => languages.map((l) => (
    <span key={l.code} className={`tag ${have.includes(l.code) ? 'tag--ok' : ''}`} title={l.name}>{l.code}</span>
  ));
  const zoneName = (id) => zones.data?.find((z) => z.id === id)?.name ?? '';

  const columns = [
    { key: 'name', header: 'POI', render: (p) => <div><strong>{p.icon} {p.name}</strong>{!p.animal_available && <small className="tag tag--off">Động vật đang ẩn</small>}</div> },
    { key: 'zone', header: 'Khu vực', render: (p) => zoneName(p.zone_id) },
    { key: 'coords', header: 'Tọa độ', render: (p) => `${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}` },
    { key: 'narration', header: 'Lời thuyết minh', render: (p) => <span className="tag-row">{langTags(p.narration_langs)}</span> },
    { key: 'audio', header: 'Âm thanh', render: (p) => <span className="tag-row">{langTags(p.audio_langs)}</span> },
    {
      key: 'actions', header: '', className: 'cell-actions',
      render: (p) => (
        <>
          <button className="icon-btn" onClick={() => setEditing(p.id)} aria-label={`Sửa ${p.name}`}><Pencil size={17} /></button>
          <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(p)} aria-label={`Xóa ${p.name}`}><Trash2 size={17} /></button>
        </>
      ),
    },
  ];

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <span className="field__hint">Xanh = đã có. Âm thanh chỉ tạo được sau khi lời thuyết minh đã lưu.</span>
        <button className="btn btn--primary" onClick={() => setEditing(null)} disabled={!ready || !animals.data}><Plus size={18} /> Thêm POI</button>
      </div>
      <DataTable columns={columns} rows={pois.data} loading={pois.loading} error={pois.error} onRetry={pois.reload} />
      {ready && (
        <PoiFormModal
          open={editing !== undefined}
          poiId={editing}
          animals={animals.data?.items ?? []}
          pois={pois.data ?? []}
          zones={zones.data ?? []}
          languages={languages}
          defaultLang={defaultLang}
          onSaved={handleSaved}
          onClose={() => setEditing(undefined)}
        />
      )}
      <ConfirmModal
        open={Boolean(deleting)}
        title="Xóa POI"
        message={`Xóa POI "${deleting?.name}" cùng toàn bộ lời thuyết minh và file âm thanh? Động vật vẫn còn, chỉ mất vị trí trên bản đồ.`}
        confirmLabel="Xóa POI"
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
