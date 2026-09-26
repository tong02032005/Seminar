import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScanLine, MapPinned, Route as RouteIcon, MessageCircle, Compass, Map as MapIcon } from 'lucide-react';
import AnimalList from '../components/animals/AnimalList';
import ZoneCard from '../components/zones/ZoneCard';
import TourCard from '../components/tours/TourCard';
import ZooMap from '../components/map/ZooMap';
import SectionHeader from '../components/common/SectionHeader';
import Skeleton from '../components/common/Skeleton';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getAnimals, getZones, getTours, getMapPoints } from '../services/api';

const STEPS = [
  { icon: ScanLine, title: 'Quét QR Code', text: 'Mỗi chuồng có biển QR. Quét bằng điện thoại hoặc nhập mã in bên dưới.' },
  { icon: MapPinned, title: 'Xem thông tin động vật', text: 'Môi trường sống, thức ăn, tình trạng bảo tồn và những điều thú vị.' },
  { icon: MessageCircle, title: 'Hỏi Zoo Assistant', text: 'Thắc mắc về loài vật, giờ mở cửa hay đường đi? Hỏi trợ lý ảo ngay trong ứng dụng.' },
  { icon: RouteIcon, title: 'Khám phá tuyến tham quan', text: 'Chọn lộ trình theo thời gian bạn có và đi theo từng điểm trên bản đồ.' },
];

export default function Home() {
  useDocumentTitle();
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  const featured = useAsync(() => getAnimals({ featured: true }), []);
  const zones = useAsync(getZones, []);
  const tours = useAsync(getTours, []);
  const points = useAsync(getMapPoints, []);

  const handleQuickCode = (e) => {
    e.preventDefault();
    navigate(`/qr${code.trim() ? `?code=${encodeURIComponent(code.trim())}` : ''}`);
  };

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <h1>Khám phá thế giới động vật</h1>
            <p className="hero__subtitle">
              Trải nghiệm tham quan sở thú thông minh với thuyết minh, bản đồ và hướng dẫn tương tác.
            </p>
            <div className="hero__actions">
              <Link to="/animals" className="btn btn--primary btn--lg"><Compass size={20} /> Khám phá động vật</Link>
              <Link to="/map" className="btn btn--light btn--lg"><MapIcon size={20} /> Xem bản đồ</Link>
            </div>
          </div>

          {/* Ô tra cứu nhanh – mô phỏng biển chuồng */}
          <form className="hero__sign" onSubmit={handleQuickCode}>
            <p className="hero__sign-title"><ScanLine size={18} /> Đang đứng trước chuồng?</p>
            <p className="hero__sign-text">Nhập mã in trên biển, ví dụ <strong>ZOO-001</strong>.</p>
            <div className="hero__sign-row">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ZOO-001" aria-label="Mã động vật" />
              <button className="btn btn--primary" type="submit">Tra cứu</button>
            </div>
            <Link to="/qr" className="hero__sign-link">Hoặc quét bằng camera</Link>
          </form>
        </div>
      </section>

      {/* ---------- 1. ĐỘNG VẬT NỔI BẬT ---------- */}
      <section className="section">
        <div className="container">
          <SectionHeader
            title="Động vật nổi bật"
            subtitle="Những loài được khách hỏi thăm nhiều nhất tuần này."
            linkTo="/animals"
            linkLabel="Xem tất cả động vật"
          />
          <AnimalList
            animals={featured.data?.slice(0, 6)}
            loading={featured.loading}
            error={featured.error}
            onRetry={featured.reload}
          />
        </div>
      </section>

      {/* ---------- 2. KHU VỰC ---------- */}
      <section className="section section--tint">
        <div className="container">
          <SectionHeader title="Khám phá theo khu vực" subtitle="Năm khu mô phỏng môi trường sống tự nhiên." linkTo="/zones" linkLabel="Tất cả khu vực" />
          <div className="zone-grid">
            {zones.loading
              ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={220} radius={16} />)
              : zones.data?.map((z) => <ZoneCard key={z.id} zone={z} />)}
          </div>
        </div>
      </section>

      {/* ---------- 3. CÁCH SỬ DỤNG ---------- */}
      <section className="section">
        <div className="container">
          <SectionHeader title="Cách sử dụng ZooGuide" subtitle="Bốn bước cho một buổi tham quan có người thuyết minh bên cạnh." />
          <ol className="steps">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
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

      {/* ---------- 4. TUYẾN THAM QUAN ---------- */}
      <section className="section section--tint">
        <div className="container">
          <SectionHeader title="Tuyến tham quan đề xuất" subtitle="Chọn theo thời gian và người đi cùng." linkTo="/tour" linkLabel="Xem lộ trình chi tiết" />
          <div className="tour-grid">
            {tours.loading
              ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={180} radius={16} />)
              : tours.data?.map((t) => (
                  <TourCard key={t.id} tour={t}>
                    <Link to={`/tour?id=${t.id}`} className="btn btn--outline btn--sm">Xem lộ trình</Link>
                  </TourCard>
                ))}
          </div>
        </div>
      </section>

      {/* ---------- 5. BẢN ĐỒ ---------- */}
      <section className="section">
        <div className="container home-map">
          <div className="home-map__text">
            <h2>Bản đồ sở thú</h2>
            <p>
              Năm khu động vật, nhà hàng, nhà vệ sinh và khu nghỉ ngơi. Chạm vào một điểm để xem
              chi tiết trên bản đồ đầy đủ.
            </p>
            <Link to="/map" className="btn btn--primary"><MapIcon size={18} /> Mở bản đồ đầy đủ</Link>
          </div>
          <div className="home-map__frame">
            {points.data ? (
              <ZooMap points={points.data} zones={zones.data ?? []} onSelect={(p) => navigate(`/map?focus=${p.id}`)} />
            ) : (
              <Skeleton height={360} radius={16} />
            )}
          </div>
        </div>
      </section>

      {/* ---------- 6. CHATBOT CTA ---------- */}
      <section className="section section--compact">
        <div className="container">
          <div className="chat-cta">
            <span className="chat-cta__owl" aria-hidden="true">🦉</span>
            <div>
              <h2>Bạn cần hỗ trợ?</h2>
              <p>Hỏi Zoo Assistant về giờ cho ăn, đường đi hay bất kỳ loài nào bạn đang đứng xem.</p>
            </div>
            <Link to="/chat" className="btn btn--light btn--lg"><MessageCircle size={20} /> Nói chuyện với Zoo Assistant</Link>
          </div>
        </div>
      </section>
    </>
  );
}
