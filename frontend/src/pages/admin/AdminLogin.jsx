import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import FormField from '../../components/common/FormField';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { validateLogin, hasErrors } from '../../utils/validators';

/** UC05 – đăng nhập quản trị. Không có đăng ký, không có quên mật khẩu. */
export default function AdminLogin() {
  useDocumentTitle('Đăng nhập quản trị');
  const { admin, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (admin) return <Navigate to="/admin" replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateLogin(form);
    setErrors(errs);
    setServerError('');
    if (hasErrors(errs)) return;
    setLoading(true);
    try {
      const me = await login(form);
      toast.success(`Xin chào ${me.full_name}`);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setServerError(err.message); // E1: "Email hoặc mật khẩu không đúng"
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Đăng nhập quản trị" subtitle="Dùng tài khoản admin được cấp sẵn.">
      <form onSubmit={submit} noValidate className="auth-form">
        {serverError && <div className="alert alert--error" role="alert">{serverError}</div>}
        <FormField label="Email" id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <FormField label="Mật khẩu" id="password" error={errors.password}>
          <div className="password-input">
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
              value={form.password} onChange={set('password')} aria-invalid={Boolean(errors.password)} />
            <button type="button" className="icon-btn" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </FormField>
        <button className="btn btn--primary btn--block btn--lg" disabled={loading}>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
        <p className="auth-form__switch"><Link to="/">← Về trang khách</Link></p>
      </form>
    </AuthLayout>
  );
}
