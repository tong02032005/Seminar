export default function Skeleton({ width = '100%', height = 16, radius = 8, className = '' }) {
  return <span className={`skeleton ${className}`} style={{ width, height, borderRadius: radius }} aria-hidden="true" />;
}
