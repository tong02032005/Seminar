import Skeleton from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';

/**
 * Bảng dữ liệu dùng chung cho Admin.
 * columns: [{ key, header, render?: (row) => node, className? }]
 */
export default function DataTable({ columns, rows, loading, error, onRetry, rowKey = 'id', emptyMessage = 'Chưa có dữ liệu.' }) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />;

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} className={c.className}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {loading && !rows?.length
            ? Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  {columns.map((c) => <td key={c.key}><Skeleton height={14} /></td>)}
                </tr>
              ))
            : rows?.map((row) => (
                <tr key={row[rowKey]}>
                  {columns.map((c) => (
                    <td key={c.key} className={c.className} data-label={c.header}>
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && rows?.length === 0 && <EmptyState icon="🗂️" title="Không có kết quả" message={emptyMessage} />}
    </div>
  );
}
