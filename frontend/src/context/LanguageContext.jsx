import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { translations } from '../utils/translations';
import { getLanguages, getPublicSettings } from '../services/api';

const LanguageContext = createContext(null);

/**
 * UC04 – Đổi ngôn ngữ.
 * - Danh sách ngôn ngữ đang bật và ngôn ngữ mặc định lấy từ backend.
 * - Lựa chọn của khách lưu trên trình duyệt (localStorage).
 * - Lần đầu vào (A1) hoặc ngôn ngữ đã lưu bị admin tắt (E2) → dùng ngôn ngữ mặc định.
 */
export function LanguageProvider({ children }) {
  const [saved, setSaved] = useLocalStorage('zooguide_lang', null);
  const [languages, setLanguages] = useState([]);
  const [info, setInfo] = useState(null); // tên sở thú, giờ mở cửa, hotline, ngôn ngữ mặc định

  // Gọi lại sau khi admin đổi cài đặt / bật tắt ngôn ngữ. Luôn lấy danh sách ngôn ngữ ĐANG BẬT (như khách thấy).
  const reload = useCallback(() => {
    getPublicSettings().then(setInfo).catch(() => {});
    getLanguages({ guest: true }).then(setLanguages).catch(() => {});
  }, []);
  useEffect(reload, [reload]);

  const defaultLang = info?.default_lang ?? 'vi';
  const lang = saved && (!languages.length || languages.some((l) => l.code === saved)) ? saved : defaultLang;

  const value = useMemo(
    () => ({
      lang,
      setLang: setSaved,
      languages,
      info,
      reload,
      t: (key) => translations[lang]?.[key] ?? translations.vi[key] ?? key,
    }),
    [lang, setSaved, languages, info, reload]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
