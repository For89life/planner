# Өгөгдлийн найдвартай байдал → бие даасан апп (төлөвлөгөө)

Зорилго: апп бүрэн хаалттай, сүлжээгүй үед ч өгөгдөл алдагдахгүй байх; цаашид
Windows / Android дээр бие даасан апп болгож гаргах.

## 0. Одоогийн эрсдэл

| Эрсдэл | Үр дагавар | Одоо хамгаалалт байгаа юу |
| --- | --- | --- |
| Хөтчийн «Clear browsing data» | Бүх өгөгдөл устана | ❌ |
| iOS дээр home screen-д суулгаагүй → ITP eviction | Origin бүхэлдээ устана | ❌ |
| Санах ой дүүрсэн үеийн eviction (LRU) | Origin бүхэлдээ устана | ❌ |
| `localStorage` 5MB хязгаар | Чимээгүй `catch` дотор алдана | ⚠️ алдааг залгидаг |
| Өөр төхөөрөмж / хөтөч | Өгөгдөл байхгүй | ❌ (export л бий) |
| Санамсаргүй «Бүгдийг цэвэрлэх» | 7 секундын дараа буцаах боломжгүй | ⚠️ зөвхөн undo toast |

WebKit-ийн бодлогоор eviction нь `localStorage`, IndexedDB, Cache API, Service Worker
бүгдэд хамаарна. Origin **persistent mode**-д байвал чөлөөлөгддөг ба home screen web app
эсэхийг гол шалгуур болгодог. Тиймээс дараах дараалал гарч ирнэ.

---

## Этап 1 — Storage adapter + IndexedDB

**Яагаад:** `localStorage`-г шууд дуудаж байгаа код нь Tauri/Capacitor руу шилжих замыг
хаадаг. Эхлээд ганцхан интерфэйс гаргаж, доор нь хэрэгжилтүүдийг сольдог болгоно.

**Шинэ файлууд**

```
src/lib/storage/
  index.js      // орчноо танин зөв adapter-ыг сонгоно
  idb.js        // IndexedDB (хөтөч) — үндсэн
  legacy.js     // localStorage-оос нэг удаагийн шилжилт
  backups.js    // snapshot-ын сан (Этап 3)
```

**Интерфэйс** (бүгд `Promise`):

```js
export async function loadState()            // → data | null
export async function saveState(data)        // debounce хийгдсэн
export async function storageInfo()          // { persisted, usage, quota, driver }
export async function requestPersist()       // → boolean
```

**IndexedDB бүтэц:** `tuluvluguu` DB → `state` store → `{ key: 'current', data }`.
Хамаарал нэмэхгүй, ~60 мөр цэвэр `indexedDB` код хангалттай (эсвэл `idb-keyval`, 600B).

**`store.jsx`-д гарах өөрчлөлт**

- `useState(load)` → `useState(null)` + `useEffect` дотор `await loadState()`.
- Ачаалж дуустал богино splash (лого + spinner) — «хоосон өдөр» анивчихаас сэргийлнэ.
- Хадгалалт: одоогийн `useEffect([data])` дотор `saveState(data)` — 400ms debounce.
- Бичилт амжилтгүй бол чимээгүй өнгөрөхөө болиод `saveError` төлөв болгож,
  дэлгэц дээр улаан зурвас гаргана (одоо `catch {}` дотор алга болдог).

**Шилжилт:** анх ачаалахад IDB хоосон бөгөөд `localStorage['tulubluguu.v1']` байвал
уншаад IDB рүү бичнэ. `localStorage`-г **устгахгүй**, хөлдөөсөн нөөц болгон үлдээнэ
(«v0.2 хүртэлх нөөц» гэж Тохиргоонд харуулна).

**Эрсдэл:** private горимд IndexedDB хаалттай байж болно → `idb.js` алдаа өгвөл
`localStorage` руу автоматаар унана (`driver: 'local'` гэж мэдээлнэ).

**Хугацаа:** ~3 цаг. **Хэрэглэгчид харагдах өөрчлөлт:** бараг байхгүй (splash л нэмэгдэнэ).

---

## Этап 2 — Persistent mode + суулгах урилга

**Зорилго:** eviction-оос чөлөөлөгдөх. Энэ бол iOS дээрх гол хамгаалалт.

1. Анх ачаалахад (эсвэл Тохиргооноос) `navigator.storage.persist()` дуудна.
   Chrome суулгасан апп дээр автоматаар, WebKit home-screen апп дээр зөвшөөрөгддөг.
2. Тохиргоо табд **«Хадгалалтын байдал»** карт:
   - `persisted: true/false` → «Хамгаалагдсан» / «Хамгаалагдаагүй» гэсэн тодорхой бичиг
   - `navigator.storage.estimate()` → ашигласан / нийт
   - Хамгаалагдаагүй бол «Хамгаалалт асаах» товч (`persist()` дахин дуудна)
3. **Суулгах урилга:**
   - Android/Chrome: `beforeinstallprompt` event-ийг барьж хадгалаад «Утсандаа суулгах»
     товч гаргана.
   - iOS Safari: event байхгүй тул «Хуваалцах → Дэлгэцэнд нэмэх» гэсэн 2 мөр заавар
     (зөвхөн `standalone` биш үед харуулна).
   - `display-mode: standalone` бол энэ бүх хэсгийг нуух.

**Хугацаа:** ~2 цаг.

---

## Этап 3 — Автомат нөөц (буруу устгалт, eviction-ы эсрэг)

