import { useEffect, useState } from 'react';
import FormField from '../../components/common/FormField';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getSettings, updateSettings, getHealth } from '../../services/api';
import { API_CONFIG } from '../../services/config';

/** Cài đặt chung – đọc/ghi qua GET/PUT /api/admin/settings */
export default function AdminSettings() {
  useDocumentTitle('Cài đặt');
  const toast = useToast();
  const settings = useAsync(getSettings, []);
  const health = useAsync(getHealth, []);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.data) setForm(settings.data);
  }, [settings.data]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      settings.setData(await updateSettings(form));
      toast.success('Đã lưu cài đặt');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack-lg">
      {settings.error ? (
        <ErrorState error={settings.error} onRetry={settings.reload} />
      ) : !form ? (
        <Skeleton height={320} radius={14} />
      ) : (
        <form className="panel" onSubmit={save}>
          <h3>Thông tin sở thú</h3>
          <div className="form-grid">
            <FormField label="Tên hiển thị" id="s-name" value={form.zooName} onChange={set('zooName')} />
            <FormField label="Giờ mở cửa" id="s-hours" value={form.openHours} onChange={set('openHours')} />
            <FormField label="Hotline" id="s-hotline" value={form.hotline} onChange={set('hotline')} />
            <FormField label="Ngôn ngữ mặc định" id="s-lang">
              <select id="s-lang" value={form.defaultLang} onChange={set('defaultLang')}>
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </FormField>
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={form.autoApprove} onChange={set('autoApprove')} /> Tự động duyệt đánh giá 4–5 sao
          </label>
          <button className="btn btn--primary" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu cài đặt'}</button>
        </form>
      )}

      <section className="panel">
        <h3>Kết nối API</h3>
        <dl className="kv">
          <div><dt>Địa chỉ API</dt><dd><code>{API_CONFIG.BASE_URL}</code></dd></div>
          <div>
            <dt>Trạng thái</dt>
            <dd>{health.loading ? 'Đang kiểm tra…' : health.error ? 'Không kết nối được' : 'Hoạt động'}</dd>
          </div>
        </dl>
        <p className="muted">Đổi địa chỉ trong file <code>.env</code>: <code>VITE_API_BASE_URL=http://localhost:8000</code>.</p>
      </section>
    </div>
  );
}
