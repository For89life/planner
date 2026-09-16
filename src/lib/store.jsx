import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildSeed } from './seed.js';
import { dateKey, eachDay, parseKey, scopeKey, scopeRange, today } from './date.js';
import {
  DEFAULT_SETTINGS,
  emptyData,
  habitMatches,
  habitStats,
  isOccurrenceId,
  logKey,
  migrate,
  occurrencesOn,
  parseOccurrenceId,
  uid
} from './model.js';

const KEY = 'tulubluguu.v1'; // түлхүүр хэвээр — дотор нь version талбар хувилбарыг зааж өгнө.

const Ctx = createContext(null);

/**
 * Анх нээхэд хоосон эхэлнэ — жишээ өгөгдөл автоматаар бөглөхгүй.
 * Жишээ өгөгдөл хэрэгтэй бол Тохиргоо → «Жишээ өгөгдлөөр сэргээх».
 */
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData();
    return migrate(JSON.parse(raw)) || emptyData();
  } catch {
    return emptyData();
  }
}

export function PlannerProvider({ children }) {
  const [data, setData] = useState(load);
  const dataRef = useRef(data);
  const [tab, setTab] = useState('calendar');
  const [level, setLevel] = useState('month');
  const [selected, setSelected] = useState(() => dateKey(today()));
  const [selection, setSelection] = useState({ active: false, ids: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [undo, setUndo] = useState(null); // { label, snapshot, id }
  const [todayKey, setTodayKey] = useState(() => dateKey(today()));
  const todayRef = useRef(todayKey);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  /**
   * Өдөр солигдохыг ажиглана. Апп (ялангуяа утсан дээрх PWA) олон хоног нээлттэй
   * байж болох тул «өнөөдөр» гэдгийг ачаалах үед нэг удаа тогтоовол шөнө дунд,
   * эсвэл шинэ жил гармагц хуучин өдөр дээр гацна.
   */
  useEffect(() => {
    const check = () => {
      const now = dateKey(today());
      const prev = todayRef.current;
      if (now === prev) return;
      todayRef.current = now;
      setTodayKey(now);
      // Хэрэглэгч өчигдрийг зориуд сонгоогүй, өнөөдөр дээр байсан бол хамт шилжинэ.
      setSelected((s) => (s === prev ? now : s));
    };
    const id = setInterval(check, 30000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, []);

  // Огноо эсвэл таб солигдвол сонголтын горимоос гарна
  useEffect(() => {
    setSelection({ active: false, ids: [] });
  }, [selected, tab]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* хадгалах орон зай дүүрсэн — чимээгүй өнгөрөөнө */
    }
  }, [data]);

  /**
   * Бүх өөрчлөлт энд дамжина. label өгсөн бол буцаах боломжтой болно.
   */
  const apply = useCallback((label, fn) => {
    const prev = dataRef.current;
    const next = fn(prev);
    if (!next || next === prev) return;
    dataRef.current = next;
    setData(next);
    if (label) setUndo({ label, snapshot: prev, id: Date.now() });
  }, []);

  const runUndo = useCallback(() => {
    setUndo((u) => {
      if (u) {
        dataRef.current = u.snapshot;
        setData(u.snapshot);
      }
      return null;
    });
  }, []);

  const clearUndo = useCallback(() => setUndo(null), []);

  /* ---------- Ажил ---------- */

  const toggleTask = useCallback(
    (id) => {
      const occ = parseOccurrenceId(id);
      if (occ) {
        apply(null, (d) => {
          const k = logKey(occ.habitId, occ.date);
          const log = { ...d.habitLog };
          if (log[k] === 'done') delete log[k];
          else log[k] = 'done';
          return { ...d, habitLog: log };
        });
        return;
      }
      apply(null, (d) => ({
        ...d,
        tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      }));
    },
    [apply]
  );

  const saveTask = useCallback(
    (task) => {
      const occ = parseOccurrenceId(task.id);
      if (occ) {
        // Зуршлын нэг өдрийн төлөв — зөвхөн дууссан эсэхийг хадгална
        apply(null, (d) => {
          const k = logKey(occ.habitId, occ.date);
          const log = { ...d.habitLog };
          if (task.done) log[k] = 'done';
          else delete log[k];
          return { ...d, habitLog: log };
        });
        return;
      }
      apply(null, (d) => {
        const exists = task.id && d.tasks.some((t) => t.id === task.id);
        if (exists) return { ...d, tasks: d.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t)) };
        return { ...d, tasks: [...d.tasks, { ...task, id: task.id || uid('t'), done: !!task.done }] };
      });
    },
    [apply]
  );

  const deleteTask = useCallback(
    (id) => {
      const occ = parseOccurrenceId(id);
      if (occ) {
        apply('Өдөр алгаслаа', (d) => ({
          ...d,
          habitLog: { ...d.habitLog, [logKey(occ.habitId, occ.date)]: 'skip' }
        }));
        return;
      }
      apply('Тэмдэглэл устгалаа', (d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
    },
    [apply]
  );

  /** Олон ажлыг нэг дор устгана (зуршил бол тухайн өдрийг алгасна). */
  const deleteMany = useCallback(
    (ids) => {
      const set = new Set(ids);
      if (set.size === 0) return;
      apply(`${set.size} тэмдэглэл устгалаа`, (d) => {
        const log = { ...d.habitLog };
        for (const id of set) {
          const occ = parseOccurrenceId(id);
          if (occ) log[logKey(occ.habitId, occ.date)] = 'skip';
        }
        return {
          ...d,
          tasks: d.tasks.filter((t) => !set.has(t.id)),
          habitLog: log
        };
      });
      setSelection({ active: false, ids: [] });
    },
    [apply]
  );

  /* ---------- Зуршил ---------- */

  const saveHabit = useCallback(
    (habit) => {
      apply(null, (d) => {
        const exists = habit.id && d.habits.some((h) => h.id === habit.id);
        if (exists) return { ...d, habits: d.habits.map((h) => (h.id === habit.id ? { ...h, ...habit } : h)) };
        return {
          ...d,
          habits: [
            ...d.habits,
            {
              rule: 'daily',
              days: [],
              note: '',
              time: null,
              goalId: null,
              until: null,
              archived: false,
              from: dateKey(today()),
              ...habit,
              id: habit.id || uid('h')
            }
          ]
        };
      });
    },
    [apply]
  );

  const deleteHabit = useCallback(
    (id) => {
      apply('Зуршил устгалаа', (d) => {
        const log = {};
        for (const [k, v] of Object.entries(d.habitLog)) {
          if (!k.startsWith(`${id}|`)) log[k] = v;
        }
        return { ...d, habits: d.habits.filter((h) => h.id !== id), habitLog: log };
      });
    },
    [apply]
  );

  /* ---------- Сонголтын горим ---------- */

  const startSelect = useCallback((id) => setSelection({ active: true, ids: id ? [id] : [] }), []);
  const stopSelect = useCallback(() => setSelection({ active: false, ids: [] }), []);
  const toggleSelect = useCallback(
    (id) =>
      setSelection((s) => ({
        active: true,
        ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id]
      })),
    []
  );
  const selectMany = useCallback((ids) => setSelection({ active: true, ids }), []);

  /* ---------- Зорилго, тохиргоо ---------- */

  const saveGoal = useCallback(
    (goal) => {
      apply(null, (d) => {
        const exists = goal.id && d.goals.some((g) => g.id === goal.id);
        if (exists) return { ...d, goals: d.goals.map((g) => (g.id === goal.id ? { ...g, ...goal } : g)) };
        return { ...d, goals: [...d.goals, { ...goal, id: goal.id || uid('g') }] };
      });
    },
    [apply]
  );

  /** Зорилгыг устгаж, түүнд холбогдсон ажил, зуршлын холбоосыг салгана. */
  const deleteGoal = useCallback(
    (id) => {
      if (!id) return;
      apply('Зорилго устгалаа', (d) => ({
        ...d,
        goals: d.goals.filter((g) => g.id !== id),
        tasks: d.tasks.map((t) => (t.goalId === id ? { ...t, goalId: null } : t)),
        habits: d.habits.map((h) => (h.goalId === id ? { ...h, goalId: null } : h))
      }));
    },
    [apply]
  );

  const setSettings = useCallback(
    (patch) => apply(null, (d) => ({ ...d, settings: { ...d.settings, ...patch } })),
    [apply]
  );

  const reset = useCallback(() => apply('Жишээ өгөгдлөөр сэргээлээ', () => buildSeed()), [apply]);

  const replaceAll = useCallback(
    (next, label = 'Өгөгдөл солилоо') => {
      const clean = migrate(next);
      if (!clean) return false;
      apply(label, () => clean);
      return true;
    },
    [apply]
  );

  /** Бүх ажил, зуршлыг устгана (зорилго, тохиргоо үлдэнэ). */
  const clearTasksAndHabits = useCallback(
    () =>
      apply('Бүх тэмдэглэл устгалаа', (d) => ({
        ...d,
        tasks: [],
        habits: [],
        habitLog: {}
      })),
    [apply]
  );

  const clearAll = useCallback(
    () =>
      apply('Бүх өгөгдлийг цэвэрлэлээ', (d) => ({
        ...d,
        tasks: [],
        goals: [],
        habits: [],
        habitLog: {}
      })),
    [apply]
  );

  /* ---------- Уншилт ---------- */

  const byDate = useMemo(() => {
    const map = new Map();
    for (const t of data.tasks) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date).push(t);
    }
    return map;
  }, [data.tasks]);

  const tasksOn = useCallback(
    (d) => {
      const dk = typeof d === 'string' ? d : dateKey(d);
      const date = typeof d === 'string' ? parseKey(d) : d;
      const list = [...(byDate.get(dk) || []), ...occurrencesOn(data.habits, data.habitLog, date, dk)];
      list.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
      return list;
    },
    [byDate, data.habits, data.habitLog]
  );

  /** [from, to] хугацааны гүйцэтгэл — ажил + зуршил */
  const progress = useCallback(
    (from, to) => {
      const a = dateKey(from);
      const b = dateKey(to);
      let done = 0;
      let total = 0;
      for (const t of data.tasks) {
        if (t.date >= a && t.date <= b) {
          total++;
          if (t.done) done++;
        }
      }
      // Зуршил ирээдүйн бүх өдөрт давтагддаг тул «нийт»-д оруулбал ирээдүйн сар
      // 0%, жилийн дүн худал бага болно. Тиймээс зуршлыг өнөөдрөөр тасална.
      // (Хэрэглэгчийн өөрөө оруулсан ирээдүйн ажил бол санаатай төлөвлөгөө тул хэвээр тоологдоно.)
      const end = b > todayKey ? parseKey(todayKey) : to;
      const h = habitStats(data.habits, data.habitLog, from, end);
      done += h.done;
      total += h.total;
      return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
    },
    [data.tasks, data.habits, data.habitLog, todayKey]
  );

  const progressFor = useCallback((scope, d) => progress(...scopeRange(scope, d)), [progress]);

  /** Тухайн хугацаанд байгаа бүх ажил (устгах багцыг бүрдүүлэхэд) */
  const tasksInRange = useCallback(
    (from, to) => {
      const a = dateKey(from);
      const b = dateKey(to);
      const out = data.tasks.filter((t) => t.date >= a && t.date <= b);
      for (const d of eachDay(from, to)) {
        out.push(...occurrencesOn(data.habits, data.habitLog, d));
      }
      return out;
    },
    [data.tasks, data.habits, data.habitLog]
  );

  const goalFor = useCallback(
    (scope, d) => data.goals.find((g) => g.scope === scope && g.key === scopeKey(scope, d)) || null,
    [data.goals]
  );

  const goalById = useCallback((id) => data.goals.find((g) => g.id === id) || null, [data.goals]);

  const habitById = useCallback((id) => data.habits.find((h) => h.id === id) || null, [data.habits]);

  /** Гарчиг, тэмдэглэлээр хайх — ажил + зуршил. */
  const search = useCallback(
    (q) => {
      const s = q.trim().toLowerCase();
      if (s.length < 2) return { tasks: [], habits: [] };
      const hit = (v) => (v || '').toLowerCase().includes(s);
      const tasks = data.tasks
        .filter((t) => hit(t.title) || hit(t.note))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 60);
      const habits = data.habits.filter((h) => hit(h.title) || hit(h.note));
      return { tasks, habits };
    },
    [data.tasks, data.habits]
  );

  const settings = data.settings || DEFAULT_SETTINGS;

  const value = {
    data,
    settings,
    setSettings,
    accent: settings.accent,
    tab,
    setTab,
    level,
    setLevel,
    selected,
    setSelected,
    selectedDate: parseKey(selected),
    todayKey,
    toggleTask,
    saveTask,
    deleteTask,
    deleteMany,
    saveHabit,
    deleteHabit,
    habitById,
    habitMatches,
    selection,
    startSelect,
    stopSelect,
    toggleSelect,
    selectMany,
    saveGoal,
    deleteGoal,
    reset,
    replaceAll,
    clearAll,
    clearTasksAndHabits,
    tasksOn,
    tasksInRange,
    progress,
    progressFor,
    goalFor,
    goalById,
    search,
    searchOpen,
    setSearchOpen,
    undo,
    runUndo,
    clearUndo,
    isOccurrenceId
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlanner() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlanner-ийг PlannerProvider дотор дуудна');
  return ctx;
}
