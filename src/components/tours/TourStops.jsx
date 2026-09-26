/** Danh sách điểm dừng theo thứ tự (timeline dọc) */
export default function TourStops({ stops, points }) {
  return (
    <ol className="tour-stops">
      {stops.map((stopId, index) => {
        const point = points.find((p) => p.id === stopId);
        if (!point) return null;
        return (
          <li key={`${stopId}-${index}`}>
            <span className="tour-stops__dot">{index + 1}</span>
            <div>
              <strong>{point.icon} {point.name}</strong>
              <p>{point.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
