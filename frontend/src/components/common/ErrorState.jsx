import { useLanguage } from '../../context/LanguageContext';

export default function ErrorState({ error, onRetry }) {
  const { t } = useLanguage();
  const notFound = error?.status === 404;
  return (
    <div className="state-box state-box--error" role="alert">
      <span className="state-box__icon" aria-hidden="true">{notFound ? '🔎' : '⚠️'}</span>
      <h3>{notFound ? t('notFound') : t('loadError')}</h3>
      <p>{error?.message}</p>
      {onRetry && !notFound && <button className="btn btn--outline" onClick={onRetry}>{t('retry')}</button>}
    </div>
  );
}
