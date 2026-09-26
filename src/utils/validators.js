// Validation phía frontend. Backend vẫn phải kiểm tra lại.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Nhập email của bạn.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Email chưa đúng định dạng, ví dụ: ten@gmail.com.';
  if (!password) errors.password = 'Nhập mật khẩu.';
  return errors;
}

export function validateRegister({ fullName, email, password, confirmPassword }) {
  const errors = {};
  if (fullName.trim().length < 2) errors.fullName = 'Họ tên cần ít nhất 2 ký tự.';
  if (!EMAIL_RE.test(email)) errors.email = 'Email chưa đúng định dạng, ví dụ: ten@gmail.com.';
  if (password.length < 6) errors.password = 'Mật khẩu cần ít nhất 6 ký tự.';
  else if (!/\d/.test(password) || !/[a-zA-Z]/.test(password))
    errors.password = 'Mật khẩu cần có cả chữ và số.';
  if (confirmPassword !== password) errors.confirmPassword = 'Mật khẩu nhập lại không khớp.';
  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
