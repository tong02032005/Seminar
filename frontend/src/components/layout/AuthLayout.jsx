/** Khung trang đăng nhập quản trị */
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-card__art" aria-hidden="true">
          <span>🦒</span>
          <p>Trang quản trị ZooGuide – chỉ dành cho ban quản lý.</p>
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
