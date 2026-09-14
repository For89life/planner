import { useState } from 'react';
import { usePlanner } from '../lib/store.jsx';
import { DOW_SHORT, SCOPE_LABEL, dayTitle, parseKey } from '../lib/date.js';
import { RULES, occurrenceId } from '../lib/model.js';

const SCOPES = ['year', 'quarter', 'month', 'week'];

/** Зуршлын загвар засах хуудас. date өгсөн бол тухайн өдрийг алгасах боломжтой. */
export default function HabitSheet({ habit, date = null, dark = false, onClose }) {
  const { saveHabit, deleteHabit, deleteTask, goalFor } = usePlanner();
  const [form, setForm] = useState(() => ({
    id: habit.id,
    title: habit.title ?? '',
    note: habit.note ?? '',
    time: habit.time ?? '',
    rule: habit.rule ?? 'daily',
    days: habit.days ?? [],
    goalId: habit.goalId ?? '',
    from: habit.from,
    until: habit.until ?? ''
  }));

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleDay = (i) =>
    set({ days: form.days.includes(i) ? form.days.filter((x) => x !== i) : [...form.days, i] });

  const goalOptions = SCOPES.map((s) => goalFor(s, parseKey(form.from))).filter(Boolean);

  function submit(e) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    if (form.rule === 'days' && form.days.length === 0) return;
    saveHabit({
      ...habit,
      id: form.id,
      title,
      note: form.note.trim(),
      time: form.time || null,
      rule: form.rule,
      days: form.rule === 'days' ? [...form.days].sort((a, b) => a - b) : [],
      goalId: form.goalId || null,
      from: form.from,
      until: form.until || null
    });
    onClose();
  }

  function skipDay() {
    if (!date) return;
    deleteTask(occurrenceId(habit.id, date));
    onClose();
  }

  function removeHabit() {
    if (confirm(`«${habit.title}» зуршлыг бүх түүхтэй нь устгах уу?`)) {
      deleteHabit(habit.id);
      onClose();
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className={`sheet${dark ? ' dark' : ''}`} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Зуршил засах</h2>

        <div className="field">
          <label htmlFor="h-title">Гарчиг</label>
          <input id="h-title" type="text" value={form.title} autoFocus onChange={(e) => set({ title: e.target.value })} />
        </div>

        <div className="field">
          <label htmlFor="h-note">Тэмдэглэл</label>
          <input id="h-note" type="text" value={form.note} onChange={(e) => set({ note: e.target.value })} />
        </div>

        <div className="row2">
          <div className="field">
            <label htmlFor="h-time">Цаг</label>
            <input id="h-time" type="time" value={form.time} onChange={(e) => set({ time: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="h-rule">Давтамж</label>
            <select id="h-rule" value={form.rule} onChange={(e) => set({ rule: e.target.value })}>
              {RULES.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {form.rule === 'days' && (
          <div className="field">
            <label>Гарагууд</label>
            <div className="dow-pick">
              {DOW_SHORT.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  className={`dow-chip${form.days.includes(i) ? ' is-on' : ''}`}
                  onClick={() => toggleDay(i)}
                  aria-pressed={form.days.includes(i)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="row2">
          <div className="field">
            <label htmlFor="h-from">Эхэлсэн</label>
            <input id="h-from" type="date" value={form.from} onChange={(e) => set({ from: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="h-until">Дуусах (сонголт)</label>
            <input id="h-until" type="date" value={form.until} onChange={(e) => set({ until: e.target.value })} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="h-goal">Зорилготой холбох</label>
          <select id="h-goal" value={form.goalId} onChange={(e) => set({ goalId: e.target.value })}>
            <option value="">Холбоосгүй</option>
            {goalOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {SCOPE_LABEL[g.scope]}: {g.title}
              </option>
            ))}
          </select>
        </div>

        <div className="hint">Өөрчлөлт нь бүх өдөрт нэгэн зэрэг нөлөөлнө.</div>

        {date && (
          <button type="button" className="row-btn" onClick={skipDay}>
            {dayTitle(parseKey(date))} — энэ өдрийг алгасах
          </button>
        )}
        <button type="button" className="row-btn danger" onClick={removeHabit}>
          Зуршлыг бүрмөсөн устгах
        </button>

        <div className="sheet-actions">
          <button type="button" className="btn plain" onClick={onClose}>
            Болих
          </button>
          <button type="submit" className="btn primary">
            Хадгалах
          </button>
        </div>
      </form>
    </div>
  );
}
