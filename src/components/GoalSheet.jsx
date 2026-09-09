import { useState } from 'react';
import { usePlanner } from '../lib/store.jsx';
import { SCOPE_LABEL, scopeKey, scopeTitle } from '../lib/date.js';

/** Түвшний зорилго засах доод хуудас. */
export default function GoalSheet({ goal, scope, date, onClose }) {
  const { saveGoal } = usePlanner();
  const [title, setTitle] = useState(goal?.title ?? '');
  const [items, setItems] = useState((goal?.items ?? []).join('\n'));

  function submit(e) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    saveGoal({
      id: goal?.id ?? null,
      scope,
      key: scopeKey(scope, date),
      title: t,
      items: items
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    });
    onClose();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>
          {SCOPE_LABEL[scope]} · {scopeTitle(scope, date)}
        </h2>

        <div className="field">
          <label htmlFor="g-title">Зорилго</label>
          <input
            id="g-title"
            type="text"
            value={title}
            autoFocus
            placeholder="Жишээ нь: Beta хувилбар гаргах"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="g-items">Дэд алхмууд (мөр бүрд нэг)</label>
          <textarea id="g-items" rows={4} value={items} onChange={(e) => setItems(e.target.value)} />
        </div>

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
