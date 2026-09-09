import { useState } from 'react';
import { usePlanner } from '../lib/store.jsx';
import TaskRow from '../components/TaskRow.jsx';
import GoalSheet from '../components/GoalSheet.jsx';
import { DOW_FULL, dowIndex, scopeTitle } from '../lib/date.js';

const CHAIN = [
  { scope: 'year', accent: 'var(--amber)' },
  { scope: 'quarter', accent: 'var(--amber)' },
  { scope: 'month', accent: 'var(--accent)' },
  { scope: 'week', accent: 'var(--green)' }
];

export default function HierarchyScreen({ onOpenTask }) {
  const { selected, selectedDate, tasksOn, progressFor, goalFor, goalById, toggleTask } = usePlanner();
  const [open, setOpen] = useState(2);
  const [editing, setEditing] = useState(null);

  const sel = selectedDate;
  const tasks = tasksOn(selected);
  const done = tasks.filter((t) => t.done).length;

  return (
    <div className="screen" style={{ gap: 14 }}>
      <div className="pad">
        <div className="hd-eyebrow">Шатлал</div>
        <div className="hd-title sm">
          {DOW_FULL[dowIndex(sel)]}, {sel.getMonth() + 1}/{sel.getDate()} — яагаад чухал вэ
        </div>
      </div>

      <div className="pad col">
        {CHAIN.map((c, i) => {
          const goal = goalFor(c.scope, sel);
          const p = progressFor(c.scope, sel);
          const isOpen = i === open;
          return (
            <div className="chain-row" key={c.scope}>
              <div className="rail">
                <div
                  className="rail-dot"
                  style={{ background: isOpen ? c.accent : '#fff', border: `2px solid ${c.accent}` }}
                />
                <div className={`rail-line${i === CHAIN.length - 1 ? ' last' : ''}`} />
              </div>

              <div className={`ccard${isOpen ? ' is-open' : ''}`}>
                <button style={{ width: '100%', textAlign: 'left' }} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <div className="ccard-hd">
                    <div className="ccard-scope">{scopeTitle(c.scope, sel)}</div>
                    <div className="ccard-pct" style={{ color: c.accent }}>
                      {p.total ? `${p.pct}%` : '—'}
                    </div>
                  </div>
                  <div className={`ccard-goal${goal ? '' : ' is-empty-goal'}`}>
                    {goal ? goal.title : 'Зорилго тодорхойлоогүй'}
                  </div>
                  <div className="ccard-bar">
                    <i style={{ width: `${p.pct}%`, background: c.accent }} />
                  </div>
                </button>

                {isOpen && (
                  <>
                    {goal?.items?.length > 0 && (
                      <div className="ccard-items">
                        {goal.items.map((it, k) => (
                          <div className="ccard-item" key={k}>
                            <i />
                            {it}
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <button
                        className="ccard-edit"
                        onClick={() => setEditing({ scope: c.scope, goal: goalFor(c.scope, sel) })}
                      >
                        {goal ? 'Зорилго засах' : 'Зорилго нэмэх'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pad col gap-9">
        <div className="list-hd">
          <h2>Өнөөдрийн ажил</h2>
          <span>
            {done}/{tasks.length}
          </span>
        </div>
        {tasks.length === 0 ? (
          <div className="empty">Энэ өдөр ажил алга.</div>
        ) : (
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              goal={goalById(task.goalId)}
              variant="pill"
              onToggle={toggleTask}
              onOpen={onOpenTask}
            />
          ))
        )}
      </div>

      {editing && (
        <GoalSheet goal={editing.goal} scope={editing.scope} date={sel} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
