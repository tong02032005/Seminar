import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import AnimalFilters from '../components/animals/AnimalFilters';
import AnimalList from '../components/animals/AnimalList';
import EmptyState from '../components/common/EmptyState';
import { useAsync } from '../hooks/useAsync';
import { useDebounce } from '../hooks/useDebounce';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useLanguage } from '../context/LanguageContext';
import { getAnimals, getCategories, getZones } from '../services/api';

const PAGE_SIZE = 12;

/** UC01 – danh sách động vật: tìm theo tên, lọc theo nhóm và khu vực, phân trang (phía server).
 * Bộ lọc đồng bộ lên URL (?q=&category=&zone=&sort=&page=) để chia sẻ link. */
export default function Animals() {
  const { lang, t } = useLanguage();
  useDocumentTitle(t('animals'));
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? '',
    zone: searchParams.get('zone') ?? '',
    sort: searchParams.get('sort') ?? 'popular',
  });
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const debouncedSearch = useDebounce(filters.search);

  // Tìm từ Header khi đang ở trang này: chỉ áp dụng nếu q trên URL khác giá trị trang vừa ghi
  const lastWrittenQ = useRef(filters.search);
  const urlQ = searchParams.get('q') ?? '';
  useEffect(() => {
    if (urlQ !== lastWrittenQ.current) {
      lastWrittenQ.current = urlQ;
      setFilters((f) => ({ ...f, search: urlQ }));
    }
  }, [urlQ]);

  const query = useMemo(
    () => ({ q: debouncedSearch, category_id: filters.category, zone_id: filters.zone, sort: filters.sort }),
    [debouncedSearch, filters.category, filters.zone, filters.sort]
  );

  // Đổi bộ lọc → về trang 1
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setPage(1);
  }, [query]);

  const animals = useAsync(() => getAnimals({ ...query, page, size: PAGE_SIZE, lang }), [query, page, lang]);
  const zones = useAsync(() => getZones(lang), [lang]);
  const categories = useAsync(() => getCategories(lang), [lang]);

  useEffect(() => {
    const params = {};
    if (query.q) params.q = query.q;
    lastWrittenQ.current = query.q;
    if (query.category_id) params.category = query.category_id;
    if (query.zone_id) params.zone = query.zone_id;
    if (query.sort !== 'popular') params.sort = query.sort;
    if (page > 1) params.page = page;
    setSearchParams(params, { replace: true });
  }, [query, page, setSearchParams]);

  const resetFilters = () => setFilters({ search: '', category: '', zone: '', sort: 'popular' });
  const data = animals.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHeader title={t('animals')} />
      <section className="section section--flush-top">
        <div className="container">
          <AnimalFilters
            filters={filters}
            categories={categories.data ?? []}
            zones={zones.data ?? []}
            onChange={setFilters}
            onReset={resetFilters}
          />
          {data && !animals.error && <p className="result-count" aria-live="polite">{data.total} {t('species')}</p>}
          <AnimalList
            animals={data?.items}
            loading={animals.loading}
            error={animals.error}
            onRetry={animals.reload}
            skeletonCount={8}
            empty={<EmptyState icon="🔍" title={t('notFoundAnimals')} message={t('tryOther')} actionLabel={t('clearFilters')} onAction={resetFilters} />}
          />
          {pages > 1 && (
            <nav className="pager" aria-label={t('page')}>
              <button className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={16} /> {t('prev')}
              </button>
              <span>{page} / {pages}</span>
              <button className="btn btn--outline btn--sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                {t('next')} <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
