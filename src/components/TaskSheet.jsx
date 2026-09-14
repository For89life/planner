import { useState } from 'react';
import { usePlanner } from '../lib/store.jsx';
import { DOW_SHORT, SCOPE_LABEL, dowIndex, parseKey } from '../lib/date.js';
import { RULES } from '../lib/model.js';

const SCOPES = ['year', 'quarter', 'month', 'week'];

/** Ажил нэмэх / засах доод хуудас. Давтамж сонгосон бол зуршил болж хадгалагдана. */
export default function TaskSheet({ task, defaultDate, dark = false, onClose }) {
  const { saveTask, deleteTask, saveHabit, goalFor } = usePlanner();
  const [form, setForm] = useState(() => ({
    id: task?.id ?? null,
    title: task?.title ?? '',
    note: task?.note ?? '',
    date: task?.date ?? defaultDate,
    time: task?.time ?? '',
    goalId: task?.goalId ?? '',
    done: task?.done ?? false
  }));
  const [rule, setRule] = useState('once');
  const [days, setDays] = useState(() => [dowIndex(parseKey(task?.date ?? defaultDate))]);

  const isNew = !form.id;
  const d = parseKey(form.date);
  const goalOptions = SCOPES.map((s) => goalFor(s, d)).filter(Boolean);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const toggleDay = (i) => setDays((xs) => (xs.includes(i) ? xs.filter((x) => x !== i) : [...xs, i]));

  function submit(e) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;

    if (isNew && rule !== 'once') {
      if (rule === 'days' && days.length === 0) return;
      saveHabit({
        title,
        note: form.note.trim(),
        time: form.time || null,
        rule,
        days: rule === 'days' ? [...days].sort((a, b) => a - b) : [],
        goalId: form.goalId || null,
        from: form.date,
        until: null,
        archived: false
      });
      onClose();
      return;
    }

    saveTask({
      ...form,
      title,
      note: form.note.trim(),
      time: form.time || null,
      goalId: form.goalId || null
    });
    onClose();
  }

  function remove() {
    if (form.id) deleteTask(form.id);
    onClose();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className={`sheet${dark ? ' dark' : ''}`} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{isNew ? 'Шинэ ажил' : 'Ажил засах'}</h2>

        <div className="field">
          <label htmlFor="t-title">Гарчиг</label>
          <input
            id="t-title"
            type="text"
            value={form.title}
            autoFocus
            placeholder="Жишээ нь: Багийн уулзалт"
            onChange={(e) => set({ title: e.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="t-note">Тэмдэглэл</label>
          <input
            id="t-note"
            type="text"
            value={form.note}
            placeholder="30 мин · Зум"
            onChange={(e) => set({ note: e.target.value })}
          />
        </div>

        <div className="row2">
          <div className="field">
            <label htmlFor="t-date">{rule === 'once' ? 'Огноо' : 'Эхлэх огноо'}</label>
            <input id="t-date" type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="t-time">Цаг</label>
            <input id="t-time" type="time" value={form.time} onChange={(e) => set({ time: e.target.value })} />
          </div>
        </div>

        {isNew && (
          <div className="field">
            <label htmlFor="t-rule">Давтамж</label>
            <select id="t-rule" value={rule} onChange={(e) => setRule(e.target.value)}>
              <option value="once">Нэг удаа</option>
              {RULES.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}

        {isNew && rule === 'days' && (
          <div className="field">
            <label>Гарагууд</label>
            <div className="dow-pick">
              {DOW_SHORT.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  className={`dow-chip${days.includes(i) ? ' is-on' : ''}`}
                  onClick={() => toggleDay(i)}
                  aria-pressed={days.includes(i)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="t-goal">Зорилготой холбох</label>
          <select id="t-goal" value={form.goalId} onChange={(e) => set({ goalId: e.target.value })}>
            <option value="">Холбоосгүй</option>
            {goalOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {SCOPE_LABEL[g.scope]}: {g.title}
              </option>
            ))}
          </select>
        </div>

        {isNew && rule !== 'once' && (
          <div className="hint">Давтагдах ажил «зуршил» болж хадгалагдана. Тохиргоо табаас удирдана.</div>
        )}

        <div className="sheet-actions">
          <button type="button" className="btn plain" onClick={onClose}>
            Болих
          </button>
          {form.id && (
            <button type="button" className="btn danger" onClick={remove}>
              Устгах
            </button>
          )}
          <button type="submit" className="btn primary">
            Хадгалах
          </button>
        </div>
      </form>
    </div>
  );
}
