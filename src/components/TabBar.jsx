const TABS = [
  {
    id: 'calendar',
    label: 'Хуанли',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    )
  },
  {
    id: 'hierarchy',
    label: 'Шатлал',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="6" cy="6" r="2.4" />
        <circle cx="6" cy="18" r="2.4" />
        <path d="M6 8.4v7.2M10 6h9M10 18h9M10 12h6" />
      </svg>
    )
  },
  {
    id: 'day',
    label: 'Өдөр',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    )
  }
];

export default function TabBar({ tab, onChange, dark = false }) {
  return (
    <nav className={`tabbar${dark ? ' dark' : ''}`}>
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab${tab === t.id ? ' is-on' : ''}`}
          onClick={() => onChange(t.id)}
          aria-current={tab === t.id}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </nav>
  );
}
