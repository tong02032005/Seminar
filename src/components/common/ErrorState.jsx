export default function ErrorState({ error, onRetry }) {
  const notFound = error?.status === 404;
  return (
    <div className="state-box state-box--error" role="alert">
      <span className="state-box__icon" aria-hidden="true">{notFound ? '🔎' : '⚠️'}</span>
      <h3>{notFound ? 'Không tìm thấy nội dung' : 'Không tải được dữ liệu'}</h3>
      <p>{error?.message || 'Đã có lỗi xảy ra.'}</p>
      {onRetry && !notFound && (
        <button className="btn btn--outline" onClick={onRetry}>Thử lại</button>
      )}
    </div>
  );
}
