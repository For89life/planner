import { useCallback, useEffect, useRef, useState } from 'react';
import { PlannerProvider, usePlanner } from './lib/store.jsx';
import CalendarScreen from './screens/CalendarScreen.jsx';
import HierarchyScreen from './screens/HierarchyScreen.jsx';
import DayScreen from './screens/DayScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';
import TabBar from './components/TabBar.jsx';
import TaskSheet from './components/TaskSheet.jsx';
import HabitSheet from './components/HabitSheet.jsx';
import SearchSheet from './components/SearchSheet.jsx';
import Toast from './components/Toast.jsx';
import { darkAccent } from './lib/model.js';
import { dateKey, minutesOf } from './lib/date.js';
import { fire, loadFired, notifyState, saveFired } from './lib/notify.js';

/** Цаг тавьсан ажил дээр мэдэгдэл илгээх. */
function useReminders() {
  const { settings, tasksOn } = usePlanner();
  const tasksOnRef = useRef(tasksOn);
  tasksOnRef.current = tasksOn;

  useEffect(() => {
    if (!settings.notify || notifyState() !== 'granted') return undefined;
    const lead = Number(settings.notifyLead) || 0;
    let fired = loadFired();

    const tick = () => {
      const now = new Date();
      const dk = dateKey(now);
      const nowMin = now.getHours() * 60 + now.getMinutes();

      let changed = false;
      for (const k of Object.keys(fired)) {
        if (!k.startsWith(`${dk}|`)) {
          delete fired[k];
          changed = true;
        }
      }

      for (const t of tasksOnRef.current(dk)) {
        const m = minutesOf(t.time);
        if (m === null || t.done) continue;
        const key = `${dk}|${t.id}`;
        if (fired[key]) continue;
        if (nowMin >= m - lead && nowMin <= m + 10) {
          fired[key] = 1;
          changed = true;
          const left = m - nowMin;
          const body = left > 0 ? `${left} минутын дараа · ${t.time}` : `Одоо · ${t.time}`;
          fire(t.title, [body, t.note].filter(Boolean).join(' · '), key);
        }
      }
      if (changed) saveFired(fired);
    };

    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [settings.notify, settings.notifyLead]);
}

function Shell() {
  const { tab, setTab, settings, selected, selection, habitById, searchOpen, setSearchOpen, undo, runUndo, clearUndo } =
    usePlanner();
  const [sheet, setSheet] = useState(null); // { task } | null
  const [habitSheet, setHabitSheet] = useState(null); // { habit, date } | null

  const dark = settings.theme === 'dark' || tab === 'day';
  const fullDark = settings.theme === 'dark';

  useReminders();

  useEffect(() => {
    const accent = dark ? darkAccent(settings.accent) : settings.accent;
    document.documentElement.style.setProperty('--accent', accent);
  }, [settings.accent, dark]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#17161b' : '#f7f5f1');
    document.body.style.background = dark ? '#0f0e12' : '#e8e5df';
  }, [dark]);

  const openTask = useCallback(
    (task) => {
      if (task?.habitId) {
        const habit = habitById(task.habitId);
        if (habit) {
          setHabitSheet({ habit, date: task.date });
          return;
        }
      }
      setSheet({ task });
    },
    [habitById]
  );

  const openHabit = useCallback((habit) => setHabitSheet({ habit, date: null }), []);

  return (
    <div
      className={`app${dark ? ' is-dark' : ''}${fullDark ? ' theme-dark' : ''}${
        selection.active ? ' is-selecting' : ''
      }`}
    >
      {tab === 'calendar' && <CalendarScreen onOpenTask={openTask} />}
      {tab === 'hierarchy' && <HierarchyScreen onOpenTask={openTask} />}
      {tab === 'day' && <DayScreen onOpenTask={openTask} />}
      {tab === 'settings' && <SettingsScreen onEditHabit={openHabit} />}

      {!selection.active && tab !== 'settings' && (
        <button
          className={`fab${dark ? ' dark' : ''}`}
          onClick={() => setSheet({ task: null })}
          aria-label="Ажил нэмэх"
        >
          +
        </button>
      )}

      <TabBar tab={tab} onChange={setTab} dark={dark} />

      {undo && <Toast label={undo.label} dark={dark} onUndo={runUndo} onClose={clearUndo} />}

      {sheet && (
        <TaskSheet task={sheet.task} defaultDate={selected} dark={dark} onClose={() => setSheet(null)} />
      )}

      {habitSheet && (
        <HabitSheet
          habit={habitSheet.habit}
          date={habitSheet.date}
          dark={dark}
          onClose={() => setHabitSheet(null)}
        />
      )}

      {searchOpen && (
        <SearchSheet dark={dark} onClose={() => setSearchOpen(false)} onOpenHabit={openHabit} />
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
