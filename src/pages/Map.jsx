import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import ZooMap from '../components/map/ZooMap';
import MapInfoPanel from '../components/map/MapInfoPanel';
import Skeleton from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getMapPoints, getZones, getAnimals, getTours } from '../services/api';
import { MAP_POINT_TYPES } from '../constants/catalog';

/**
 * Trang bản đồ. Hỗ trợ query:
 *   ?focus=<pointId>          – chọn sẵn một điểm
 *   ?route=gate,asia          – vẽ đường đi giữa các điểm (nút "Chỉ đường")
 *   ?tour=<tourId>            – vẽ lộ trình của một tuyến tham quan
 */
export default function MapPage() {
  useDocumentTitle('Bản đồ');
  const [params, setParams] = useSearchParams();
  const points = useAsync(getMapPoints, []);
  const zones = useAsync(getZones, []);
  const animals = useAsync(() => getAnimals(), []);
  const tours = useAsync(getTours, []);

  const [selected, setSelected] = useState(null);
  const [types, setTypes] = useState(Object.keys(MAP_POINT_TYPES));

  const tourId = params.get('tour');
  const tour = tours.data?.find((t) => t.id === tourId);
  const route = useMemo(() => {
    if (tour) return tour.stops;
    const r = params.get('route');
    return r ? r.split(',') : [];
  }, [tour, params]);

  // Chọn sẵn điểm theo ?focus= hoặc điểm cuối của lộ trình
  useEffect(() => {
    if (!points.data) return;
    const focusId = params.get('focus') || (params.get('route') ? route[route.length - 1] : null);
    const point = points.data.find((p) => p.id === focusId);
    if (point) setSelected(point);
  }, [points.data, params, route]);

  const toggleType = (type) =>
    setTypes((list) => (list.includes(type) ? list.filter((t) => t !== type) : [...list, type]));

  const zoneAnimals = selected?.zoneId ? (animals.data ?? []).filter((a) => a.zone === selected.zoneId) : [];

  return (
    <>
      <PageHeader title="Bản đồ sở thú" description="Chạm vào điểm trên bản đồ để xem mô tả và các loài động vật." />
      <section className="section section--flush-top">
        <div className="container">
          <div className="map-toolbar">
            <div className="chip-row" role="group" aria-label="Hiện loại điểm">
              {Object.entries(MAP_POINT_TYPES).map(([type, label]) => (
                <button
                  key={type}
                  className={`chip ${types.includes(type) ? 'is-active' : ''}`}
                  onClick={() => toggleType(type)}
                  aria-pressed={types.includes(type)}
                >
                  {label}
                </button>
              ))}
            </div>
            {route.length > 0 && (
              <div className="route-pill">
                <span>{tour ? `Lộ trình: ${tour.name}` : 'Đang chỉ đường từ Cổng chính'}</span>
                <button className="icon-btn" onClick={() => setParams({})} aria-label="Tắt lộ trình"><X size={16} /></button>
              </div>
            )}
          </div>

          {points.error ? (
            <ErrorState error={points.error} onRetry={points.reload} />
          ) : (
            <div className="map-layout">
              <div className="map-scroll">
                {points.data ? (
                  <ZooMap
                    points={points.data}
                    zones={zones.data ?? []}
                    selectedId={selected?.id}
                    onSelect={setSelected}
                    route={route}
                    visibleTypes={types}
                  />
                ) : (
                  <Skeleton height={520} radius={16} />
                )}
              </div>
              <MapInfoPanel point={selected} animals={zoneAnimals} onClose={() => setSelected(null)} />
            </div>
          )}
          <p className="muted map-note">Kéo ngang để xem toàn bộ bản đồ trên điện thoại.</p>
        </div>
      </section>
    </>
  );
}
