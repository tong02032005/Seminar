import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormField from '../../components/common/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { changePassword } from '../../services/api';
import { hasErrors, validatePassword } from '../../utils/validators';

const EMPTY = { old_password: '', new_password: '', confirm_password: '' };

/** UC05 A1 – đổi mật khẩu; xong thì token cũ bị từ chối nên phải đăng nhập lại */
export default function ChangePassword() {
  useDocumentTitle('Đổi mật khẩu');
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = validatePassword(form);
    setErrors(errs);
    if (hasErrors(errs)) return;
    setSaving(true);
    try {
      await changePassword(form);
      toast.success('Đã đổi mật khẩu. Hãy đăng nhập lại bằng mật khẩu mới.');
      logout();
      navigate('/admin/login', { replace: true });
    } catch (err) {
      if (err.status === 400) setErrors({ old_password: err.message }); // E3: sai mật khẩu cũ
      else toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="panel panel--narrow" onSubmit={submit} noValidate>
      <h3>Đổi mật khẩu</h3>
      <FormField label="Mật khẩu cũ" id="p-old" type="password" autoComplete="current-password" value={form.old_password} onChange={set('old_password')} error={errors.old_password} />
      <FormField label="Mật khẩu mới (ít nhất 8 ký tự)" id="p-new" type="password" autoComplete="new-password" value={form.new_password} onChange={set('new_password')} error={errors.new_password} />
      <FormField label="Nhập lại mật khẩu mới" id="p-confirm" type="password" autoComplete="new-password" value={form.confirm_password} onChange={set('confirm_password')} error={errors.confirm_password} />
      <button className="btn btn--primary" disabled={saving}>{saving ? 'Đang lưu…' : 'Đổi mật khẩu'}</button>
    </form>
  );
}
