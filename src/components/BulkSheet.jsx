import { useState } from 'react';
import { usePlanner } from '../lib/store.jsx';
import ConfirmSheet from './ConfirmSheet.jsx';
import { MONTHS_SHORT, dayTitle, isoWeek, scopeRange } from '../lib/date.js';

/** Багцаар устгах доод хуудас — өдөр / 7 хоног / сар / бүгд. */
export default function BulkSheet({ date, dark = false, onClose }) {
  const { data, tasksInRange, deleteMany, clearTasksAndHabits } = usePlanner();
  const [ask, setAsk] = useState(null);

  // Зуршил нь ирээдүйд хязгааргүй давтагддаг тул «бүгд» гэдгийг өдрөөр бус
  // загвараар нь тоолж, ажил + зуршлыг бүхэлд нь устгана.
  const allCount = data.tasks.length + data.habits.length;

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
    {
      label: 'Бүх ажил, зуршил',
      sub: `${data.tasks.length} ажил · ${data.habits.length} зуршил`,
      count: allCount,
      all: true
    }
  ];

  function run(row) {
    if (row.all) {
      if (allCount === 0) return;
      setAsk({
        title: 'Бүх тэмдэглэлийг устгах уу?',
        message: `${data.tasks.length} ажил, ${data.habits.length} зуршил бүрмөсөн устана. Зорилго үлдэнэ. Буцаах боломжтой.`,
        label: `${allCount} устгах`,
        run: clearTasksAndHabits
      });
      return;
    }

    if (row.list.length === 0) return;
    setAsk({
      title: `${row.label}?`,
      message: `${row.sub} — ${row.list.length} тэмдэглэл бүрмөсөн устана. Буцаах боломжтой.`,
      label: `${row.list.length} устгах`,
      run: () => deleteMany(row.list.map((t) => t.id))
    });
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className={`sheet${dark ? ' dark' : ''}`} onClick={(e) => e.stopPropagation()}>
        <h2>Багцаар устгах</h2>

        <div className="bulk-list">
          {rows.map((row) => {
            const n = row.count ?? row.list.length;
            return (
              <button
                key={row.label}
                className={`bulk-row${n === 0 ? ' is-off' : ''}`}
                onClick={() => run(row)}
                disabled={n === 0}
              >
                <span className="bulk-text">
                  <span className="bulk-label">{row.label}</span>
                  <span className="bulk-sub">{row.sub}</span>
                </span>
                <span className="bulk-count">{n}</span>
              </button>
            );
          })}
        </div>

        <div className="hint">
          Өдөр / 7 хоног / сарын сонголт зуршлын тухайн өдрийг алгасна — зуршлын загвар өөрөө үлдэнэ.
        </div>

        <div className="sheet-actions">
          <button type="button" className="btn plain" onClick={onClose}>
            Болих
          </button>
        </div>
      </div>

      {ask && (
        <ConfirmSheet
          title={ask.title}
          message={ask.message}
          confirmLabel={ask.label}
          dark={dark}
          onConfirm={() => {
            ask.run();
            onClose();
          }}
          onClose={() => setAsk(null)}
        />
      )}
    </div>
  );
}
