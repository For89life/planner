import { useEffect, useState } from 'react';
import { PlannerProvider, usePlanner } from './lib/store.jsx';
import CalendarScreen from './screens/CalendarScreen.jsx';
import HierarchyScreen from './screens/HierarchyScreen.jsx';
import DayScreen from './screens/DayScreen.jsx';
import TabBar from './components/TabBar.jsx';
import TaskSheet from './components/TaskSheet.jsx';

function Shell() {
  const { tab, setTab, accent, selected } = usePlanner();
  const [sheet, setSheet] = useState(null); // null | {task}
  const dark = tab === 'day';

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
  }, [accent]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#17161b' : '#f7f5f1');
    document.body.style.background = dark ? '#0f0e12' : '#e8e5df';
  }, [dark]);

  const openTask = (task) => setSheet({ task });

  return (
    <div className={`app${dark ? ' is-dark' : ''}`}>
      {tab === 'calendar' && <CalendarScreen onOpenTask={openTask} />}
      {tab === 'hierarchy' && <HierarchyScreen onOpenTask={openTask} />}
      {tab === 'day' && <DayScreen onOpenTask={openTask} />}

      <button
        className={`fab${dark ? ' dark' : ''}`}
        onClick={() => setSheet({ task: null })}
        aria-label="Ажил нэмэх"
      >
        +
      </button>

      <TabBar tab={tab} onChange={setTab} dark={dark} />

      {sheet && (
        <TaskSheet task={sheet.task} defaultDate={selected} dark={dark} onClose={() => setSheet(null)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <PlannerProvider>
      <Shell />
    </PlannerProvider>
  );
}
