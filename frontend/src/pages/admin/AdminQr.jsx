import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, Search } from 'lucide-react';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getAnimalsAdmin, getZonesAdmin, getPublicSettings } from '../../services/api';

const SCAN_TEXT = 'Quét để xem thông tin và nghe thuyết minh / Scan to read and listen · 扫码收听讲解';
const trimSlash = (url) => url.trim().replace(/\/+$/, '');
const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const toQr = (text, width = 320) => QRCode.toDataURL(text, { width, margin: 2 });

/** Tên + khu theo 3 ngôn ngữ: API admin chỉ trả tên của 1 ngôn ngữ mỗi lần nên gọi 3 lần rồi ghép theo id */
async function loadAnimals() {
  // ponytail: tối đa 100 con vật (giới hạn size của API); vượt quá thì lặp theo trang
  const [vi, en, zh] = await Promise.all(['vi', 'en', 'zh'].map((lang) => getAnimalsAdmin({ size: 100, lang })));
  const nameIn = (list, id) => list.items.find((a) => a.id === id)?.name;
  return vi.items.map((a) => ({ ...a, name_en: nameIn(en, a.id), name_zh: nameIn(zh, a.id) }));
}

function useQr(text) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let alive = true;
    toQr(text).then((url) => alive && setSrc(url));
    return () => { alive = false; };
  }, [text]);
  return src;
}

function QrCard({ url, fileName, title, children, onPrint, printLabel = 'In bảng' }) {
  const src = useQr(url);
  return (
    <div className="qr-card">
      {src ? <img src={src} alt={`Mã QR ${title}`} width={160} height={160} /> : <Skeleton height={160} width={160} />}
      <div className="qr-card__body">
        <strong>{title}</strong>
        {children}
        <a className="qr-card__link" href={url} target="_blank" rel="noreferrer">{url}</a>
        <div className="tag-row">
          <a className="btn btn--outline btn--sm" href={src} download={fileName}><Download size={16} /> Tải PNG</a>
          <button className="btn btn--outline btn--sm" onClick={onPrint}><Printer size={16} /> {printLabel}</button>
        </div>
      </div>
    </div>
  );
}

/** Tạo mã QR cổng vào và từng con vật (vẽ trên trình duyệt, không lưu CSDL), tải PNG hoặc in bảng treo chuồng */
export default function AdminQr() {
  useDocumentTitle('Mã QR');
  const [base, setBase] = useLocalStorage('qr-base-url', window.location.origin);
  const animals = useAsync(loadAnimals, []);
  const zones = useAsync(getZonesAdmin, []);
  const info = useAsync(getPublicSettings, []);
  const [zoneId, setZoneId] = useState('');
  const [query, setQuery] = useState('');
  const [sheets, setSheets] = useState([]); // các bảng đang chuẩn bị in

  const root = trimSlash(base) || window.location.origin;
  const zooName = info.data?.zoo_name ?? 'ZooGuide';
  const shown = useMemo(() => (animals.data ?? []).filter((a) => (!zoneId || a.zone_id === Number(zoneId))
    && a.name.toLowerCase().includes(query.trim().toLowerCase())), [animals.data, zoneId, query]);

  const gateSheet = { key: 'gate', url: `${root}/`, zone: zooName, name: 'Cổng vào', sub: 'Entrance · 入口' };
  const animalSheet = (a) => ({
    key: a.id, url: `${root}/animals/${a.id}`, zone: a.zone_name, name: a.name,
    sub: [a.name_en, a.name_zh].filter(Boolean).join(' · '), scientific: a.scientific_name,
  });

  const print = async (items) => setSheets(await Promise.all(items.map(async (s) => ({ ...s, qr: await toQr(s.url, 640) }))));
  useEffect(() => {
    if (!sheets.length) return undefined;
    const clear = () => setSheets([]);
    window.addEventListener('afterprint', clear);
    window.print();
    return () => window.removeEventListener('afterprint', clear);
  }, [sheets]);

  return (
    <>
      <div className="stack-lg qr-screen">
        <section className="panel stack">
          <label className="field">
            <span>Địa chỉ trang khách</span>
            <input type="url" value={base} onChange={(e) => setBase(e.target.value)} onBlur={() => setBase(trimSlash(base))}
              placeholder="https://zoo.example.vn" />
          </label>
          <div className="admin-toolbar">
            <span className="field__hint">Địa chỉ khách sẽ mở khi quét mã. In xong mà đổi địa chỉ thì phải in lại.</span>
            <button className="btn btn--outline btn--sm" onClick={() => setBase(window.location.origin)}>Dùng địa chỉ đang mở</button>
          </div>
        </section>

        <section className="panel">
          <h3>QR cổng vào</h3>
          <QrCard url={gateSheet.url} fileName="qr-cong-vao.png" title="Cổng vào" printLabel="In"
            onPrint={() => print([gateSheet])} />
        </section>

        <section className="stack">
          <div className="admin-toolbar">
            <div className="search-input search-input--sm">
              <Search size={16} />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên con vật" aria-label="Tìm theo tên" />
            </div>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} aria-label="Lọc theo khu">
              <option value="">Tất cả khu</option>
              {zones.data?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            <button className="btn btn--primary" disabled={!shown.length} onClick={() => print(shown.map(animalSheet))}>
              <Printer size={18} /> In tất cả bảng QR ({shown.length})
            </button>
          </div>

          {animals.error ? <ErrorState error={animals.error} onRetry={animals.reload} /> : (
            <div className="qr-grid">
              {animals.loading
                ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={190} radius={14} />)
                : shown.map((a) => (
                  <QrCard key={a.id} url={`${root}/animals/${a.id}`} fileName={`qr-${a.id}-${slugify(a.name)}.png`}
                    title={a.name} onPrint={() => print([animalSheet(a)])}>
                    <small>{a.zone_name}</small>
                    <span className="tag-row">
                      {!a.available && <span className="tag tag--off" title="Khách quét sẽ thấy “Không tìm thấy”">Đang ẩn – khách quét sẽ thấy Không tìm thấy</span>}
                      {!a.has_poi && <span className="tag tag--warn">Chưa có POI/thuyết minh</span>}
                    </span>
                  </QrCard>
                ))}
            </div>
          )}
        </section>
      </div>

      <div className="qr-print">
        {sheets.map((s) => (
          <article key={s.key} className="qr-sheet">
            <p className="qr-sheet__zone">{s.zone}</p>
            <h2>{s.name}</h2>
            {s.sub && <p className="qr-sheet__sub">{s.sub}</p>}
            {s.scientific && <p className="qr-sheet__sci"><em>{s.scientific}</em></p>}
            <img src={s.qr} alt="" />
            <p className="qr-sheet__scan">{SCAN_TEXT}</p>
          </article>
        ))}
      </div>
    </>
  );
}
