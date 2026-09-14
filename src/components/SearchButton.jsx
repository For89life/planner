import { usePlanner } from '../lib/store.jsx';

/** Толгойн хайх товч. */
export default function SearchButton() {
  const { setSearchOpen } = usePlanner();
  return (
    <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Хайх" title="Хайх">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l4.5 4.5" />
      </svg>
    </button>
  );
}
