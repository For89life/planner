import { useState } from 'react';
import { usePlanner } from '../lib/store.jsx';
import TaskRow from '../components/TaskRow.jsx';
import ListActions from '../components/ListActions.jsx';
import SelectionBar from '../components/SelectionBar.jsx';
import BulkSheet from '../components/BulkSheet.jsx';
import SearchButton from '../components/SearchButton.jsx';
import {
  DOW_SHORT,
  MONTHS_SHORT,
  ROMAN,
  addDays,
  addMonths,
  addYears,
  dateKey,
  dayTitle,
  isoWeek,
  monthGrid,
  quarterIndex,
  scopeKey,
  today,
  weekDays
} from '../lib/date.js';

const LEVELS = [
  ['year', 'Жил'],
  ['quarter', 'Улирал'],
  ['month', 'Сар'],
  ['week', '7 хоног'],
  ['day', 'Өдөр']
];

const PERIOD_LABEL = {
  year: 'жилийн гүйцэтгэл',
  quarter: 'улирлын гүйцэтгэл',
  month: 'сарын гүйцэтгэл',
  week: '7 хоногийн гүйцэтгэл',
  day: 'өдрийн гүйцэтгэл'
};

/** Идэвхтэй түвшний нэр — гүйлгэх мөрөнд гарна. */
function periodTitle(level, d) {
  if (level === 'year') return `${d.getFullYear()} он`;
  if (level === 'quarter') return `${ROMAN[quarterIndex(d)]} улирал · ${d.getFullYear()}`;
  if (level === 'month') return `${MONTHS_SHORT[d.getMonth()]} · ${d.getFullYear()}`;
  if (level === 'week') return `${isoWeek(d).week} дугаар 7 хоног`;
  return dayTitle(d);
}

/** Идэвхтэй түвшний нэг нэгжээр урагш/хойш алхана. */
function shift(level, d, dir) {
  if (level === 'year') return addYears(d, dir);
  if (level === 'quarter') return addMonths(d, dir * 3);
  if (level === 'month') return addMonths(d, dir);
  if (level === 'week') return addDays(d, dir * 7);
  return addDays(d, dir);
}

/** Харж буй хугацаа өнөөдрийг агуулж байна уу. */
function isCurrent(level, d, t) {
  if (level === 'day') return dateKey(d) === dateKey(t);
  return scopeKey(level, d) === scopeKey(level, t);
}

