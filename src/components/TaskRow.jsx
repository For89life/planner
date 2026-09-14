import { SCOPE_LABEL } from '../lib/date.js';

/**
 * Ажлын нэг мөр.
 * Энгийн горимд: нүдэн дээр дарвал гүйцэтгэл солигдож, бусад хэсэгт дарвал засварын хуудас нээгдэнэ.
 * Сонголтын горимд: мөрийн аль ч хэсэгт дарвал устгах багцад нэмэгдэнэ.
 */
export default function TaskRow({
  task,
  goal,
  variant = 'tag',
  dark = false,
  onToggle,
  onOpen,
  selecting = false,
  picked = false,
  onPick
}) {
  const meta = [task.time, task.note].filter(Boolean).join(' · ');

  const body = (
    <>
      <div className={`t-title${task.done ? ' is-done' : ''}${dark ? ' dark' : ''}`}>{task.title}</div>
      {variant === 'tag' ? (
        <div className="t-meta-row">
          {meta && <span className="t-meta">{meta}</span>}
          {task.habit && <span className="tag soft">Зуршил</span>}
          {goal && <span className="tag">{`${SCOPE_LABEL[goal.scope]}: ${goal.title}`}</span>}
        </div>
      ) : (
        meta && (
          <div className="t-meta" style={{ marginTop: 4 }}>
            {meta}
          </div>
        )
      )}
    </>
  );

  if (selecting) {
    return (
      <button
        className={`task${variant === 'pill' ? ' center' : ''}${picked ? ' is-picked' : ''}`}
        onClick={() => onPick(task.id)}
        aria-pressed={picked}
      >
        <span className={`pickbox${picked ? ' is-on' : ''}${dark ? ' dark' : ''}`}>{picked ? '✓' : ''}</span>
        <span className="t-body">{body}</span>
      </button>
    );
  }

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
        {body}
      </button>

      {variant === 'pill' && <span className="pill">{goal ? SCOPE_LABEL[goal.scope] : 'Чөлөөт'}</span>}
    </div>
  );
}
