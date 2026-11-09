import { useEffect, useState } from 'react';
import FormField from '../../components/common/FormField';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { HOURS_RE } from '../../utils/validators';
import { getSettings, updateSettings, getLanguages, setLanguageActive } from '../../services/api';

const HOTLINE_RE = /^\+?[0-9][0-9 .-]{6,18}[0-9]$/;

/** UC09 – cài đặt chung (tên sở thú, giờ mở cửa, hotline, ngôn ngữ mặc định) và bật/tắt ngôn ngữ */
export default function AdminSettings() {
  useDocumentTitle('Cài đặt');
  const toast = useToast();
  const { reload: reloadSite } = useLanguage();
  const settings = useAsync(getSettings, []);
  const languages = useAsync(() => getLanguages(), []);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (settings.data) setForm(settings.data); }, [settings.data]);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.zoo_name.trim()) errs.zoo_name = 'Nhập tên sở thú.';
    if (form.open_hours && !HOURS_RE.test(form.open_hours)) errs.open_hours = 'Dạng 07h00-17h00.';
    else if (form.open_hours && form.open_hours.split('-')[0] >= form.open_hours.split('-')[1]) errs.open_hours = 'Giờ mở cửa phải trước giờ đóng cửa.';
    if (form.hotline && !HOTLINE_RE.test(form.hotline)) errs.hotline = 'Số điện thoại không hợp lệ.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      settings.setData(await updateSettings({
        zoo_name: form.zoo_name.trim(), open_hours: form.open_hours || null, hotline: form.hotline || null, default_lang: form.default_lang,
      }));
      reloadSite();
      toast.success('Đã lưu cài đặt');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (lang) => {
    try {
      const updated = await setLanguageActive(lang.code, !lang.is_active);
      languages.setData((list) => list.map((l) => (l.code === updated.code ? updated : l)));
      reloadSite();
      toast.success(`${updated.is_active ? 'Đã bật' : 'Đã tắt'} ${updated.name}`);
    } catch (err) {
      toast.error(err.message); // 400: không tắt được ngôn ngữ mặc định
    }
  };

  if (settings.error) return <ErrorState error={settings.error} onRetry={settings.reload} />;
  if (!form) return <Skeleton height={300} />;

  return (
    <div className="stack">
      <form className="panel panel--narrow" onSubmit={save} noValidate>
        <h3>Thông tin chung</h3>
        <FormField label="Tên sở thú *" id="s-name" value={form.zoo_name} onChange={set('zoo_name')} error={errors.zoo_name} />
        <FormField label="Giờ mở cửa" id="s-hours" placeholder="07h00-17h00" value={form.open_hours ?? ''} onChange={set('open_hours')} error={errors.open_hours} />
        <FormField label="Hotline" id="s-hotline" value={form.hotline ?? ''} onChange={set('hotline')} error={errors.hotline} />
        <FormField label="Ngôn ngữ mặc định" id="s-lang" hint="Khách mở web lần đầu sẽ thấy ngôn ngữ này.">
          <select id="s-lang" value={form.default_lang} onChange={set('default_lang')}>
            {languages.data?.filter((l) => l.is_active).map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </FormField>
        <div className="btn-row">
          <button type="button" className="btn btn--ghost" onClick={() => { setForm(settings.data); setErrors({}); }} disabled={saving}>Hủy</button>
          <button className="btn btn--primary" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu cài đặt'}</button>
        </div>
      </form>

      <section className="panel panel--narrow">
        <h3>Ngôn ngữ cho khách</h3>
        <p className="field__hint">Ngôn ngữ đang tắt sẽ không có trong danh sách chọn của khách. Không tắt được ngôn ngữ mặc định.</p>
        {languages.data?.map((l) => (
          <label key={l.code} className="checkbox lang-toggle">
            <input type="checkbox" checked={l.is_active} onChange={() => toggle(l)} disabled={l.code === settings.data?.default_lang} />
            {l.name} ({l.code}){l.code === settings.data?.default_lang && ' – mặc định'}
          </label>
        ))}
      </section>
    </div>
  );
}
