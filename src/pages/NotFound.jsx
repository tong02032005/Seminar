import EmptyState from '../components/common/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Không tìm thấy trang');
  return (
    <section className="section">
      <div className="container">
        <EmptyState
          icon="🧭"
          title="Trang này không tồn tại"
          message="Đường dẫn có thể đã sai hoặc trang đã được chuyển. Quay về trang chủ để tiếp tục tham quan."
          actionLabel="Về trang chủ"
          actionTo="/"
        />
      </div>
    </section>
  );
}
