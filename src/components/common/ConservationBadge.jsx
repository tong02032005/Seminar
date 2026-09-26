import { CONSERVATION_STATUS } from '../../constants/catalog';

export default function ConservationBadge({ status }) {
  const info = CONSERVATION_STATUS[status];
  if (!info) return null;
  return (
    <span className={`badge badge--${info.tone}`} title={`Sách Đỏ IUCN: ${status}`}>
      {status} · {info.label}
    </span>
  );
}
