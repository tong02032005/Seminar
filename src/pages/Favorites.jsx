import { useMemo } from 'react';
import PageHeader from '../components/common/PageHeader';
import AnimalList from '../components/animals/AnimalList';
import EmptyState from '../components/common/EmptyState';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getAnimals } from '../services/api';

export default function Favorites() {
  useDocumentTitle('Yêu thích');
  const { favoriteIds, clearFavorites } = useFavorites();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => getAnimals(), []);

  const favorites = useMemo(() => (data ?? []).filter((a) => favoriteIds.includes(a.id)), [data, favoriteIds]);

  const handleClear = () => {
    clearFavorites();
    toast.info('Đã xóa toàn bộ danh sách yêu thích');
  };

  return (
    <>
      <PageHeader title="Động vật yêu thích" description="Danh sách được lưu trên thiết bị này để bạn ghé lại khi tham quan.">
        {favoriteIds.length > 0 && <button className="btn btn--ghost" onClick={handleClear}>Xóa tất cả</button>}
      </PageHeader>
      <section className="section section--flush-top">
        <div className="container">
          <AnimalList
            animals={favorites}
            loading={loading}
            error={error}
            onRetry={reload}
            skeletonCount={Math.max(favoriteIds.length, 3)}
            empty={
              <EmptyState
                icon="🤍"
                title="Chưa có động vật yêu thích"
                message="Nhấn biểu tượng trái tim trên card động vật để lưu lại đây."
                actionLabel="Khám phá động vật"
                actionTo="/animals"
              />
            }
          />
        </div>
      </section>
    </>
  );
}
