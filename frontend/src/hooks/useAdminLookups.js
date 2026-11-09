import { useAsync } from './useAsync';
import { getLanguages, getSettings } from '../services/api';

/** Ngôn ngữ (cả đang tắt) và ngôn ngữ mặc định – dùng cho các form 3 tab của admin */
export function useAdminLanguages() {
  const languages = useAsync(() => getLanguages(), []);
  const settings = useAsync(getSettings, []);
  return {
    languages: languages.data ?? [],
    defaultLang: settings.data?.default_lang ?? 'vi',
    ready: Boolean(languages.data && settings.data),
  };
}
