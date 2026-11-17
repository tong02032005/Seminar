import { useState } from 'react';
import { Users, TrendingUp } from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import { OnlineNow } from './Dashboard';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getVisitReport } from '../../services/api';

const GROUPS = [{ value: 'day', label: 'Ngày' }, { value: 'month', label: 'Tháng' }, { value: 'year', label: 'Năm' }];
const isoDate = (d) => d.toLocaleDateString('sv-SE'); // YYYY-MM-DD theo giờ máy
const fmtDate = (iso) => iso.split('-').reverse().join('/');
const fmtPeriod = (p) => (p.length === 10 ? fmtDate(p).slice(0, 5) : p.length === 7 ? `${p.slice(5)}/${p.slice(0, 4)}` : p);

function defaultFilter() {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 6);
  return { from: isoDate(from), to: isoDate(today), group: 'day' };
}

/** Báo cáo lượt truy cập theo ngày / tháng / năm (1 lượt = 1 phiên, nghỉ quá 30 phút tính lượt mới) */
export default function AdminVisits() {
  useDocumentTitle('Thống kê truy cập');
  const [form, setForm] = useState(defaultFilter);
  const [filter, setFilter] = useState(form); // chỉ gọi API khi bấm "Xem thống kê"
  const { data, loading, error, reload } = useAsync(() => getVisitReport(filter.from, filter.to, filter.group), [filter]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target?.value ?? e }));
  const submit = (e) => { e.preventDefault(); setFilter({ ...form }); };

  const series = data?.series ?? [];
  const max = Math.max(1, ...series.map((s) => s.visits));
  const peak = series.reduce((best, s) => (s.visits > (best?.visits ?? 0) ? s : best), null);

  return (
    <div className="stack-lg">
      <p className="field__hint">Giờ Việt Nam (UTC+7) · 1 lượt = 1 lần khách vào web, nghỉ quá 30 phút tính lượt mới</p>

      <form className="panel visit-filter" onSubmit={submit}>
        <label className="field"><span>Từ ngày</span><input type="date" value={form.from} max={form.to} onChange={set('from')} required /></label>
        <label className="field"><span>Đến ngày</span><input type="date" value={form.to} min={form.from} onChange={set('to')} required /></label>
        <div className="field">
          <span>Nhóm theo</span>
          <div className="chip-row">
            {GROUPS.map((g) => (
              <button key={g.value} type="button" className={`chip ${form.group === g.value ? 'is-active' : ''}`}
                aria-pressed={form.group === g.value} onClick={() => set('group')(g.value)}>{g.label}</button>
            ))}
          </div>
        </div>
        <button className="btn btn--primary" type="submit">Xem thống kê</button>
      </form>

      {error ? <ErrorState error={error} onRetry={reload} /> : (
        <>
          <div className="stat-grid">
            <OnlineNow />
            {loading || !data ? <><Skeleton height={96} radius={14} /><Skeleton height={96} radius={14} /></> : (
              <>
                <StatCard icon={Users} label="Tổng lượt truy cập" value={data.total} tone="sky"
                  note={`${fmtDate(filter.from)} – ${fmtDate(filter.to)}`} />
                <StatCard icon={TrendingUp} label="Kỳ đông nhất" value={peak ? fmtPeriod(peak.period) : '—'} tone="sand"
                  note={peak ? `${peak.visits} lượt` : 'Chưa có lượt nào'} />
              </>
            )}
          </div>

          <section className="panel">
            <h3>Lượt truy cập theo {GROUPS.find((g) => g.value === filter.group).label.toLowerCase()}</h3>
            {loading ? <Skeleton height={220} /> : (
              <div className="bar-chart" role="img" aria-label="Biểu đồ lượt truy cập">
                {series.map((s) => (
                  <div key={s.period} className="bar-chart__col" title={`${s.period}: ${s.visits} lượt`}>
                    <span className="bar-chart__value">{s.visits}</span>
                    <i style={{ height: `${(s.visits / max) * 100}%` }} />
                    <span className="bar-chart__label">{fmtPeriod(s.period)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Kỳ</th><th>Lượt truy cập</th><th>Tỉ lệ %</th></tr></thead>
              <tbody>
                {series.map((s) => (
                  <tr key={s.period}>
                    <td data-label="Kỳ">{s.period.length === 10 ? fmtDate(s.period) : fmtPeriod(s.period)}</td>
                    <td data-label="Lượt truy cập">{s.visits}</td>
                    <td data-label="Tỉ lệ %">{data.total ? ((s.visits / data.total) * 100).toFixed(1) : '0.0'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
