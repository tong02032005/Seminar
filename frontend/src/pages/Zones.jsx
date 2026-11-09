import PageHeader from '../components/common/PageHeader';
import ZoneCard from '../components/zones/ZoneCard';
import Skeleton from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useLanguage } from '../context/LanguageContext';
import { getZones } from '../services/api';

/** UC02 bước 2 – danh sách khu vực (tên, màu, giờ mở cửa, ảnh) */
export default function Zones() {
  const { lang, t } = useLanguage();
  useDocumentTitle(t('zones'));
  const { data, loading, error, reload } = useAsync(() => getZones(lang), [lang]);

  return (
    <>
      <PageHeader title={t('zones')} description={t('zonesText')} />
      <section className="section section--flush-top">
        <div className="container">
          {error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : (
            <div className="zone-grid zone-grid--page">
              {loading && !data
                ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={260} radius={16} />)
                : data.map((z) => <ZoneCard key={z.id} zone={z} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
