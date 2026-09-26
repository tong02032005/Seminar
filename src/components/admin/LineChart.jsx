import { formatNumber } from '../../utils/format';

/** Biểu đồ đường SVG đơn giản (mockup) */
export default function LineChart({ data, color = 'var(--c-sky-deep)', height = 220 }) {
  const h = height / 3;
  const max = Math.max(1, ...data.map((d) => d.value)) * 1.15;
  const step = 100 / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - (d.value / max) * h]);
  const line = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `0,${h} ${line} 100,${h}`;

  return (
    <div className="chart">
      <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" style={{ height }} role="img" aria-label="Biểu đồ đường">
        <polygon points={area} fill={color} opacity="0.12" />
        <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.1" fill={color}>
            <title>{`${data[i].label}: ${formatNumber(data[i].value)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="chart__labels chart__labels--spread">
        {data.map((d) => <span key={d.label}>{d.label}</span>)}
      </div>
    </div>
  );
}
