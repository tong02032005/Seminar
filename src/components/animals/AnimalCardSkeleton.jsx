import Skeleton from '../common/Skeleton';

export default function AnimalCardSkeleton() {
  return (
    <div className="animal-card animal-card--skeleton" aria-hidden="true">
      <Skeleton height={0} className="animal-card__media skeleton--media" radius={0} />
      <div className="animal-card__body">
        <Skeleton width="70%" height={20} />
        <Skeleton width="50%" height={14} />
        <Skeleton width="35%" height={14} />
      </div>
    </div>
  );
}
