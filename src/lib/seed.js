// Анхны жишээ өгөгдөл — өнөөдрийн бодит огноонд тааруулж үүсгэнэ.
import { dateKey, dowIndex, startOfMonth, endOfMonth, today, scopeKey } from './date.js';

let n = 0;
export const uid = (p = 'id') => `${p}${Date.now().toString(36)}${(n++).toString(36)}`;

const FILLER = [
  ['Кодын хяналт', '45 мин'],
  ['Хэрэглэгчийн санал унших', '30 мин'],
  ['Дизайны тойм', '1 цаг'],
  ['Багийн товч уулзалт', '15 мин'],
  ['Баримт бичиг шинэчлэх', '40 мин'],
  ['Алдаа засах', '1.5 цаг'],
  ['Тестийн хамрах хүрээ', '1 цаг'],
  ['Долоо хоногийн тайлан', '30 мин']
];

/** Тогтвортой псевдо-санамсаргүй (ижил өдөр үргэлж ижил өгөгдөл өгнө) */
function rnd(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function buildSeed() {
  const t = today();

  const goals = [
    {
      id: 'g-year',
      scope: 'year',
      key: scopeKey('year', t),
      title: 'Эрүүл, бүтээлч жил',
      items: ['Эрүүл зуршил 4 сар дараалан', 'Шинэ бүтээгдэхүүн олон нийтэд', 'Сар бүр нэг ном']
    },
    {
      id: 'g-quarter',
      scope: 'quarter',
      key: scopeKey('quarter', t),
      title: 'Шинэ бүтээгдэхүүнийг гаргах',
      items: ['Архитектур батлах', 'Beta 200 хэрэглэгч', 'Түншийн 3 гэрээ']
    },
    {
      id: 'g-month',
      scope: 'month',
      key: scopeKey('month', t),
      title: 'Beta хувилбар гаргах',
      items: ['Бүртгэлийн урсгал бэлэн', 'Тестийн 20 хэрэглэгч', 'Дэмжлэгийн бичиг баримт']
    },
    {
      id: 'g-week',
      scope: 'week',
      key: scopeKey('week', t),
      title: 'Бүртгэлийн урсгалыг тестлэх',
      items: ['Бүртгэлийн дэлгэц шалгах', 'Алдааны мессеж цэгцлэх', 'Тестийн хэрэглэгч урих']
    }
  ];

  const tk = dateKey(t);
  const tasks = [
    { id: 'today-1', title: 'Өглөөний төлөвлөлт', note: 'Өдрийн 5 ажлыг эрэмбэлэх', date: tk, time: '07:30', done: true, goalId: 'g-week', habit: false },
    { id: 'today-2', title: 'Багийн уулзалт', note: '7 хоногийн ажлын тойм', date: tk, time: '09:00', done: true, goalId: 'g-week', habit: false },
    { id: 'today-3', title: 'Түншийн уулзалт', note: 'Зум · санал хүргэх', date: tk, time: '11:30', done: false, goalId: 'g-quarter', habit: false },
    { id: 'today-4', title: 'Beta урсгал тест', note: 'Гүн ажлын блок · 2 цаг', date: tk, time: '14:00', done: false, goalId: 'g-month', habit: false },
    { id: 'today-5', title: 'Бие бялдар', note: '30 минут', date: tk, time: '19:00', done: false, goalId: 'g-year', habit: true },
    { id: 'today-6', title: 'Англи хэл', note: '20 минут', date: tk, time: '20:00', done: false, goalId: 'g-year', habit: true },
    { id: 'today-7', title: 'Өдрийн дүгнэлт', note: 'Маргаашийн 3 ажлыг тэмдэглэх', date: tk, time: '21:30', done: false, goalId: 'g-week', habit: false }
  ];

  // Энэ сарын бусад өдрүүд
  const mEnd = endOfMonth(t).getDate();
  for (let day = 1; day <= mEnd; day++) {
    const d = new Date(t.getFullYear(), t.getMonth(), day);
    if (dateKey(d) === tk) continue;
    const dow = dowIndex(d);
    if (dow === 6) continue; // Ням амарна
    const past = d < t;
    const count = 1 + Math.floor(rnd(day) * 4); // 1..4
    for (let i = 0; i < count; i++) {
      const [title, note] = FILLER[(day * 3 + i) % FILLER.length];
      tasks.push({
        id: uid('t'),
        title,
        note,
        date: dateKey(d),
        time: `${String(8 + i * 3).padStart(2, '0')}:00`,
        done: past ? rnd(day * 10 + i) > 0.25 : false,
        goalId: i === 0 ? 'g-month' : null,
        habit: false
      });
    }
    // Өдөр бүрийн зуршил
    if (dow < 5) {
      tasks.push({
        id: uid('t'),
        title: 'Бие бялдар',
        note: '30 минут',
        date: dateKey(d),
        time: '19:00',
        done: past ? rnd(day * 7) > 0.2 : false,
        goalId: 'g-year',
        habit: true
      });
    }
  }

  // Өмнөх саруудын хөнгөн түүх — жилийн харагдацыг дүүргэнэ
  for (let m = 0; m < t.getMonth(); m++) {
    const first = startOfMonth(new Date(t.getFullYear(), m, 1));
    const last = endOfMonth(first).getDate();
    for (let day = 1; day <= last; day++) {
      const d = new Date(t.getFullYear(), m, day);
      const dow = dowIndex(d);
      if (dow !== 0 && dow !== 3) continue; // зөвхөн Даваа, Пүрэв
      for (let i = 0; i < 2; i++) {
        const [title, note] = FILLER[(m * 5 + day + i) % FILLER.length];
        tasks.push({
          id: uid('t'),
          title,
          note,
          date: dateKey(d),
          time: `${String(9 + i * 4).padStart(2, '0')}:00`,
          done: rnd(m * 100 + day + i) > 0.22,
          goalId: null,
          habit: false
        });
      }
    }
  }

  return { version: 1, goals, tasks, accent: 'oklch(0.55 0.11 250)' };
}
