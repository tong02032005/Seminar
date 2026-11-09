import { useState } from 'react';
import { Headphones, AlertCircle } from 'lucide-react';
import { mediaUrl } from '../../services/config';
import { useLanguage } from '../../context/LanguageContext';

/**
 * UC03 – Nghe thuyết minh. poi là POI theo ngôn ngữ đang chọn (từ backend), chỉ chứa file ĐÃ LƯU.
 * - Chưa có POI / chưa có lời thuyết minh → "Chưa có thuyết minh" (E2)
 * - Có lời nhưng chưa có file âm thanh → chỉ hiện chữ + "Chưa có âm thanh" (E1)
 * - Không tải được file → báo lỗi + Thử lại (E3)
 * Đổi ngôn ngữ → audio_url mới → thẻ audio được tạo lại (key) nên file cũ dừng ngay (A1).
 */
export default function NarrationPlayer({ poi, compact = false }) {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(null); // url bị lỗi
  const [attempt, setAttempt] = useState(0);

  if (!poi?.narration) {
    return <p className="narration narration--empty"><Headphones size={18} /> {t('noNarration')}</p>;
  }

  const src = mediaUrl(poi.audio_url);
  return (
    <section className={`narration ${compact ? 'narration--compact' : ''}`} aria-label={t('narration')}>
      <h3><Headphones size={18} /> {t('narration')}</h3>
      {src ? (
        failed === src ? (
          <p className="narration__error" role="alert">
            <AlertCircle size={16} /> {t('audioError')}{' '}
            <button className="text-link" onClick={() => { setFailed(null); setAttempt((n) => n + 1); }}>{t('retry')}</button>
          </p>
        ) : (
          <audio key={`${src}-${attempt}`} controls preload="none" src={src} onError={() => setFailed(src)} className="narration__audio" />
        )
      ) : (
        <p className="narration__status">{t('noAudio')}</p>
      )}
      <p className="narration__text">{poi.narration}</p>
    </section>
  );
}
