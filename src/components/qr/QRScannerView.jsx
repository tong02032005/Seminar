import { Camera, CameraOff } from 'lucide-react';

/**
 * KHUNG QUÉT QR (mockup).
 * Để tích hợp thật (vd: html5-qrcode), render scanner vào phần tử `.qr-scanner__viewport`
 * trong useEffect khi `active = true`, và gọi onScan(decodedText) khi đọc được mã.
 * Trang cha không cần thay đổi.
 */
export default function QRScannerView({ active, onToggle, onSimulate }) {
  return (
    <div className={`qr-scanner ${active ? 'is-active' : ''}`}>
      <div className="qr-scanner__viewport" id="qr-reader">
        <span className="qr-scanner__corner tl" />
        <span className="qr-scanner__corner tr" />
        <span className="qr-scanner__corner bl" />
        <span className="qr-scanner__corner br" />
        {active ? (
          <>
            <span className="qr-scanner__line" />
            <p className="qr-scanner__hint">Đưa mã QR trên biển chuồng vào giữa khung</p>
          </>
        ) : (
          <p className="qr-scanner__hint">
            <CameraOff size={28} />
            <br />Camera đang tắt
          </p>
        )}
      </div>
      <div className="qr-scanner__actions">
        <button className="btn btn--primary" onClick={onToggle}>
          <Camera size={18} /> {active ? 'Tắt camera' : 'Bật camera'}
        </button>
        {active && (
          <button className="btn btn--ghost" onClick={onSimulate}>Giả lập quét thành công</button>
        )}
      </div>
    </div>
  );
}