1. **Дотоод snapshot.** IDB-д `backups` store. Өдөрт нэг удаа (эхний ачаалалт дээр)
   өмнөх төлөвийг хуулж, сүүлийн **7**-г үлдээнэ. Тохиргоонд жагсаалт + огноо + хэмжээ +
   «Энэ хувилбар руу буцаах» (одоогийн undo toast-той адил, гэхдээ 7 хоног ухрах боломжтой).
2. **Гадаад файл руу автомат бичилт** (File System Access API — Windows/Android Chrome):
   - Хэрэглэгч нэг удаа файл сонгоно → `FileSystemFileHandle`-ыг IDB-д хадгална.
   - Ачаалах бүрд `queryPermission()`, хэрэгтэй бол `requestPermission()`.
   - Өдөрт нэг удаа (эсвэл 20 өөрчлөлт тутамд) чимээгүй бичнэ.
   - Энэ нь **хөтчөөс гадуурх жинхэнэ файл** — цорын ганц бүрэн баталгаа.
   - Safari/iOS дэмжихгүй → тэнд гар export үлдэнэ.
3. **Сануулах:** 7 хоног export/нөөц хийгээгүй бол Тохиргоо табд шар анхааруулга.

**Өгөгдлийн бүтцэд нэмэгдэх зүйл:** `settings.autoBackup`, `settings.lastBackupAt`.
Schema хувилбар өсгөх шаардлагагүй — `migrate()` дотор default утга нэмэхэд хангалттай.

**Хугацаа:** ~4 цаг.

---

## Этап 4 — Бие даасан апп (сонголт)

Этап 1 хийгдсэн бол энд ирээд ердөө **нэг adapter** бичихэд болно.

### Tauri 2 (санал болгож буй)

```
src-tauri/           # Rust тал
src/lib/storage/native.js   # plugin-fs ашиглана
```

- `npm create tauri-app` эсвэл байгаа төсөлд `npm i -D @tauri-apps/cli` + `tauri init`.
- `tauri.conf.json` → `frontendDist: "../dist"`, `devUrl: "http://localhost:5173"`.
- `@tauri-apps/plugin-fs`-ээр `appDataDir()/tuluvluguu.json` уншиж/бичнэ.
  Windows дээр `%APPDATA%\tuluvluguu\`, Android дээр апп-ын data хавтас.
  Хөтчийн ямар ч цэвэрлэгээ энд хүрэхгүй.
- `index.js` дотор `window.__TAURI__` байгаа эсэхээр adapter сонгоно.
- Гаралт: `npm run tauri build` → `.exe` / `.msi`; `tauri android build` → `.apk`.
- **Шаардлага:** Rust toolchain + (Windows дээр) MSVC build tools. Android-д JDK + SDK + NDK.
  iOS-д Mac болон Apple Developer ($99/жил) — сүүлд нь үзэх.

### Capacitor (зөвхөн гар утас чухал бол)

- `npm i @capacitor/core @capacitor/cli && npx cap init && npx cap add android`
- Өгөгдлийг `@capacitor/filesystem` эсвэл SQLite plugin-аар.
- Rust хэрэггүй, Play Store-т гаргахад хялбар; desktop гарахгүй.

**Хугацаа:** Tauri desktop ~4 цаг (build орчин суулгах цаг тусад нь), Android ~1 өдөр.

---

## Санал болгож буй дараалал

1. **Этап 1** — adapter + IndexedDB *(үүнгүйгээр цаашдын бүх зам хаалттай)*
2. **Этап 2** — persist() + суулгах урилга *(хамгийн бага ажлаар хамгийн том үр дүн)*
3. **Этап 3** — автомат нөөц
4. **Этап 4** — Tauri (хэрэгцээ гарвал)

Этап 1–3 нийлээд ~1 өдрийн ажил, PWA хэвээр үлдэнэ, хэрэглэгч дахин юу ч хийхгүй.

## Тестийн чеклист (этап бүрийн дараа)

- [ ] Хуучин `localStorage` өгөгдөлтэй хэрэглэгч → бүх ажил, зуршил, тохиргоо бүтэн шилжсэн
- [ ] Шинэ хэрэглэгч → жишээ өгөгдөл үүсэж, дахин ачаалахад хэвээр
- [ ] Хөтөч хаагаад дахин нээх → хэвээр
- [ ] Сүлжээ таслаад дахин ачаалах (service worker) → хэвээр
- [ ] Private горим → унахгүй, `driver: 'local'` эсвэл санах ойд ажиллана
- [ ] IDB устгах (DevTools) → апп унахгүй, жишээ өгөгдөл рүү буцна
- [ ] Export → Import → өгөгдөл яг ижил (`JSON.stringify` харьцуулалт)
- [ ] Хоёр таб зэрэг нээх → сүүлд бичсэн нь дарж бичихгүй байх (шаардвал `storage` event)

## Хамрахгүй зүйл (одоохондоо)

- **Төхөөрөмж хооронд sync** — үүнд сервер (Supabase/Firebase) эсвэл файл хуваалцах
  шаардлагатай. Одоогийн шийдэл: export/import. Хэрэв хэрэгтэй бол тусад нь төлөвлөнө
  (offline-first + last-write-wins).
- **Апп хаалттай үеийн мэдэгдэл** — push сервер (VAPID) эсвэл native notification
  (Tauri/Capacitor) хэрэгтэй. Этап 4-ийн дараа native талаар шийдэгдэнэ.
