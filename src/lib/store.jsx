import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buildSeed, uid } from './seed.js';
import { dateKey, parseKey, scopeKey, scopeRange, today } from './date.js';

const KEY = 'tulubluguu.v1';

const Ctx = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return buildSeed();
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !Array.isArray(data.tasks)) return buildSeed();
    return data;
  } catch {
    return buildSeed();
  }
}

export function PlannerProvider({ children }) {
  const [data, setData] = useState(load);
  const [tab, setTab] = useState('calendar');
  const [level, setLevel] = useState('month');
  const [selected, setSelected] = useState(() => dateKey(today()));
  const [selection, setSelection] = useState({ active: false, ids: [] });

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

  const toggleTask = useCallback((id) => {
    setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
  }, []);

  const saveTask = useCallback((task) => {
    setData((d) => {
      const exists = task.id && d.tasks.some((t) => t.id === task.id);
      if (exists) return { ...d, tasks: d.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t)) };
      return { ...d, tasks: [...d.tasks, { ...task, id: task.id || uid('t'), done: !!task.done }] };
    });
  }, []);

  const deleteTask = useCallback((id) => {
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
  }, []);

  /** Олон ажлыг нэг дор устгана. */
  const deleteMany = useCallback((ids) => {
    const set = new Set(ids);
    if (set.size === 0) return;
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => !set.has(t.id)) }));
    setSelection({ active: false, ids: [] });
  }, []);

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

  const saveGoal = useCallback((goal) => {
    setData((d) => {
      const exists = goal.id && d.goals.some((g) => g.id === goal.id);
      if (exists) return { ...d, goals: d.goals.map((g) => (g.id === goal.id ? { ...g, ...goal } : g)) };
      return { ...d, goals: [...d.goals, { ...goal, id: goal.id || uid('g') }] };
    });
  }, []);

  const setAccent = useCallback((accent) => setData((d) => ({ ...d, accent })), []);

  const reset = useCallback(() => setData(buildSeed()), []);

  const byDate = useMemo(() => {
    const map = new Map();
    for (const t of data.tasks) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date).push(t);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
    }
    return map;
  }, [data.tasks]);

  const tasksOn = useCallback((d) => byDate.get(typeof d === 'string' ? d : dateKey(d)) || [], [byDate]);

  /** [from, to] хугацааны гүйцэтгэл (өдрүүд оруулаад) */
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
      return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
    },
    [data.tasks]
  );

  const progressFor = useCallback((scope, d) => progress(...scopeRange(scope, d)), [progress]);

  /** Тухайн хугацаанд байгаа бүх ажил (устгах багцыг бүрдүүлэхэд) */
  const tasksInRange = useCallback(
    (from, to) => {
      const a = dateKey(from);
      const b = dateKey(to);
      return data.tasks.filter((t) => t.date >= a && t.date <= b);
    },
    [data.tasks]
  );

  const goalFor = useCallback(
    (scope, d) => data.goals.find((g) => g.scope === scope && g.key === scopeKey(scope, d)) || null,
    [data.goals]
  );

  const goalById = useCallback((id) => data.goals.find((g) => g.id === id) || null, [data.goals]);

  const value = {
    data,
    accent: data.accent,
    setAccent,
    tab,
    setTab,
    level,
    setLevel,
    selected,
    setSelected,
    selectedDate: parseKey(selected),
    toggleTask,
    saveTask,
    deleteTask,
    deleteMany,
    selection,
    startSelect,
    stopSelect,
    toggleSelect,
    selectMany,
    saveGoal,
    reset,
    tasksOn,
    tasksInRange,
    progress,
    progressFor,
    goalFor,
    goalById
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlanner() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlanner-ийг PlannerProvider дотор дуудна');
  return ctx;
}
