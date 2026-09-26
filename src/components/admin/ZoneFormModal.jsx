import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import FormField from '../common/FormField';

const EMPTY = { id: '', name: '', shortName: '', emoji: '🌿', color: '#4E8B5F', description: '', openHours: '7:30 – 17:30', area: '', image: '' };

export default function ZoneFormModal({ open, zone, saving, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) { setForm(zone ? { ...EMPTY, ...zone } : EMPTY); setErrors({}); }
  }, [open, zone]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!zone && !/^[a-z0-9-]{2,}$/.test(form.id)) errs.id = 'Mã chỉ gồm chữ thường, số, dấu gạch ngang.';
    if (!form.name.trim()) errs.name = 'Nhập tên khu vực.';
    setErrors(errs);
    if (!Object.keys(errs).length) onSave({ ...form, shortName: form.shortName || form.name });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={zone ? `Sửa: ${zone.name}` : 'Thêm khu vực'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={saving}>Hủy</button>
          <button className="btn btn--primary" type="submit" form="zone-form" disabled={saving}>
            {saving ? 'Đang lưu…' : zone ? 'Lưu thay đổi' : 'Thêm khu vực'}
          </button>
        </>
      }
    >
      <form id="zone-form" className="form-grid" onSubmit={submit} noValidate>
        <FormField label="Mã khu vực *" id="z-id" value={form.id} onChange={set('id')} disabled={Boolean(zone)} error={errors.id} hint="Ví dụ: south-america" />
        <FormField label="Tên khu vực *" id="z-name" value={form.name} onChange={set('name')} error={errors.name} />
        <FormField label="Giờ mở cửa" id="z-hours" value={form.openHours} onChange={set('openHours')} />
        <FormField label="Diện tích" id="z-area" value={form.area} onChange={set('area')} />
        <FormField label="Biểu tượng" id="z-emoji" value={form.emoji} onChange={set('emoji')} />
        <FormField label="Màu trên bản đồ" id="z-color" type="color" value={form.color} onChange={set('color')} />
        <FormField label="Mô tả" id="z-desc" as="textarea" rows={3} value={form.description} onChange={set('description')} className="span-2" />
      </form>
    </Modal>
  );
}
