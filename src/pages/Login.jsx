import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';
import FormField from '../components/common/FormField';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { validateLogin, hasErrors } from '../utils/validators';

export default function Login() {
  useDocumentTitle('Đăng nhập');
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateLogin(form);
    setErrors(errs);
    setServerError('');
    if (hasErrors(errs)) return;

    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Chào mừng ${user.fullName} quay lại!`);
      const fallback = user.role === 'admin' ? '/admin' : '/';
      navigate(location.state?.from || fallback, { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Đăng nhập" subtitle="Lưu động vật yêu thích và gửi đánh giá sau chuyến tham quan.">
      <form onSubmit={submit} noValidate className="auth-form">
        {serverError && <div className="alert alert--error" role="alert">{serverError}</div>}

        <FormField label="Email" id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />

        <FormField label="Mật khẩu" id="password" error={errors.password}>
          <div className="password-input">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={set('password')}
              aria-invalid={Boolean(errors.password)}
            />
            <button type="button" className="icon-btn" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </FormField>

        <div className="auth-form__row">
          <label className="checkbox">
            <input type="checkbox" checked={form.remember} onChange={set('remember')} /> Ghi nhớ đăng nhập
          </label>
          <button type="button" className="text-link" onClick={() => toast.info('Chức năng đặt lại mật khẩu sẽ gửi email khi kết nối máy chủ.')}>
            Quên mật khẩu?
          </button>
        </div>

        <button className="btn btn--primary btn--block btn--lg" disabled={loading}>
          {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>

        <p className="auth-form__switch">Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>

        <div className="demo-accounts">
          <p>Tài khoản dùng thử:</p>
          <button type="button" onClick={() => setForm({ ...form, email: 'user@zooguide.vn', password: 'user123' })}>Khách: user@zooguide.vn / user123</button>
          <button type="button" onClick={() => setForm({ ...form, email: 'admin@zooguide.vn', password: 'admin123' })}>Admin: admin@zooguide.vn / admin123</button>
        </div>
      </form>
    </AuthLayout>
  );
}
