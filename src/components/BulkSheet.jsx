import { usePlanner } from '../lib/store.jsx';
import { MONTHS_SHORT, dayTitle, isoWeek, scopeRange } from '../lib/date.js';

/** Багцаар устгах доод хуудас — өдөр / 7 хоног / сар / бүгд. */
export default function BulkSheet({ date, dark = false, onClose }) {
  const { data, tasksInRange, deleteMany } = usePlanner();

  const rows = [
    { label: 'Энэ өдрийн бүх тэмдэглэл', sub: dayTitle(date), list: tasksInRange(date, date) },
    {
      label: 'Энэ 7 хоногийн бүх тэмдэглэл',
      sub: `${isoWeek(date).week} дугаар 7 хоног`,
      list: tasksInRange(...scopeRange('week', date))
    },
    {
      label: 'Энэ сарын бүх тэмдэглэл',
      sub: `${MONTHS_SHORT[date.getMonth()]} · ${date.getFullYear()}`,
      list: tasksInRange(...scopeRange('month', date))
    },
    { label: 'Бүх тэмдэглэл', sub: 'Огноо харгалзахгүй, бүгдийг', list: data.tasks }
  ];

  function run(row) {
    if (row.list.length === 0) return;
    const ok = confirm(`${row.label} — ${row.list.length} тэмдэглэл бүрмөсөн устана.\n\nҮргэлжлүүлэх үү?`);
    if (!ok) return;
    deleteMany(row.list.map((t) => t.id));
    onClose();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className={`sheet${dark ? ' dark' : ''}`} onClick={(e) => e.stopPropagation()}>
        <h2>Багцаар устгах</h2>

        <div className="bulk-list">
          {rows.map((row) => (
            <button
              key={row.label}
              className={`bulk-row${row.list.length === 0 ? ' is-off' : ''}`}
              onClick={() => run(row)}
              disabled={row.list.length === 0}
            >
              <span className="bulk-text">
                <span className="bulk-label">{row.label}</span>
                <span className="bulk-sub">{row.sub}</span>
              </span>
              <span className="bulk-count">{row.list.length}</span>
            </button>
          ))}
        </div>

        <div className="sheet-actions">
          <button type="button" className="btn plain" onClick={onClose}>
            Болих
          </button>
        </div>
      </div>
    </div>
  );
}
