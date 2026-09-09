import { SCOPE_LABEL } from '../lib/date.js';

/**
 * Ажлын нэг мөр. Нүдэн дээр дарвал гүйцэтгэл солигдоно,
 * бусад хэсэгт дарвал засварын хуудас нээгдэнэ.
 */
export default function TaskRow({ task, goal, variant = 'tag', dark = false, onToggle, onOpen }) {
  const meta = [task.time, task.note].filter(Boolean).join(' · ');

  return (
    <div className={`task${variant === 'pill' ? ' center' : ''}`}>
      <button
        className={`box${task.done ? ' is-done' : ''}${dark ? ' dark' : ''}`}
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? 'Дуусаагүй болгох' : 'Дууссан болгох'}
        aria-pressed={task.done}
      >
        {task.done ? '✓' : ''}
      </button>

      <button className="t-body" onClick={() => onOpen(task)}>
        <div className={`t-title${task.done ? ' is-done' : ''}${dark ? ' dark' : ''}`}>{task.title}</div>
        {variant === 'tag' ? (
          <div className="t-meta-row">
            {meta && <span className="t-meta">{meta}</span>}
            {goal && <span className="tag">{`${SCOPE_LABEL[goal.scope]}: ${goal.title}`}</span>}
            {task.habit && !goal && <span className="tag">Зуршил</span>}
          </div>
        ) : (
          meta && <div className="t-meta" style={{ marginTop: 4 }}>{meta}</div>
        )}
      </button>

      {variant === 'pill' && <span className="pill">{goal ? SCOPE_LABEL[goal.scope] : 'Чөлөөт'}</span>}
    </div>
  );
}
