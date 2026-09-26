import { Link } from 'react-router-dom';

export default function EmptyState({ icon = '🍃', title, message, actionLabel, actionTo, onAction }) {
  return (
    <div className="state-box">
      <span className="state-box__icon" aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {actionLabel && actionTo && <Link to={actionTo} className="btn btn--primary">{actionLabel}</Link>}
      {actionLabel && onAction && <button className="btn btn--primary" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}
