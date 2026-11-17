import EmptyState from '../components/common/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();
  useDocumentTitle(t('pageNotFound'));
  return (
    <section className="section">
      <div className="container">
        <EmptyState icon="🧭" title={t('pageNotFound')} actionLabel={t('backHome')} actionTo="/" />
      </div>
    </section>
  );
}
