import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import AnimalFilters from '../components/animals/AnimalFilters';
import AnimalList from '../components/animals/AnimalList';
import EmptyState from '../components/common/EmptyState';
import { useAsync } from '../hooks/useAsync';
import { useDebounce } from '../hooks/useDebounce';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getAnimals, getZones } from '../services/api';

const PAGE_SIZE = 8;

/**
 * Danh sách động vật (file AnimalList theo đề bài).
 * Bộ lọc được đồng bộ lên URL (?q=&category=&zone=&sort=) để chia sẻ link và giữ trạng thái khi quay lại.
 */
export default function Animals() {
  useDocumentTitle('Động vật');
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? '',
    zone: searchParams.get('zone') ?? '',
    sort: searchParams.get('sort') ?? 'popular',
  });
  const [visible, setVisible] = useState(PAGE_SIZE);
  const debouncedSearch = useDebounce(filters.search);

  // Khi tìm kiếm từ Header lúc đang ở trang này: chỉ áp dụng nếu q trên URL
  // khác với giá trị chính trang này vừa ghi lên (tránh ghi đè khi đang gõ)
  const lastWrittenQ = useRef(filters.search);
  const urlQ = searchParams.get('q') ?? '';
  useEffect(() => {
    if (urlQ !== lastWrittenQ.current) {
      lastWrittenQ.current = urlQ;
      setFilters((f) => ({ ...f, search: urlQ }));
    }
  }, [urlQ]);

  const query = useMemo(
    () => ({ search: debouncedSearch, category: filters.category, zone: filters.zone, sort: filters.sort }),
    [debouncedSearch, filters.category, filters.zone, filters.sort]
  );

  const animals = useAsync(() => getAnimals(query), [query]);
  const zones = useAsync(getZones, []);

  // Đồng bộ URL + reset phân trang khi bộ lọc đổi
  useEffect(() => {
    const params = {};
    if (query.search) params.q = query.search;
    lastWrittenQ.current = query.search;
    if (query.category) params.category = query.category;
    if (query.zone) params.zone = query.zone;
    if (query.sort !== 'popular') params.sort = query.sort;
    setSearchParams(params, { replace: true });
    setVisible(PAGE_SIZE);
  }, [query, setSearchParams]);

  const resetFilters = () => setFilters({ search: '', category: '', zone: '', sort: 'popular' });
  const list = animals.data ?? [];

  return (
    <>
      <PageHeader title="Động vật" description="Tìm loài bạn muốn gặp, lọc theo nhóm hoặc khu vực." />
      <section className="section section--flush-top">
        <div className="container">
          <AnimalFilters filters={filters} zones={zones.data ?? []} onChange={setFilters} onReset={resetFilters} />

          {!animals.loading && !animals.error && (
            <p className="result-count" aria-live="polite">{list.length} loài</p>
          )}

          <AnimalList
            animals={list.slice(0, visible)}
            loading={animals.loading}
            error={animals.error}
            onRetry={animals.reload}
            skeletonCount={8}
            empty={
              <EmptyState
                icon="🔍"
                title="Không có loài nào khớp bộ lọc"
                message="Thử tìm bằng tên khoa học, hoặc xóa bộ lọc để xem toàn bộ."
                actionLabel="Xóa bộ lọc"
                onAction={resetFilters}
              />
            }
          />

          {visible < list.length && (
            <div className="load-more">
              <button className="btn btn--outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Xem thêm {Math.min(PAGE_SIZE, list.length - visible)} loài
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
