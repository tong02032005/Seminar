import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import LangTabs from './LangTabs';
import { mediaUrl } from '../../services/config';
import { COLOR_RE, HOURS_RE } from '../../utils/validators';
import { createZone, getZoneAdmin, updateZone, uploadZoneImage } from '../../services/api';

const EMPTY = { color: '#4E8B5F', open_hours: '', area_m2: '', image: null };

/** UC07 – thêm/sửa khu vực: thông tin chung + tên, mô tả theo từng ngôn ngữ */
export default function ZoneFormModal({ open, zoneId, languages, defaultLang, onSaved, onClose }) {
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
    const blank = Object.fromEntries(languages.map((l) => [l.code, { name: '', description: '' }]));
    if (!zoneId) { setForm(EMPTY); setContents(blank); return; }
    setLoading(true);
    getZoneAdmin(zoneId)
      .then((z) => {
        setForm({ color: z.color ?? '#4E8B5F', open_hours: z.open_hours ?? '', area_m2: z.area_m2 ?? '', image: z.image });
        for (const c of z.contents) blank[c.lang] = { name: c.name, description: c.description ?? '' };
        setContents(blank);
      })
      .catch((err) => setFormError(err.message))
      .finally(() => setLoading(false));
  }, [open, zoneId, languages, defaultLang]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setText = (key) => (e) => setContents((c) => ({ ...c, [tab]: { ...c[tab], [key]: e.target.value } }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!COLOR_RE.test(form.color)) errs.color = 'Màu dạng #RRGGBB.';
    if (form.open_hours && !HOURS_RE.test(form.open_hours)) errs.open_hours = 'Dạng 07h00-17h00.';
    if (form.area_m2 !== '' && !(Number(form.area_m2) > 0)) errs.area_m2 = 'Diện tích phải lớn hơn 0.';
    if (!contents[defaultLang]?.name.trim()) { errs.name = 'Nhập tên khu vực bằng ngôn ngữ mặc định.'; setTab(defaultLang); }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const body = {
      color: form.color,
      open_hours: form.open_hours || null,
      area_m2: form.area_m2 === '' ? null : Number(form.area_m2),
      contents: Object.entries(contents)
        .filter(([, c]) => c.name.trim())
        .map(([lang, c]) => ({ lang, name: c.name.trim(), description: c.description.trim() || null })),
    };
    setSaving(true); setFormError('');
    try {
      let saved = zoneId ? await updateZone(zoneId, body) : await createZone(body);
      if (file) saved = await uploadZoneImage(saved.id, file);
      onSaved(saved, !zoneId);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const current = contents[tab] ?? { name: '', description: '' };
  const marks = Object.fromEntries(languages.map((l) => [l.code, contents[l.code]?.name.trim() ? ' ✓' : '']));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={zoneId ? 'Sửa khu vực' : 'Thêm khu vực'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={saving}>Hủy</button>
          <button className="btn btn--primary" type="submit" form="zone-form" disabled={saving || loading}>{saving ? 'Đang lưu…' : 'Lưu'}</button>
        </>
      }
    >
      {loading ? <p>Đang tải…</p> : (
        <form id="zone-form" className="form-grid" onSubmit={submit} noValidate>
          {formError && <p className="form-error span-2" role="alert">{formError}</p>}
          <FormField label="Màu trên bản đồ" id="z-color" type="color" value={form.color} onChange={set('color')} error={errors.color} />
          <FormField label="Giờ mở cửa" id="z-hours" placeholder="07h00-17h00" value={form.open_hours} onChange={set('open_hours')} error={errors.open_hours} />
          <FormField label="Diện tích (m²)" id="z-area" type="number" min="0" value={form.area_m2} onChange={set('area_m2')} error={errors.area_m2} />
          <FormField label="Ảnh (tối đa 2 MB)" id="z-img" hint={form.image ? 'Đã có ảnh – chọn file mới để thay.' : 'Chưa có ảnh.'}>
            <input id="z-img" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setFile(e.target.files[0] ?? null)} />
          </FormField>
          {form.image && !file && <img className="form-thumb" src={mediaUrl(form.image)} alt="Ảnh hiện tại" />}
          <div className="span-2">
            <LangTabs languages={languages} active={tab} onChange={setTab} defaultLang={defaultLang} marks={marks} />
          </div>
          <FormField label={`Tên khu vực${tab === defaultLang ? ' *' : ''}`} id="z-name" className="span-2" value={current.name} onChange={setText('name')} error={tab === defaultLang ? errors.name : undefined} />
          <FormField label="Mô tả" id="z-desc" as="textarea" rows={4} className="span-2" value={current.description} onChange={setText('description')} />
        </form>
      )}
    </Modal>
  );
}
