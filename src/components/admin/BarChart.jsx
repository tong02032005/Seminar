import { formatNumber } from '../../utils/format';

/** Biểu đồ cột SVG đơn giản (mockup). Có thể thay bằng Recharts/Chart.js sau này. */
export default function BarChart({ data, color = 'var(--c-forest)', height = 220 }) {
  const max = Math.max(1, ...data.map((d) => d.value)) * 1.1;
  const barW = 100 / data.length;

  return (
    <div className="chart">
      <svg viewBox={`0 0 100 ${height / 3}`} preserveAspectRatio="none" style={{ height }} role="img" aria-label="Biểu đồ cột">
        {[0.25, 0.5, 0.75].map((r) => (
          <line key={r} x1="0" x2="100" y1={(height / 3) * r} y2={(height / 3) * r} stroke="var(--c-line)" strokeWidth="0.2" />
        ))}
        {data.map((d, i) => {
          const h = (d.value / max) * (height / 3);
          return (
            <rect key={d.label} x={i * barW + barW * 0.2} y={height / 3 - h} width={barW * 0.6} height={h} rx="1" fill={color}>
              <title>{`${d.label}: ${formatNumber(d.value)}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="chart__labels">
        {data.map((d) => <span key={d.label}>{d.label}</span>)}
      </div>
    </div>
  );
}
