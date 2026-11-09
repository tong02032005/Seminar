/** Nhãn mức bảo tồn IUCN; tên và màu lấy từ backend theo ngôn ngữ */
export default function ConservationBadge({ code, name, color }) {
  if (!code) return null;
  return (
    <span className="badge badge--iucn" style={{ '--iucn': color ?? '#999' }} title={`IUCN: ${code}`}>
      {code}{name ? ` · ${name}` : ''}
    </span>
  );
}
