import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import { CATEGORIES, CONSERVATION_STATUS } from '../../constants/catalog';

const EMPTY = {
  name: '', scientificName: '', category: 'mammals', zone: '', description: '', habitat: '',
  diet: '', lifespan: '', size: '', distribution: '', conservationStatus: 'LC', image: '', emoji: '🐾',
};

/** Form thêm/sửa động vật. `animal = null` → chế độ thêm mới */
export default function AnimalFormModal({ open, animal, zones, saving, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(animal ? { ...EMPTY, ...animal } : { ...EMPTY, zone: zones[0]?.id ?? '' });
      setErrors({});
    }
  }, [open, animal, zones]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nhập tên động vật.';
    if (!form.scientificName.trim()) errs.scientificName = 'Nhập tên khoa học.';
    if (!form.zone) errs.zone = 'Chọn khu vực.';
    if (form.description.trim().length < 20) errs.description = 'Mô tả cần ít nhất 20 ký tự.';
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSave(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={animal ? `Sửa: ${animal.name}` : 'Thêm động vật'}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={saving}>Hủy</button>
          <button className="btn btn--primary" form="animal-form" type="submit" disabled={saving}>
            {saving ? 'Đang lưu…' : animal ? 'Lưu thay đổi' : 'Thêm động vật'}
          </button>
        </>
      }
    >
      <form id="animal-form" className="form-grid" onSubmit={submit} noValidate>
        <FormField label="Tên động vật *" id="f-name" value={form.name} onChange={set('name')} error={errors.name} />
        <FormField label="Tên khoa học *" id="f-sci" value={form.scientificName} onChange={set('scientificName')} error={errors.scientificName} />
        <FormField label="Nhóm" id="f-cat">
          <select id="f-cat" value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </FormField>
        <FormField label="Khu vực *" id="f-zone" error={errors.zone}>
          <select id="f-zone" value={form.zone} onChange={set('zone')}>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </FormField>
        <FormField label="Môi trường sống" id="f-habitat" value={form.habitat} onChange={set('habitat')} />
        <FormField label="Thức ăn" id="f-diet" value={form.diet} onChange={set('diet')} />
        <FormField label="Tuổi thọ" id="f-life" value={form.lifespan} onChange={set('lifespan')} />
        <FormField label="Kích thước" id="f-size" value={form.size} onChange={set('size')} />
        <FormField label="Phân bố" id="f-dist" value={form.distribution} onChange={set('distribution')} />
        <FormField label="Tình trạng bảo tồn" id="f-status">
          <select id="f-status" value={form.conservationStatus} onChange={set('conservationStatus')}>
            {Object.entries(CONSERVATION_STATUS).map(([k, v]) => <option key={k} value={k}>{k} – {v.label}</option>)}
          </select>
        </FormField>
        <FormField label="URL hình ảnh" id="f-img" value={form.image} onChange={set('image')} className="span-2" placeholder="https://…" />
        <FormField
          label="Mô tả *" id="f-desc" as="textarea" rows={4} value={form.description} onChange={set('description')}
          error={errors.description} className="span-2"
        />
      </form>
    </Modal>
  );
}
