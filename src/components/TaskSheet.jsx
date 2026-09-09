import { useState } from 'react';
import { usePlanner } from '../lib/store.jsx';
import { SCOPE_LABEL, parseKey } from '../lib/date.js';

const SCOPES = ['year', 'quarter', 'month', 'week'];

/** Ажил нэмэх / засах доод хуудас. */
export default function TaskSheet({ task, defaultDate, dark = false, onClose }) {
  const { saveTask, deleteTask, goalFor } = usePlanner();
  const [form, setForm] = useState(() => ({
    id: task?.id ?? null,
    title: task?.title ?? '',
    note: task?.note ?? '',
    date: task?.date ?? defaultDate,
    time: task?.time ?? '',
    goalId: task?.goalId ?? '',
    habit: task?.habit ?? false,
    done: task?.done ?? false
  }));

  const d = parseKey(form.date);
  const goalOptions = SCOPES.map((s) => goalFor(s, d)).filter(Boolean);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  function submit(e) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    saveTask({ ...form, title, note: form.note.trim(), time: form.time || null, goalId: form.goalId || null });
    onClose();
  }

  function remove() {
    if (form.id) deleteTask(form.id);
    onClose();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className={`sheet${dark ? ' dark' : ''}`} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{form.id ? 'Ажил засах' : 'Шинэ ажил'}</h2>

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
            <label htmlFor="t-date">Огноо</label>
            <input id="t-date" type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="t-time">Цаг</label>
            <input id="t-time" type="time" value={form.time} onChange={(e) => set({ time: e.target.value })} />
          </div>
        </div>

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

        <label className="check">
          <input type="checkbox" checked={form.habit} onChange={(e) => set({ habit: e.target.checked })} />
          Зуршил (өдөр бүр давтагдана)
        </label>

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
