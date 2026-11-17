// Validation phía frontend cho form admin. Backend vẫn kiểm tra lại (Pydantic + CHECK trong CSDL).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
export const HOURS_RE = /^([01]\d|2[0-3])h[0-5]\d-([01]\d|2[0-3])h[0-5]\d$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Nhập email.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Email chưa đúng định dạng, ví dụ: admin@zooguide.vn.';
  if (!password) errors.password = 'Nhập mật khẩu.';
  return errors;
}

export function validatePassword({ old_password, new_password, confirm_password }) {
  const errors = {};
  if (!old_password) errors.old_password = 'Nhập mật khẩu cũ.';
  if (new_password.length < 8) errors.new_password = 'Mật khẩu mới cần ít nhất 8 ký tự.';
  if (confirm_password !== new_password) errors.confirm_password = 'Mật khẩu xác nhận không khớp.';
  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
