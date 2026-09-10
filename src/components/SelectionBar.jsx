/** Сонголтын горимын доод самбар — бүгдийг сонгох, устгах. */
export default function SelectionBar({ count, total, dark = false, onAll, onNone, onDelete }) {
  const allPicked = total > 0 && count === total;

  return (
    <div className={`selbar${dark ? ' dark' : ''}`}>
      <button className="selbar-link" onClick={allPicked ? onNone : onAll} disabled={total === 0}>
        {allPicked ? 'Сонголт цуцлах' : 'Бүгдийг сонгох'}
      </button>
      <span className="selbar-count">{count} сонгосон</span>
      <button className="selbar-del" onClick={onDelete} disabled={count === 0}>
        Устгах
      </button>
    </div>
  );
}
