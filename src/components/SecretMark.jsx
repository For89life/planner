import { useEffect, useRef, useState } from 'react';

const HOLD_MS = 700;

/** Баруун дээд булангийн чимэг тэмдэг. Удаан дарвал нууц мессеж гарна. */
export default function SecretMark() {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const clear = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const start = () => {
    clear();
    timer.current = setTimeout(() => {
      timer.current = null;
      setOpen(true);
    }, HOLD_MS);
  };

  useEffect(() => clear, []);

  return (
    <>
      <button
        className="mark"
        aria-label="I6I"
        onPointerDown={start}
        onPointerUp={clear}
        onPointerLeave={clear}
        onPointerCancel={clear}
        onContextMenu={(e) => e.preventDefault()}
      >
        I6I
      </button>

      {open && (
        <div className="verse-backdrop" onClick={() => setOpen(false)}>
          <div className="verse">
            <p className="verse-text">
              Бос, гэрэлт.
              <br />
              Учир нь гэрэл чинь ирж,
              <br />
              ЭЗЭНий алдар чиний дээр мандаж байна.
            </p>
            <div className="verse-ref">ИСАИА 6:1</div>
          </div>
        </div>
      )}
    </>
  );
}
