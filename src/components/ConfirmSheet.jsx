/**
 * Баталгаажуулах доод хуудас.
 * Хөтчийн confirm() цонхыг орлоно — утсан дээр, ялангуяа home screen-ээс
 * нээсэн аппад хөтчийн цонх заримдаа огт гарахгүй, чимээгүй цуцлагддаг.
 */
export default function ConfirmSheet({
  title,
  message,
  confirmLabel = 'Устгах',
  danger = true,
  dark = false,
  onConfirm,
  onClose
}) {
  return (
    <div
      className="sheet-backdrop top"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className={`sheet${dark ? ' dark' : ''}`} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {message && <div className="hint">{message}</div>}

        <div className="sheet-actions">
          <button type="button" className="btn plain" onClick={onClose}>
            Болих
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'danger-solid' : 'primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
