export default function StatCard({ icon: Icon, label, value, note, tone = 'green' }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__icon"><Icon size={22} /></span>
      <div>
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        {note && <p className="stat-card__note">{note}</p>}
      </div>
    </div>
  );
}
