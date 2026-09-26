import AnimalCard from './AnimalCard';
import AnimalCardSkeleton from './AnimalCardSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';

/**
 * Lưới động vật có sẵn 3 trạng thái: loading (skeleton), error, empty.
 */
export default function AnimalList({ animals, loading, error, onRetry, skeletonCount = 6, empty }) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />;

  if (loading && !animals?.length) {
    return (
      <div className="card-grid">
        {Array.from({ length: skeletonCount }, (_, i) => <AnimalCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!animals?.length) {
    return empty ?? <EmptyState icon="🔍" title="Không có động vật phù hợp" message="Thử từ khóa khác hoặc bỏ bớt bộ lọc." />;
  }

  return (
    <div className="card-grid">
      {animals.map((a) => <AnimalCard key={a.id} animal={a} />)}
    </div>
  );
}
