// Огноотой ажиллах туслах функцууд. 7 хоног Даваагаар эхэлнэ.

export const MONTHS_SHORT = Array.from({ length: 12 }, (_, i) => `${i + 1}-р сар`);
export const DOW_SHORT = ['Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя', 'Ня'];
export const DOW_FULL = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням'];
export const ROMAN = ['I', 'II', 'III', 'IV'];

export const pad = (n) => String(n).padStart(2, '0');

export function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Даваа = 0 ... Ням = 6 */
export const dowIndex = (d) => (d.getDay() + 6) % 7;

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfWeek(d) {
  return addDays(d, -dowIndex(d));
}

export function endOfWeek(d) {
  return addDays(startOfWeek(d), 6);
}

export const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

export const quarterIndex = (d) => Math.floor(d.getMonth() / 3);
export const startOfQuarter = (d) => new Date(d.getFullYear(), quarterIndex(d) * 3, 1);
export const endOfQuarter = (d) => new Date(d.getFullYear(), quarterIndex(d) * 3 + 3, 0);
export const startOfYear = (d) => new Date(d.getFullYear(), 0, 1);
export const endOfYear = (d) => new Date(d.getFullYear(), 11, 31);

/** ISO 7 хоногийн дугаар, мөн тухайн 7 хоног харьяалагдах он */
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

export const yearKey = (d) => String(d.getFullYear());
export const quarterKey = (d) => `${d.getFullYear()}-Q${quarterIndex(d) + 1}`;
export const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
export function weekKey(d) {
  const { week, year } = isoWeek(d);
  return `${year}-W${pad(week)}`;
}

export function scopeKey(scope, d) {
  if (scope === 'year') return yearKey(d);
  if (scope === 'quarter') return quarterKey(d);
  if (scope === 'month') return monthKey(d);
  return weekKey(d);
}

export function scopeRange(scope, d) {
  if (scope === 'year') return [startOfYear(d), endOfYear(d)];
  if (scope === 'quarter') return [startOfQuarter(d), endOfQuarter(d)];
  if (scope === 'month') return [startOfMonth(d), endOfMonth(d)];
  if (scope === 'week') return [startOfWeek(d), endOfWeek(d)];
  return [d, d];
}

export const SCOPE_LABEL = {
  year: 'Жил',
  quarter: 'Улирал',
  month: 'Сар',
  week: '7 хоног',
  day: 'Өдөр'
};

export function scopeTitle(scope, d) {
  if (scope === 'year') return `Жил · ${d.getFullYear()}`;
  if (scope === 'quarter') return `${ROMAN[quarterIndex(d)]} улирал`;
  if (scope === 'month') return MONTHS_SHORT[d.getMonth()];
  if (scope === 'week') return `${isoWeek(d).week} дугаар 7 хоног`;
  return dayTitle(d);
}

export function dayTitle(d) {
  return `${d.getMonth() + 1}/${d.getDate()} · ${DOW_FULL[dowIndex(d)]}`;
}

/** Сарын нүднүүд — Даваагаар эхэлсэн, 7-ийн үржвэр урттай массив (null = хоосон нүд) */
export function monthGrid(d) {
  const first = startOfMonth(d);
  const lead = dowIndex(first);
  const days = endOfMonth(d).getDate();
  const cells = Math.ceil((lead + days) / 7) * 7;
  return Array.from({ length: cells }, (_, i) => {
    const n = i - lead + 1;
    return n >= 1 && n <= days ? new Date(d.getFullYear(), d.getMonth(), n) : null;
  });
}

export function weekDays(d) {
  const s = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
}

export const sameDay = (a, b) => dateKey(a) === dateKey(b);

/** [from, to] хоорондын өдрүүд (хоёуланг оруулаад). */
export function eachDay(from, to) {
  const out = [];
  const end = dateKey(to);
  let cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  let guard = 0;
  while (dateKey(cur) <= end && guard++ < 800) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

/** "14:30" → 870 минут. Цаггүй бол null. */
export function minutesOf(time) {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
