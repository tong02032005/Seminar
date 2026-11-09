import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import LangTabs from './LangTabs';
import { mediaUrl } from '../../services/config';
import { createAnimal, getAnimalAdmin, updateAnimal, uploadAnimalImage } from '../../services/api';

/** 9 mục mô tả của ANIMAL_TRANSLATION */
export const DESCRIPTION_FIELDS = [
  ['appearance', 'Đặc điểm hình thái'],
  ['distribution', 'Phân bố'],
  ['ecology', 'Sinh thái'],
  ['behaviour', 'Tập tính'],
  ['diet', 'Thức ăn'],
  ['reproduction', 'Sinh sản'],
  ['lifespan', 'Tuổi thọ'],
  ['ecological_role', 'Vai trò sinh thái'],
  ['threat', 'Mối đe dọa'],
];
const TEXT_KEYS = ['name', ...DESCRIPTION_FIELDS.map(([k]) => k)];
const EMPTY = { scientific_name: '', zone_id: '', category_id: '', conservation_status_code: '', popularity: 0, available: true, image: null };
const emptyContent = () => Object.fromEntries(TEXT_KEYS.map((k) => [k, '']));

/**
 * UC04 – thêm/sửa động vật. animalId = null: thêm mới.
 * Thông tin chung + nội dung theo từng ngôn ngữ (bắt buộc ngôn ngữ mặc định, ngôn ngữ khác có thể để trống).
 */
export default function AnimalFormModal({ open, animalId, zones, categories, statuses, languages, defaultLang, onSaved, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [contents, setContents] = useState({});
  const [tab, setTab] = useState(defaultLang);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) return;
    setErrors({}); setFormError(''); setFile(null); setTab(defaultLang);
    const blank = Object.fromEntries(languages.map((l) => [l.code, emptyContent()]));
    if (!animalId) { setForm(EMPTY); setContents(blank); return; }
    setLoading(true);
    getAnimalAdmin(animalId)
      .then((a) => {
        setForm({ ...EMPTY, ...a });
        for (const tr of a.translations) blank[tr.lang] = Object.fromEntries(TEXT_KEYS.map((k) => [k, tr[k] ?? '']));
        setContents(blank);
      })
      .catch((err) => setFormError(err.message))
      .finally(() => setLoading(false));
  }, [open, animalId, languages, defaultLang]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setText = (key) => (e) => setContents((c) => ({ ...c, [tab]: { ...c[tab], [key]: e.target.value } }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.scientific_name.trim()) errs.scientific_name = 'Nhập tên khoa học.';
    if (!form.zone_id) errs.zone_id = 'Chọn khu vực.';
    if (!form.category_id) errs.category_id = 'Chọn nhóm.';
    if (!form.conservation_status_code) errs.conservation_status_code = 'Chọn mức bảo tồn.';
    if (!contents[defaultLang]?.name.trim()) {
      errs.name = 'Nhập tên động vật bằng ngôn ngữ mặc định.';
      setTab(defaultLang);
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // Chỉ gửi ngôn ngữ đã nhập tên; ô trống gửi null
    const translations = Object.entries(contents)
      .filter(([, c]) => c.name.trim())
      .map(([lang, c]) => ({ lang, ...Object.fromEntries(TEXT_KEYS.map((k) => [k, c[k].trim() || null])) }));
    const body = {
      scientific_name: form.scientific_name.trim(),
      zone_id: Number(form.zone_id),
      category_id: Number(form.category_id),
      conservation_status_code: form.conservation_status_code,
      popularity: Number(form.popularity) || 0,
      available: form.available,
      translations,
    };
    setSaving(true); setFormError('');
    try {
      let saved = animalId ? await updateAnimal(animalId, body) : await createAnimal(body);
      if (file) saved = await uploadAnimalImage(saved.id, file);
      onSaved(saved, !animalId);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const current = contents[tab] ?? emptyContent();
  const marks = Object.fromEntries(languages.map((l) => [l.code, contents[l.code]?.name.trim() ? ' ✓' : '']));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={animalId ? 'Sửa động vật' : 'Thêm động vật'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={saving}>Hủy</button>
          <button className="btn btn--primary" type="submit" form="animal-form" disabled={saving || loading}>
            {saving ? 'Đang lưu…' : 'Lưu'}
          </button>
        </>
      }
    >
      {loading ? <p>Đang tải…</p> : (
        <form id="animal-form" className="form-grid" onSubmit={submit} noValidate>
          {formError && <p className="form-error span-2" role="alert">{formError}</p>}
          <FormField label="Tên khoa học *" id="a-sci" value={form.scientific_name} onChange={set('scientific_name')} error={errors.scientific_name} />
          <FormField label="Khu vực *" id="a-zone" error={errors.zone_id}>
            <select id="a-zone" value={form.zone_id} onChange={set('zone_id')}>
              <option value="">— Chọn khu vực —</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </FormField>
          <FormField label="Nhóm *" id="a-cat" error={errors.category_id}>
            <select id="a-cat" value={form.category_id} onChange={set('category_id')}>
              <option value="">— Chọn nhóm —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Mức bảo tồn (IUCN) *" id="a-status" error={errors.conservation_status_code}>
            <select id="a-status" value={form.conservation_status_code} onChange={set('conservation_status_code')}>
              <option value="">— Chọn mức bảo tồn —</option>
              {statuses.map((s) => <option key={s.code} value={s.code}>{s.code} · {s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Độ phổ biến" id="a-pop" type="number" min="0" value={form.popularity} onChange={set('popularity')} />
          <FormField label="Ảnh (JPEG/PNG/WEBP/GIF, tối đa 2 MB)" id="a-img" hint={form.image ? 'Đã có ảnh – chọn file mới để thay.' : 'Chưa có ảnh.'}>
            <input id="a-img" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setFile(e.target.files[0] ?? null)} />
          </FormField>
          {form.image && !file && <img className="form-thumb" src={mediaUrl(form.image)} alt="Ảnh hiện tại" />}
          <label className="checkbox span-2">
            <input type="checkbox" checked={form.available} onChange={set('available')} /> Hiển thị cho khách (bỏ chọn để ẩn)
          </label>

          <div className="span-2">
            <LangTabs languages={languages} active={tab} onChange={setTab} defaultLang={defaultLang} marks={marks} />
          </div>
          <FormField
            label={`Tên động vật${tab === defaultLang ? ' *' : ''}`} id="a-name" className="span-2"
            value={current.name} onChange={setText('name')} error={tab === defaultLang ? errors.name : undefined}
            hint={tab !== defaultLang ? 'Để trống nếu chưa có bản dịch – khách sẽ thấy nội dung ngôn ngữ mặc định.' : undefined}
          />
          {DESCRIPTION_FIELDS.map(([key, label]) => (
            <FormField key={key} label={label} id={`a-${key}`} as="textarea" rows={2} className="span-2" value={current[key]} onChange={setText(key)} />
          ))}
        </form>
      )}
    </Modal>
  );
}
