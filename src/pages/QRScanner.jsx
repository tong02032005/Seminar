import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import QRScannerView from '../components/qr/QRScannerView';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { getAnimalByQrCode, getAnimals } from '../services/api';

export default function QRScanner() {
  useDocumentTitle('Quét QR');
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('code') ?? '');
  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState({ loading: false, error: '' });
  const { data: animals = [] } = useAsync(() => getAnimals(), []);

  /** Dùng chung cho cả nhập tay và kết quả từ camera */
  const lookup = async (value) => {
    if (!value.trim()) {
      setStatus({ loading: false, error: 'Nhập mã in trên biển chuồng, ví dụ ZOO-001.' });
      return;
    }
    setStatus({ loading: true, error: '' });
    try {
      const animal = await getAnimalByQrCode(value);
      toast.success(`Đã tìm thấy: ${animal.name}`);
      navigate(`/animals/${animal.id}`);
    } catch (err) {
      setStatus({ loading: false, error: err.message });
    }
  };

  // Tự tra cứu nếu mở trang với ?code= (từ ô nhập ở Trang chủ hoặc link QR in sẵn)
  useEffect(() => {
    const initial = params.get('code');
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mock: chọn ngẫu nhiên một mã khi "giả lập quét"
  const simulateScan = () => {
    if (!animals?.length) return;
    const random = animals[Math.floor(Math.random() * animals.length)];
    setCameraOn(false);
    lookup(random.qrCode);
  };

  return (
    <>
      <PageHeader title="Quét mã QR để tìm hiểu về động vật" description="Mỗi chuồng có một biển QR. Quét bằng camera hoặc nhập mã bên dưới." />
      <section className="section section--flush-top">
        <div className="container qr-layout">
          <QRScannerView active={cameraOn} onToggle={() => setCameraOn((v) => !v)} onSimulate={simulateScan} />

          <div className="qr-manual">
            <h2>Nhập mã thủ công</h2>
            <p className="muted">Mã gồm chữ ZOO và 3 chữ số, in ở góc dưới biển thông tin.</p>
            <form onSubmit={(e) => { e.preventDefault(); lookup(code); }} className="qr-manual__form">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ZOO-001"
                aria-label="Mã QR"
                aria-invalid={Boolean(status.error)}
              />
              <button className="btn btn--primary" disabled={status.loading}>
                {status.loading ? <span className="spinner spinner--light" /> : <Search size={18} />} Tra cứu
              </button>
            </form>
            {status.error && <p className="field__error" role="alert">{status.error}</p>}

            <div className="qr-samples">
              <p>Mã mẫu để thử:</p>
              <div className="chip-row">
                {(animals ?? []).slice(0, 5).map((a) => (
                  <button key={a.id} className="chip" onClick={() => { setCode(a.qrCode); lookup(a.qrCode); }}>
                    {a.emoji} {a.qrCode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
