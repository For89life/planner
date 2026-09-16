import { useEffect, useMemo, useState } from 'react';
import { usePlanner } from '../lib/store.jsx';
import ListActions from '../components/ListActions.jsx';
import SelectionBar from '../components/SelectionBar.jsx';
import BulkSheet from '../components/BulkSheet.jsx';
import SearchButton from '../components/SearchButton.jsx';
import { DOW_FULL, addDays, dateKey, dowIndex, isoWeek, minutesOf, parseKey } from '../lib/date.js';

const STREAK_DAYS = 14;
const REMIND_WINDOW = 90; // минут

export default function DayScreen({ onOpenTask }) {
  const {
    selected,
    selectedDate,
    tasksOn,
    toggleTask,
    saveTask,
    selection,
    startSelect,
    stopSelect,
    toggleSelect,
    selectMany,
    deleteMany,
    todayKey
  } = usePlanner();
  const [now, setNow] = useState(() => new Date());
  const [snoozedUntil, setSnoozedUntil] = useState(0);
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const sel = selectedDate;
  const t = useMemo(() => parseKey(todayKey), [todayKey]);
  const isToday = selected === dateKey(t);
  const tasks = tasksOn(selected);
  const done = tasks.filter((x) => x.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const pending = tasks.filter((x) => !x.done && x.habit).length;

  const dayComplete = (d) => {
    const list = tasksOn(d);
    return list.length > 0 && list.every((x) => x.done);
  };

  const streak = useMemo(() => {
    let count = 0;
    let cursor = dayComplete(t) ? t : addDays(t, -1);
    while (dayComplete(cursor) && count < 999) {
      count++;
      cursor = addDays(cursor, -1);
    }
    return count;
    // tasksOn нь ажлын жагсаалтаас хамаарна
  }, [tasksOn, t]);

  const bars = useMemo(
    () =>
      Array.from({ length: STREAK_DAYS }, (_, i) => {
        const d = addDays(t, i - (STREAK_DAYS - 1));
        return { key: dateKey(d), on: dayComplete(d), ramp: 0.45 + (i / (STREAK_DAYS - 1)) * 0.55 };
      }),
    [tasksOn, t]
  );

  const nowMin = now.getHours() * 60 + now.getMinutes();

  const upcoming = useMemo(() => {
    if (!isToday) return null;
    if (Date.now() < snoozedUntil) return null;
    return (
      tasks.find((x) => {
        const m = minutesOf(x.time);
        return !x.done && m !== null && m >= nowMin && m - nowMin <= REMIND_WINDOW;
      }) || null
    );
  }, [tasks, isToday, nowMin, snoozedUntil]);

  const currentId = useMemo(() => {
    if (!isToday) return null;
    const timed = tasks.filter((x) => minutesOf(x.time) !== null);
    let cur = null;
    for (const x of timed) if (minutesOf(x.time) <= nowMin) cur = x;
    return cur && !cur.done ? cur.id : null;
  }, [tasks, isToday, nowMin]);

  return (
    <div className="screen dark-screen">
      <div className="pad hd">
        <div>
          <div className="hd-eyebrow">
            {DOW_FULL[dowIndex(sel)]} · {isoWeek(sel).week} дугаар 7 хоног
          </div>
          <div className="hd-title">
            {sel.getMonth() + 1} сарын {sel.getDate()}
          </div>
        </div>
        <div className="hd-right">
          <SearchButton />
          <div style={{ textAlign: 'right' }}>
            <div className="hd-stat" style={{ fontSize: 20 }}>
              {streak}
            </div>
            <div className="hd-sub">өдөр дараалан</div>
          </div>
        </div>
      </div>

      <div className="pad streak">
        {bars.map((b) => (
          <i
            key={b.key}
            style={{
              background: b.on ? 'oklch(0.52 0.1 150)' : 'rgba(255,255,255,.07)',
              opacity: b.on ? b.ramp : 1
            }}
          />
        ))}
      </div>

      {upcoming && (
        <div className="reminder">
          <div className="rem-hd">
            <div className="rem-badge">{Math.max(0, minutesOf(upcoming.time) - nowMin)}′</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="rem-title">
                {upcoming.title} {Math.max(0, minutesOf(upcoming.time) - nowMin)} минутын дараа
              </div>
              <div className="rem-meta">{[upcoming.time, upcoming.note].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
          <div className="rem-actions">
            <button className="btn-ghost" onClick={() => setSnoozedUntil(Date.now() + 15 * 60000)}>
              15 мин хойшлуулах
            </button>
            <button
              className="btn-solid"
              onClick={() => saveTask({ ...upcoming, done: true })}
            >
              Ойлголоо
            </button>
          </div>
        </div>
      )}

      <div className="pad list-hd">
        <h2>Өдрийн ажил</h2>
        <ListActions
          selecting={selection.active}
          onStart={() => startSelect()}
          onStop={stopSelect}
          onBulk={() => setBulkOpen(true)}
        />
      </div>

      <div className="pad tl">
        {tasks.length === 0 ? (
          <div className="empty dark">Энэ өдөр ажил алга. + товчоор нэмнэ үү.</div>
        ) : (
          tasks.map((task) => {
            const isNow = task.id === currentId;
            const picked = selection.ids.includes(task.id);
            return (
              <div className="tl-row" key={task.id}>
                <div className="tl-time">{task.time || '—'}</div>
                {selection.active ? (
                  <button
                    className={`tl-block${picked ? ' is-picked' : ''}`}
                    onClick={() => toggleSelect(task.id)}
                    aria-pressed={picked}
                  >
                    <span className={`tl-dot${task.done ? ' is-done' : ''}`} />
                    <span className="t-body">
                      <div className={`t-title dark${task.done ? ' is-done' : ''}`}>{task.title}</div>
                      {task.note && <div className="tl-meta">{task.note}</div>}
                    </span>
                    <span className={`pickbox dark${picked ? ' is-on' : ''}`}>{picked ? '✓' : ''}</span>
                  </button>
                ) : (
                  <div className={`tl-block${isNow ? ' is-now' : ''}`}>
                    <span className={`tl-dot${task.done ? ' is-done' : isNow ? ' is-now' : ''}`} />
                    <button className="t-body" onClick={() => onOpenTask(task)}>
                      <div className={`t-title dark${task.done ? ' is-done' : ''}`}>{task.title}</div>
                      {task.note && <div className="tl-meta">{task.note}</div>}
                    </button>
                    <button
                      className={`box dark${task.done ? ' is-done' : ''}`}
                      onClick={() => toggleTask(task.id)}
                      aria-label={task.done ? 'Дуусаагүй болгох' : 'Дууссан болгох'}
                      aria-pressed={task.done}
                    >
                      {task.done ? '✓' : ''}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="summary">
        <div>
          <div className="summary-t">Өдрийн дүгнэлт</div>
          <div className="summary-m">
            {done}/{tasks.length} ажил
            {pending > 0 ? ` · ${pending} зуршил хүлээгдэж байна` : ''}
          </div>
        </div>
        <div className="summary-p">{pct}%</div>
      </div>

      {selection.active && (
        <SelectionBar
          count={selection.ids.length}
          total={tasks.length}
          dark
          onAll={() => selectMany(tasks.map((t) => t.id))}
          onNone={() => selectMany([])}
          onDelete={() => deleteMany(selection.ids)}
        />
      )}

      {bulkOpen && <BulkSheet date={sel} dark onClose={() => setBulkOpen(false)} />}
    </div>
  );
}
