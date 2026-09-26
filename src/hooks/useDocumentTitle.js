import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} – ZooGuide` : 'ZooGuide – Thuyết minh thông minh trong sở thú';
  }, [title]);
}
