// Өгөгдлийн загвар: зуршлын давтамж, хувилбарын шилжилт, тохиргооны анхны утга.
import { DOW_SHORT, dateKey, dowIndex, eachDay } from './date.js';

export const SCHEMA_VERSION = 2;

export const ACCENTS = [
  { id: 'blue', name: 'Цэнхэр', light: 'oklch(0.55 0.11 250)', dark: 'oklch(0.72 0.12 250)' },
  { id: 'violet', name: 'Ягаан', light: 'oklch(0.55 0.14 300)', dark: 'oklch(0.72 0.13 300)' },
  { id: 'green', name: 'Ногоон', light: 'oklch(0.52 0.11 150)', dark: 'oklch(0.72 0.11 150)' },
  { id: 'amber', name: 'Улбар', light: 'oklch(0.58 0.11 65)', dark: 'oklch(0.75 0.12 75)' },
  { id: 'rose', name: 'Улаан', light: 'oklch(0.55 0.16 20)', dark: 'oklch(0.7 0.14 20)' },
  { id: 'teal', name: 'Ногоовтор', light: 'oklch(0.55 0.09 200)', dark: 'oklch(0.73 0.1 200)' }
];

export const DEFAULT_ACCENT = ACCENTS[0].light;

/** Гэрэлтэй өнгөнд тохирох бараан хувилбарыг олно. */
export function darkAccent(light) {
  return ACCENTS.find((a) => a.light === light)?.dark || light;
}

export const DEFAULT_SETTINGS = {
  accent: DEFAULT_ACCENT,
  theme: 'auto', // 'auto' = зөвхөн Өдөр таб бараан | 'dark' = бүх дэлгэц бараан
  notify: false,
  notifyLead: 10 // хэдэн минутын өмнө сануулах
};

/* ---------- Зуршил ---------- */

export const RULES = [
  ['daily', 'Өдөр бүр'],
  ['weekdays', 'Ажлын өдөр (Да–Ба)'],
  ['days', 'Сонгосон гараг']
];

export const HABIT_PREFIX = 'h:';

export const isOccurrenceId = (id) => typeof id === 'string' && id.startsWith(HABIT_PREFIX);
export const occurrenceId = (habitId, dk) => `${HABIT_PREFIX}${habitId}:${dk}`;
export const logKey = (habitId, dk) => `${habitId}|${dk}`;

export function parseOccurrenceId(id) {
  if (!isOccurrenceId(id)) return null;
  const rest = id.slice(HABIT_PREFIX.length);
  const i = rest.lastIndexOf(':');
  if (i < 0) return null;
  return { habitId: rest.slice(0, i), date: rest.slice(i + 1) };
}

/** Тухайн өдөр энэ зуршил гарах ёстой юу (алгассан эсэхийг тооцохгүй). */
export function habitMatches(habit, d, dk = dateKey(d)) {
  if (!habit || habit.archived) return false;
  if (habit.from && dk < habit.from) return false;
  if (habit.until && dk > habit.until) return false;
  const dow = dowIndex(d);
  if (habit.rule === 'daily') return true;
  if (habit.rule === 'weekdays') return dow < 5;
  return Array.isArray(habit.days) && habit.days.includes(dow);
}

/** Тухайн өдрийн зуршлууд — ажлын мөртэй ижил хэлбэрээр. */
export function occurrencesOn(habits, log, d, dk = dateKey(d)) {
  const out = [];
  for (const h of habits) {
    if (!habitMatches(h, d, dk)) continue;
    const state = log[logKey(h.id, dk)];
    if (state === 'skip') continue;
    out.push({
      id: occurrenceId(h.id, dk),
      habitId: h.id,
      title: h.title,
      note: h.note || '',
      date: dk,
      time: h.time || null,
      done: state === 'done',
      goalId: h.goalId || null,
      habit: true
    });
  }
  return out;
}

/** [from, to] хугацаанд гарах зуршлын тоо, дууссаны тоо. */
export function habitStats(habits, log, from, to) {
  let done = 0;
  let total = 0;
  if (habits.length === 0) return { done, total };
  for (const d of eachDay(from, to)) {
    const dk = dateKey(d);
    for (const h of habits) {
      if (!habitMatches(h, d, dk)) continue;
      const state = log[logKey(h.id, dk)];
      if (state === 'skip') continue;
      total++;
      if (state === 'done') done++;
    }
  }
  return { done, total };
}

export function habitSummary(h) {
  if (h.rule === 'daily') return 'Өдөр бүр';
  if (h.rule === 'weekdays') return 'Да–Ба';
  const days = [...(h.days || [])].sort((a, b) => a - b);
  return days.length ? days.map((i) => DOW_SHORT[i]).join(', ') : 'Гараг сонгоогүй';
}

/* ---------- Хувилбарын шилжилт ---------- */

let n = 0;
export const uid = (p = 'id') => `${p}${Date.now().toString(36)}${(n++).toString(36)}`;

/**
 * Хадгалсан өгөгдлийг одоогийн схем рүү аюулгүй шилжүүлнэ.
 * Танихгүй бол null буцаана (дуудагч нь жишээ өгөгдөл рүү буцна).
 */
export function migrate(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.tasks)) return null;
  let d = raw;

  if (d.version === 1) {
    const habits = [];
    const log = {};
    const byKey = new Map();
    const tasks = [];

    for (const t of d.tasks) {
      if (!t.habit) {
        const { habit, ...rest } = t;
        tasks.push(rest);
        continue;
      }
      const key = `${t.title}|${t.time || ''}`;
      let h = byKey.get(key);
      if (!h) {
        h = {
          id: uid('h'),
          title: t.title,
          note: t.note || '',
          time: t.time || null,
          rule: 'weekdays',
          days: [0, 1, 2, 3, 4],
          goalId: t.goalId || null,
          from: t.date,
          until: null,
          archived: false
        };
        byKey.set(key, h);
        habits.push(h);
      }
      if (t.date < h.from) h.from = t.date;
      if (t.done) log[logKey(h.id, t.date)] = 'done';
    }

    d = {
      version: 2,
      goals: Array.isArray(d.goals) ? d.goals : [],
      tasks,
      habits,
      habitLog: log,
      settings: { ...DEFAULT_SETTINGS, accent: d.accent || DEFAULT_ACCENT }
    };
  }

  if (d.version !== SCHEMA_VERSION) return null;

  return {
    version: SCHEMA_VERSION,
    goals: Array.isArray(d.goals) ? d.goals : [],
    tasks: Array.isArray(d.tasks) ? d.tasks : [],
    habits: Array.isArray(d.habits) ? d.habits : [],
    habitLog: d.habitLog && typeof d.habitLog === 'object' ? d.habitLog : {},
    settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) }
  };
}
