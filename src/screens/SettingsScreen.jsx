import { useEffect, useRef, useState } from 'react';
import { usePlanner } from '../lib/store.jsx';
import ConfirmSheet from '../components/ConfirmSheet.jsx';
import { ACCENTS, habitSummary } from '../lib/model.js';
import { askPermission, fire, notifyState } from '../lib/notify.js';
import { dateKey, today } from '../lib/date.js';

const LEADS = [0, 5, 10, 15, 30, 60];

export default function SettingsScreen({ onEditHabit }) {
  const { data, settings, setSettings, reset, replaceAll, clearAll, progressFor } = usePlanner();
  const [perm, setPerm] = useState(notifyState);
  const [msg, setMsg] = useState('');
  const [ask, setAsk] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(''), 4000);
    return () => clearTimeout(id);
  }, [msg]);

  const t = today();
  const year = progressFor('year', t);
  const bytes = (() => {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  })();

  async function toggleNotify(on) {
    if (!on) {
      setSettings({ notify: false });
      return;
    }
    const res = await askPermission();
    setPerm(res);
    if (res === 'granted') {
      setSettings({ notify: true });
      setMsg('Мэдэгдэл асаалаа.');
    } else if (res === 'denied') {
      setMsg('Хөтөч мэдэгдлийг хориглосон байна. Хаягийн мөрний түгжээ дүрсээс зөвшөөрнө үү.');
    } else {
      setMsg('Мэдэгдлийн зөвшөөрөл олгогдоогүй.');
    }
  }

  function exportJson() {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tuluvluguu-${dateKey(new Date())}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMsg('Файл татагдлаа.');
    } catch {
      setMsg('Татаж чадсангүй.');
    }
  }

  function importJson(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        setAsk({
          title: 'Файлаас сэргээх үү?',
          message: 'Одоогийн бүх өгөгдөл файлын өгөгдлөөр солигдоно. Буцаах боломжтой.',
          label: 'Сэргээх',
          danger: false,
          run: () => {
            const ok = replaceAll(parsed, 'Файлаас сэргээлээ');
            setMsg(ok ? 'Сэргээлээ.' : 'Файлын бүтэц таарахгүй байна.');
          }
        });
      } catch {
        setMsg('JSON файлыг уншиж чадсангүй.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="screen">
      <div className="pad hd">
        <div>
          <div className="hd-eyebrow">Тохиргоо</div>
          <div className="hd-title">Апп</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="hd-stat">{year.total ? `${year.pct}%` : '—'}</div>
          <div className="hd-sub">жилийн гүйцэтгэл</div>
        </div>
      </div>

      {/* ---------- Харагдац ---------- */}
      <div className="pad col gap-9">
        <div className="list-hd">
          <h2>Харагдац</h2>
        </div>

        <div className="card">
          <div className="card-label">Үндсэн өнгө</div>
          <div className="swatches">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                className={`swatch${settings.accent === a.light ? ' is-on' : ''}`}
                style={{ background: a.light }}
                onClick={() => setSettings({ accent: a.light })}
                aria-label={a.name}
                title={a.name}
              />
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-label">Горим</div>
          <div className="seg">
            <button
              className={`seg-btn${settings.theme === 'auto' ? ' is-on' : ''}`}
              onClick={() => setSettings({ theme: 'auto' })}
            >
              Авто
            </button>
            <button
              className={`seg-btn${settings.theme === 'dark' ? ' is-on' : ''}`}
              onClick={() => setSettings({ theme: 'dark' })}
            >
              Бүтэн бараан
            </button>
          </div>
          <div className="card-hint">Авто горимд зөвхөн «Өдөр» таб бараан харагдана.</div>
        </div>
      </div>

      {/* ---------- Сануулга ---------- */}
      <div className="pad col gap-9">
        <div className="list-hd">
          <h2>Сануулга</h2>
        </div>

        <div className="card">
          <label className="switch-row">
            <span>
              <span className="card-label">Хөтчийн мэдэгдэл</span>
              <span className="card-hint">Цаг тавьсан ажил дээр мэдэгдэл илгээнэ.</span>
            </span>
            <input
              type="checkbox"
              checked={!!settings.notify && perm === 'granted'}
              onChange={(e) => toggleNotify(e.target.checked)}
              disabled={perm === 'unsupported'}
            />
          </label>

          {perm === 'unsupported' && <div className="card-hint">Энэ хөтөч мэдэгдэл дэмжихгүй байна.</div>}
          {perm === 'denied' && <div className="card-hint">Хөтөч дээр мэдэгдэл хориглогдсон байна.</div>}

          {settings.notify && perm === 'granted' && (
            <>
              <div className="card-label" style={{ marginTop: 12 }}>
                Хэдэн минутын өмнө
              </div>
              <div className="seg">
                {LEADS.map((m) => (
                  <button
                    key={m}
                    className={`seg-btn${settings.notifyLead === m ? ' is-on' : ''}`}
                    onClick={() => setSettings({ notifyLead: m })}
                  >
                    {m === 0 ? 'Яг цагт' : `${m}′`}
                  </button>
                ))}
              </div>
              <button
                className="row-btn"
                style={{ marginTop: 12 }}
                onClick={() => fire('Төлөвлөгөө', 'Туршилтын мэдэгдэл — бүх зүйл ажиллаж байна.', 'test')}
              >
                Туршиж үзэх
              </button>
              <div className="card-hint">
                Апп нээлттэй (эсвэл арын табанд) үед ажиллана. Хаасан үед хөтөч мэдэгдэл илгээхгүй.
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---------- Зуршил ---------- */}
      <div className="pad col gap-9">
        <div className="list-hd">
          <h2>Зуршил</h2>
          <span>{data.habits.length}</span>
        </div>

        {data.habits.length === 0 ? (
          <div className="empty">Зуршил алга. + товчоор ажил нэмэхдээ давтамж сонгоно уу.</div>
        ) : (
          data.habits.map((h) => (
            <button key={h.id} className="task center" onClick={() => onEditHabit(h)}>
              <span className="t-body">
                <span className="t-title">{h.title}</span>
                <span className="t-meta-row">
                  <span className="t-meta">{[h.time, h.note].filter(Boolean).join(' · ') || 'Цаггүй'}</span>
                </span>
              </span>
              <span className="pill">{habitSummary(h)}</span>
            </button>
          ))
        )}
      </div>

      {/* ---------- Өгөгдөл ---------- */}
      <div className="pad col gap-9">
        <div className="list-hd">
          <h2>Өгөгдөл</h2>
          <span>{(bytes / 1024).toFixed(1)} KB</span>
        </div>

        <div className="card">
          <div className="stat-grid">
            <div>
              <div className="stat-n">{data.tasks.length}</div>
              <div className="stat-l">ажил</div>
            </div>
            <div>
              <div className="stat-n">{data.habits.length}</div>
              <div className="stat-l">зуршил</div>
            </div>
            <div>
              <div className="stat-n">{data.goals.length}</div>
              <div className="stat-l">зорилго</div>
            </div>
          </div>
        </div>

        <button className="row-btn" onClick={exportJson}>
          JSON болгож татах
        </button>
        <button className="row-btn" onClick={() => fileRef.current?.click()}>
          Файлаас сэргээх
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importJson} />

        <button
          className="row-btn"
          onClick={() =>
            setAsk({
              title: 'Жишээ өгөгдлөөр сэргээх үү?',
              message: 'Одоогийн бүх ажил, зуршил, зорилго жишээ өгөгдлөөр солигдоно. Буцаах боломжтой.',
              label: 'Сэргээх',
              danger: false,
              run: reset
            })
          }
        >
          Жишээ өгөгдлөөр сэргээх
        </button>
        <button
          className="row-btn danger"
          onClick={() =>
            setAsk({
              title: 'Бүх өгөгдлийг цэвэрлэх үү?',
              message: 'Бүх ажил, зуршил, зорилго устана. Буцаах боломжтой.',
              label: 'Цэвэрлэх',
              run: clearAll
            })
          }
        >
          Бүх өгөгдлийг цэвэрлэх
        </button>

        {msg && <div className="note">{msg}</div>}

        <div className="card-hint" style={{ textAlign: 'center', marginTop: 6 }}>
          Төлөвлөгөө v0.2 · өгөгдөл зөвхөн энэ төхөөрөмж дээр хадгалагдана
        </div>
      </div>

      {ask && (
        <ConfirmSheet
          title={ask.title}
          message={ask.message}
          confirmLabel={ask.label}
          danger={ask.danger !== false}
          onConfirm={ask.run}
          onClose={() => setAsk(null)}
        />
      )}
    </div>
  );
}
