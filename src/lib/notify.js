// Хөтчийн мэдэгдэл. Апп нээлттэй үед (эсвэл дэлгэц түгжээтэй ч таб амьд үед) ажиллана.

const FIRED_KEY = 'tulubluguu.notified';

export const notifySupported = () => typeof window !== 'undefined' && 'Notification' in window;

export function notifyState() {
  if (!notifySupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function askPermission() {
  if (!notifySupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export async function fire(title, body, tag) {
  if (notifyState() !== 'granted') return false;
  const opts = {
    body,
    tag,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    lang: 'mn',
    renotify: false
  };
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg?.showNotification) {
      await reg.showNotification(title, opts);
      return true;
    }
  } catch {
    /* service worker байхгүй — доорх аргаар үзнэ */
  }
  try {
    new Notification(title, opts);
    return true;
  } catch {
    return false;
  }
}

/* ---------- Нэг удаа илгээсэн эсэхийг санах ---------- */

export function loadFired() {
  try {
    return JSON.parse(localStorage.getItem(FIRED_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveFired(map) {
  try {
    localStorage.setItem(FIRED_KEY, JSON.stringify(map));
  } catch {
    /* орон зай дүүрсэн */
  }
}
