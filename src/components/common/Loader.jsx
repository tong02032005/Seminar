export default function Loader({ label = 'Đang tải…', fullPage = false }) {
  return (
    <div className={`loader ${fullPage ? 'loader--page' : ''}`} role="status">
      <span className="loader__paw" aria-hidden="true">🐾</span>
      <span>{label}</span>
    </div>
  );
}
