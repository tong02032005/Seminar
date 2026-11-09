import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import ZooMap from '../components/map/ZooMap';
import MapInfoPanel from '../components/map/MapInfoPanel';
import Skeleton from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useLanguage } from '../context/LanguageContext';
import { getPois, getZones } from '../services/api';

/**
 * UC02 bước 5–8 – bản đồ các điểm POI của động vật đang hiện.
 *   ?zone=<id>   lọc theo khu (A1)      ?focus=<poiId>  chọn sẵn một điểm (từ trang chi tiết)
 */
export default function MapPage() {
  const { lang, t } = useLanguage();
  useDocumentTitle(t('map'));
  const [params, setParams] = useSearchParams();
  const zoneId = params.get('zone') ?? '';
  const focusId = Number(params.get('focus')) || null;

  const points = useAsync(() => getPois({ lang, zone_id: zoneId }), [lang, zoneId]);
  const zones = useAsync(() => getZones(lang), [lang]);
  const [selectedId, setSelectedId] = useState(focusId);
  useEffect(() => setSelectedId(focusId), [focusId]);

  const selected = points.data?.find((p) => p.id === selectedId) ?? null;
  const setZone = (value) => setParams(value ? { zone: value } : {});

  return (
    <>
      <PageHeader title={t('mapTitle')} description={t('mapText')} />
      <section className="section section--flush-top">
        <div className="container">
          <div className="map-toolbar">
            <label className="select">
              <span>{t('filterZone')}</span>
              <select value={zoneId} onChange={(e) => setZone(e.target.value)}>
                <option value="">{t('allZones')}</option>
                {zones.data?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </label>
          </div>

          {points.error ? (
            <ErrorState error={points.error} onRetry={points.reload} />
          ) : !points.data ? (
            <Skeleton height={520} radius={16} />
          ) : points.data.length === 0 ? (
            <EmptyState icon="🗺️" title={t('noPoi')} />
          ) : (
            <div className="map-layout">
              <div className="map-scroll">
                <ZooMap points={points.data} zones={zones.data ?? []} selectedId={selectedId} onSelect={(p) => setSelectedId(p.id)} />
              </div>
              <MapInfoPanel poi={selected} onClose={() => setSelectedId(null)} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
