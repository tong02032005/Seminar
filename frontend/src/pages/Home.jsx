import { Link } from 'react-router-dom';
import { Compass, Map as MapIcon, Globe, Search, MapPinned, Headphones, Clock, Phone } from 'lucide-react';
import AnimalList from '../components/animals/AnimalList';
import ZoneCard from '../components/zones/ZoneCard';
import SectionHeader from '../components/common/SectionHeader';
import Skeleton from '../components/common/Skeleton';
import ErrorState from '../components/common/ErrorState';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useLanguage } from '../context/LanguageContext';
import { getAnimals, getZones } from '../services/api';
import { formatHours } from '../utils/format';

/** Trang chủ: giới thiệu, giờ mở cửa, hotline (từ cài đặt hệ thống), động vật nổi bật, khu vực */
export default function Home() {
  useDocumentTitle();
  const { lang, t, info } = useLanguage();
  const featured = useAsync(() => getAnimals({ sort: 'popular', size: 6, lang }), [lang]);
  const zones = useAsync(() => getZones(lang), [lang]);

  const steps = [
    { icon: Globe, title: t('step1'), text: t('step1Text') },
    { icon: Search, title: t('step2'), text: t('step2Text') },
    { icon: MapPinned, title: t('step3'), text: t('step3Text') },
    { icon: Headphones, title: t('step4'), text: t('step4Text') },
  ];

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <h1>{info?.zoo_name ? `${info.zoo_name} – ${t('heroTitle')}` : t('heroTitle')}</h1>
            <p className="hero__subtitle">{t('heroText')}</p>
            <div className="hero__actions">
              <Link to="/animals" className="btn btn--primary btn--lg"><Compass size={20} /> {t('exploreAnimals')}</Link>
              <Link to="/map" className="btn btn--light btn--lg"><MapIcon size={20} /> {t('viewMap')}</Link>
            </div>
          </div>
          {info && (
            <div className="hero__sign">
              <p className="hero__sign-title"><Clock size={18} /> {t('openHours')}</p>
              <p className="hero__sign-text"><strong>{formatHours(info.open_hours)}</strong></p>
              {info.hotline && (
                <>
                  <p className="hero__sign-title"><Phone size={18} /> {t('hotline')}</p>
                  <p className="hero__sign-text"><a href={`tel:${info.hotline.replace(/\s/g, '')}`}><strong>{info.hotline}</strong></a></p>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader title={t('featured')} subtitle={t('featuredText')} linkTo="/animals" linkLabel={t('allAnimals')} />
          <AnimalList animals={featured.data?.items} loading={featured.loading} error={featured.error} onRetry={featured.reload} />
        </div>
      </section>

      <section className="section section--tint">
        <div className="container">
          <SectionHeader title={t('zonesTitle')} subtitle={t('zonesText')} linkTo="/zones" linkLabel={t('allZonesLink')} />
          {zones.error ? (
            <ErrorState error={zones.error} onRetry={zones.reload} />
          ) : (
            <div className="zone-grid">
              {zones.loading && !zones.data
                ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={220} radius={16} />)
                : zones.data?.map((z) => <ZoneCard key={z.id} zone={z} />)}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader title={t('howTitle')} />
          <ol className="steps">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="step">
                <span className="step__num">{i + 1}</span>
                <Icon size={26} className="step__icon" />
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
