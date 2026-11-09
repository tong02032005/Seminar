/** Phần đầu trang con: tiêu đề + mô tả + vùng hành động tùy chọn */
export default function PageHeader({ title, description, children }) {
  return (
    <header className="page-header">
      <div className="container page-header__inner">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {children && <div className="page-header__actions">{children}</div>}
      </div>
    </header>
  );
}
