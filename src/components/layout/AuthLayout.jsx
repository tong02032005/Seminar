/** Khung chung cho trang Đăng nhập / Đăng ký */
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-card__art" aria-hidden="true">
          <span>🦒</span>
          <p>Mỗi chuồng một câu chuyện. Khám phá trọn vẹn cùng ZooGuide.</p>
        </div>
        <div className="auth-card__body">
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