export default function CalendarScreen({ onOpenTask }) {
  const {
    level,
    setLevel,
    selected,
    setSelected,
    selectedDate,
    tasksOn,
    progress,
    progressFor,
    toggleTask,
    goalById,
    selection,
    startSelect,
    stopSelect,
    toggleSelect,
    selectMany,
    deleteMany
  } = usePlanner();
  const [bulkOpen, setBulkOpen] = useState(false);

  const sel = selectedDate;
  const t = today();
  const period = progressFor(level, sel);
  const tasks = tasksOn(selected);
  const doneCount = tasks.filter((x) => x.done).length;
  const atToday = isCurrent(level, sel, t);

  const go = (d) => setSelected(dateKey(d));

  return (
    <div className="screen">
      <div className="pad col gap-14">
        <div className="hd">
          <div className="hd-eyebrow">
            {sel.getFullYear()} · {ROMAN[quarterIndex(sel)]} улирал
          </div>
          <div className="hd-right">
            <SearchButton />
            <div style={{ textAlign: 'right' }}>
              <div className="hd-stat">{period.total ? `${period.pct}%` : '—'}</div>
              <div className="hd-sub">{PERIOD_LABEL[level]}</div>
            </div>
          </div>
        </div>

        <div className="nav-row">
          <button className="nav-btn" onClick={() => go(shift(level, sel, -1))} aria-label="Өмнөх">
            ‹
          </button>
          <div className="hd-title nav-title">{periodTitle(level, sel)}</div>
          <button className="nav-btn" onClick={() => go(shift(level, sel, 1))} aria-label="Дараах">
            ›
          </button>
          {!atToday && (
            <button className="today-chip" onClick={() => go(t)}>
              Өнөөдөр
            </button>
          )}
        </div>

        <div className="seg">
          {LEVELS.map(([id, name]) => (
            <button key={id} className={`seg-btn${level === id ? ' is-on' : ''}`} onClick={() => setLevel(id)}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {level === 'year' && <YearView sel={sel} go={go} setLevel={setLevel} progressFor={progressFor} />}
      {level === 'quarter' && <QuarterView sel={sel} go={go} setLevel={setLevel} progressFor={progressFor} />}
      {level === 'month' && <MonthView sel={sel} t={t} selected={selected} go={go} progress={progress} tasksOn={tasksOn} />}
      {level === 'week' && <WeekView sel={sel} selected={selected} go={go} tasksOn={tasksOn} />}

      <div className="pad col gap-9">
        <div className="list-hd">
          <h2>{dayTitle(sel)}</h2>
          <ListActions
            status={`${doneCount}/${tasks.length} дууссан`}
            selecting={selection.active}
            onStart={() => startSelect()}
            onStop={stopSelect}
            onBulk={() => setBulkOpen(true)}
          />
        </div>
        {tasks.length === 0 ? (
          <div className="empty">Энэ өдөр ажил алга. + товчоор нэмнэ үү.</div>
        ) : (
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              goal={goalById(task.goalId)}
              onToggle={toggleTask}
              onOpen={onOpenTask}
              selecting={selection.active}
              picked={selection.ids.includes(task.id)}
              onPick={toggleSelect}
            />
          ))
        )}
      </div>

      {selection.active && (
        <SelectionBar
          count={selection.ids.length}
          total={tasks.length}
          onAll={() => selectMany(tasks.map((t) => t.id))}
          onNone={() => selectMany([])}
          onDelete={() => deleteMany(selection.ids)}
        />
      )}

      {bulkOpen && <BulkSheet date={sel} onClose={() => setBulkOpen(false)} />}
    </div>
  );
}

function YearView({ sel, go, setLevel, progressFor }) {
  const now = today();
  return (
    <div className="pad months">
      {MONTHS_SHORT.map((name, i) => {
        const d = new Date(sel.getFullYear(), i, 1);
        const p = progressFor('month', d);
        const cur = i === now.getMonth() && sel.getFullYear() === now.getFullYear();
        return (
          <button
            key={name}
            className={`mcard${cur ? ' is-cur' : ''}`}
            onClick={() => {
              go(d);
              setLevel('month');
            }}
          >
            <div className="mcard-name">{name}</div>
            <div className="mcard-pct">{p.total ? `${p.pct}%` : '—'}</div>
            <div className="track">
              <i style={{ width: `${p.pct}%` }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function QuarterView({ sel, go, setLevel, progressFor }) {
  const { goalFor } = usePlanner();
  const first = quarterIndex(sel) * 3;
  return (
    <div className="pad col" style={{ gap: 10 }}>
      {[0, 1, 2].map((k) => {
        const d = new Date(sel.getFullYear(), first + k, 1);
        const p = progressFor('month', d);
        const goal = goalFor('month', d);
        return (
          <button
            key={k}
            className="qrow"
            onClick={() => {
              go(d);
              setLevel('month');
            }}
          >
            <div
              className="ring"
              style={{ background: `conic-gradient(var(--accent) ${p.pct}%, var(--soft) 0)` }}
            >
              <span>{p.total ? `${p.pct}%` : '—'}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="qrow-name">{MONTHS_SHORT[d.getMonth()]}</div>
              <div className="qrow-goal">{goal ? goal.title : 'Зорилго тодорхойлоогүй'}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MonthView({ sel, t, selected, go, progress, tasksOn }) {
  const cells = monthGrid(sel);
  return (
    <div className="pad">
      <div className="dows">
        {DOW_SHORT.map((d) => (
          <div key={d} className="dow">
            {d}
          </div>
        ))}
      </div>
      <div className="grid">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} className="cell is-empty" />;
          const list = tasksOn(d);
          const p = progress(d, d);
          const isSel = dateKey(d) === selected;
          const isToday = dateKey(d) === dateKey(t);
          const past = d < t;
          return (
            <button
              key={dateKey(d)}
              className={`cell${isSel ? ' is-sel' : ''}${isToday ? ' is-today' : ''}${list.length ? '' : ' is-idle'}`}
              onClick={() => go(d)}
            >
              <span className="cell-n">{d.getDate()}</span>
              <span className="cell-track" style={{ opacity: list.length ? 1 : 0 }}>
                <i
                  style={{
                    width: `${p.pct}%`,
                    background: isSel ? '#fff' : past ? 'var(--green)' : 'var(--amber)'
                  }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ sel, selected, go, tasksOn }) {
  return (
    <div className="pad week">
      {weekDays(sel).map((d, i) => {
        const list = tasksOn(d);
        const done = list.filter((x) => x.done).length;
        const isSel = dateKey(d) === selected;
        return (
          <button key={dateKey(d)} className={`wcell${isSel ? ' is-sel' : ''}`} onClick={() => go(d)}>
            <div className="wcell-dow">{DOW_SHORT[i]}</div>
            <div className="wcell-n">{d.getDate()}</div>
            <div className="wcell-count">{list.length ? `${done}/${list.length}` : '—'}</div>
          </button>
        );
      })}
    </div>
  );
}
