/** Жагсаалтын толгойн баруун тал — гүйцэтгэлийн тоо, сонгох горим, багцаар устгах. */
export default function ListActions({ status, selecting, onStart, onStop, onBulk }) {
  if (selecting) {
    return (
      <div className="list-actions">
        <button className="hd-act" onClick={onStop}>
          Болих
        </button>
      </div>
    );
  }

  return (
    <div className="list-actions">
      {status && <span>{status}</span>}
      <button className="hd-act" onClick={onStart}>
        Сонгох
      </button>
      <button className="hd-act icon" onClick={onBulk} aria-label="Багцаар устгах" title="Багцаар устгах">
        ⋯
      </button>
    </div>
  );
}
