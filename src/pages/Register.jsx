import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import FormField from '../components/common/FormField';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { validateRegister, hasErrors } from '../utils/validators';

export default function Register() {
  useDocumentTitle('Đăng ký');
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateRegister(form);
    setErrors(errs);
    setServerError('');
    if (hasErrors(errs)) return;

    setLoading(true);
    try {
      await register(form);
      toast.success('Đã tạo tài khoản. Chúc bạn tham quan vui vẻ!');
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Tạo tài khoản" subtitle="Miễn phí, chỉ mất một phút.">
      <form onSubmit={submit} noValidate className="auth-form">
        {serverError && <div className="alert alert--error" role="alert">{serverError}</div>}
        <FormField label="Họ và tên" id="fullName" autoComplete="name" value={form.fullName} onChange={set('fullName')} error={errors.fullName} />
        <FormField label="Email" id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <FormField label="Mật khẩu" id="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} hint="Ít nhất 6 ký tự, gồm cả chữ và số." />
        <FormField label="Nhập lại mật khẩu" id="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />
        <button className="btn btn--primary btn--block btn--lg" disabled={loading}>
          {loading ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
        </button>
        <p className="auth-form__switch">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
      </form>
    </AuthLayout>
  );
}
