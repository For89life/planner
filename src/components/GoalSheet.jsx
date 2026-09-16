import { useState } from 'react';
import { usePlanner } from '../lib/store.jsx';
import { SCOPE_LABEL, scopeKey, scopeTitle } from '../lib/date.js';

/**
 * Түвшний зорилго засах доод хуудас.
 * Зорилго заавал байх шаардлагагүй — гарчгийг хоосон орхиж хадгалбал устана.
 */
export default function GoalSheet({ goal, scope, date, onClose }) {
  const { saveGoal, deleteGoal } = usePlanner();
  const [title, setTitle] = useState(goal?.title ?? '');
  const [items, setItems] = useState((goal?.items ?? []).join('\n'));

  function submit(e) {
    e.preventDefault();
    const t = title.trim();

    // Хоосон гарчиг = зорилгогүй байх. Байсан бол устгана.
    if (!t) {
      if (goal?.id) deleteGoal(goal.id);
      onClose();
      return;
    }

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

  function remove() {
    if (goal?.id) deleteGoal(goal.id);
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
            placeholder="Хоосон орхиж болно"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="g-items">Дэд алхмууд (мөр бүрд нэг)</label>
          <textarea id="g-items" rows={4} value={items} onChange={(e) => setItems(e.target.value)} />
        </div>

        <div className="hint">
          Зорилго заавал байх шаардлагагүй. Гарчгийг хоосон орхиж хадгалбал энэ түвшний зорилго устаж,
          гүйцэтгэлийн хувь нь хэвээр тоологдоно.
        </div>

        <div className="sheet-actions">
          <button type="button" className="btn plain" onClick={onClose}>
            Болих
          </button>
          {goal?.id && (
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
