/** Ô nhập liệu có nhãn và thông báo lỗi – dùng cho form đăng nhập/đăng ký/admin */
export default function FormField({ label, id, error, hint, as = 'input', className = '', children, ...inputProps }) {
  const Tag = as;
  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      {children ?? (
        <Tag id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...inputProps} />
      )}
      {error ? (
        <small id={`${id}-error`} className="field__error">{error}</small>
      ) : (
        hint && <small className="field__hint">{hint}</small>
      )}
    </div>
  );
}
