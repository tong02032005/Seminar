import PageHeader from '../components/common/PageHeader';
import ZoneCard from '../components/zones/ZoneCard';
import Skeleton from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getZones } from '../services/api';

export default function Zones() {
  useDocumentTitle('Khu vực');
  const { data, loading, error, reload } = useAsync(getZones, []);

  return (
    <>
      <PageHeader title="Khu vực trong sở thú" description="Mỗi khu mô phỏng một môi trường sống. Chọn khu để xem các loài đang ở đó." />
      <section className="section section--flush-top">
        <div className="container">
          {error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : (
            <div className="zone-grid zone-grid--page">
              {loading
                ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={260} radius={16} />)
                : data.map((z) => <ZoneCard key={z.id} zone={z} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
