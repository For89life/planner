import { useEffect } from 'react';

/** Доод талын мэдэгдэл — сүүлийн үйлдлийг буцаах боломжтой. */
export default function Toast({ label, dark = false, onUndo, onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 7000);
    return () => clearTimeout(id);
  }, [label, onClose]);

  return (
    <div className={`toast${dark ? ' dark' : ''}`} role="status">
      <span className="toast-text">{label}</span>
      <button className="toast-undo" onClick={onUndo}>
        Буцаах
      </button>
    </div>
  );
}
