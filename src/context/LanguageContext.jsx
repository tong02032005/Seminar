import { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { translations } from '../utils/translations';

const LanguageContext = createContext(null);

/**
 * Đa ngôn ngữ ở mức cơ bản (menu, footer). Có thể thay bằng react-i18next sau này.
 */
export function LanguageProvider({ children }) {
  const [lang, setLang] = useLocalStorage('zooguide_lang', 'vi');

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key) => translations[lang]?.[key] ?? translations.vi[key] ?? key,
    }),
    [lang, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
