import AnimalCard from './AnimalCard';
import AnimalCardSkeleton from './AnimalCardSkeleton';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import { useLanguage } from '../../context/LanguageContext';

/** Lưới động vật có sẵn 3 trạng thái: loading (skeleton), error (nút Thử lại), empty. */
export default function AnimalList({ animals, loading, error, onRetry, skeletonCount = 6, empty }) {
  const { t } = useLanguage();
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (loading && !animals?.length) {
    return (
      <div className="card-grid">
        {Array.from({ length: skeletonCount }, (_, i) => <AnimalCardSkeleton key={i} />)}
      </div>
    );
  }
  if (!animals?.length) return empty ?? <EmptyState icon="🔍" title={t('notFoundAnimals')} message={t('tryOther')} />;
  return (
    <div className="card-grid">
      {animals.map((a) => <AnimalCard key={a.id} animal={a} />)}
    </div>
  );
}
