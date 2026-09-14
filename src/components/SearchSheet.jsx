import { useMemo, useState } from 'react';
import { usePlanner } from '../lib/store.jsx';
import { dayTitle, parseKey } from '../lib/date.js';
import { habitSummary } from '../lib/model.js';

/** Бүх ажил, зуршлаас хайх бүтэн дэлгэцийн хуудас. */
export default function SearchSheet({ dark = false, onClose, onOpenHabit }) {
  const { search, setSelected, setTab, goalById } = usePlanner();
  const [q, setQ] = useState('');
  const res = useMemo(() => search(q), [q, search]);
  const short = q.trim().length > 0 && q.trim().length < 2;
  const empty = q.trim().length >= 2 && res.tasks.length === 0 && res.habits.length === 0;

  const goTo = (date) => {
    setSelected(date);
    setTab('calendar');
    onClose();
  };

  return (
    <div className="sheet-backdrop search-backdrop" onClick={onClose}>
      <div className={`search-panel${dark ? ' dark' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="search-top">
          <input
            className="search-input"
            type="search"
            value={q}
            autoFocus
            placeholder="Ажил, зуршил хайх…"
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="hd-act" onClick={onClose}>
            Хаах
          </button>
        </div>

        <div className="search-body">
          {q.trim().length === 0 && (
            <div className="search-hint">Гарчиг эсвэл тэмдэглэлээр хайна. Хамгийн багадаа 2 тэмдэгт.</div>
          )}
          {short && <div className="search-hint">Дор хаяж 2 тэмдэгт бичнэ үү.</div>}
          {empty && <div className="search-hint">«{q.trim()}» олдсонгүй.</div>}

          {res.habits.length > 0 && (
            <>
              <div className="search-group">Зуршил · {res.habits.length}</div>
              {res.habits.map((h) => (
                <button
                  key={h.id}
                  className="search-row"
                  onClick={() => {
                    onOpenHabit(h);
                    onClose();
                  }}
                >
                  <span className="search-row-main">
                    <span className="search-title">{h.title}</span>
                    {h.note && <span className="search-note">{h.note}</span>}
                  </span>
                  <span className="search-date">{habitSummary(h)}</span>
                </button>
              ))}
            </>
          )}

          {res.tasks.length > 0 && (
            <>
              <div className="search-group">Ажил · {res.tasks.length}</div>
              {res.tasks.map((t) => {
                const goal = goalById(t.goalId);
                return (
                  <button key={t.id} className="search-row" onClick={() => goTo(t.date)}>
                    <span className="search-row-main">
                      <span className={`search-title${t.done ? ' is-done' : ''}`}>{t.title}</span>
                      <span className="search-note">
                        {[t.time, t.note, goal?.title].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <span className="search-date">{dayTitle(parseKey(t.date))}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
