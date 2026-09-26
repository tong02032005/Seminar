import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Map as MapIcon } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import TourCard from '../components/tours/TourCard';
import TourStops from '../components/tours/TourStops';
import ZooMap from '../components/map/ZooMap';
import Skeleton from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getTours, getMapPoints, getZones } from '../services/api';

export default function Tour() {
  useDocumentTitle('Tuyến tham quan');
  const [params, setParams] = useSearchParams();
  const tours = useAsync(getTours, []);
  const points = useAsync(getMapPoints, []);
  const zones = useAsync(getZones, []);
  const [activeId, setActiveId] = useState(params.get('id'));

  useEffect(() => {
    if (!activeId && tours.data?.length) setActiveId(tours.data[0].id);
  }, [tours.data, activeId]);

  const select = (tour) => {
    setActiveId(tour.id);
    setParams({ id: tour.id }, { replace: true });
    if (window.innerWidth < 960) document.getElementById('tour-detail')?.scrollIntoView({ behavior: 'smooth' });
  };

  const active = tours.data?.find((t) => t.id === activeId);

  return (
    <>
      <PageHeader title="Tuyến tham quan" description="Chọn tuyến phù hợp với thời gian và người đi cùng, rồi đi theo thứ tự trên bản đồ." />
      <section className="section section--flush-top">
        <div className="container tour-layout">
          <div className="tour-list">
            {tours.error && <ErrorState error={tours.error} onRetry={tours.reload} />}
            {tours.loading
              ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={170} radius={16} />)
              : tours.data?.map((t) => <TourCard key={t.id} tour={t} active={t.id === activeId} onSelect={select} />)}
          </div>

          <div className="tour-detail" id="tour-detail">
            {active && points.data ? (
              <>
                <h2>{active.emoji} {active.name}</h2>
                <p className="muted">{active.stops.length} điểm dừng · {active.duration} · {active.distance} · Độ khó: {active.difficulty}</p>
                <div className="map-scroll map-scroll--small">
                  <ZooMap points={points.data} zones={zones.data ?? []} route={active.stops} onSelect={() => {}} />
                </div>
                <TourStops stops={active.stops} points={points.data} />
                <Link to={`/map?tour=${active.id}`} className="btn btn--primary btn--block">
                  <MapIcon size={18} /> Bắt đầu với bản đồ
                </Link>
              </>
            ) : (
              <Skeleton height={500} radius={16} />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
