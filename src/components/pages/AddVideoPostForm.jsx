import { createPortal } from 'react-dom';
﻿// Video joylash — YouTube Studio / Instagram kabi qadamma-qadam:
// 1) video tanlash  2) muqova kadri  3) sarlavha va tavsif  4) ko'rib chiqish va joylash
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowLeft, Check, CheckCircle2, Film, ImageIcon, Play, RotateCcw, Send, UploadCloud, X,
} from 'lucide-react';

import { createVideoPost } from '../services/videos';
import { safeGoBack } from '../utils/navigation.js';
import { T } from '../utils/T';
import '../../styles/addVideoSteps.css';

// Server (routes/posts.js) bilan bir xil cheklovlar
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 90;
const MAX_TITLE = 80;
const MAX_DESCRIPTION = 500;
const FRAME_COUNT = 8;

const STEPS = [
  { id: 'video', label: () => T('Video') },
  { id: 'cover', label: () => T('Muqova') },
  { id: 'details', label: () => T('Ma’lumot') },
  { id: 'publish', label: () => T('Joylash') },
];

// 1x1 shaffof GIF: Android WebView video yuklanguncha kulrang fon va katta "▶" chizmasin
const TRANSPARENT_POSTER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const formatSize = (bytes) => `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
const formatTime = (s) => `${Math.floor((s || 0) / 60)}:${String(Math.floor((s || 0) % 60)).padStart(2, '0')}`;

// Videoning joriy kadrini rasmga aylantiradi (muqova). Uzun tomoni 720px gacha.
function grabFrame(video) {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return '';
  const scale = Math.min(1, 720 / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  try { return canvas.toDataURL('image/jpeg', 0.8); } catch { return ''; }
}

export default function AddVideoPostForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({ duration: 0, width: 0, height: 0 });
  const [cover, setCover] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // Telefonning "orqaga" tugmasi: oldingi qadamga; yuklanayotganda sahifadan chiqarmaydi
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || uploading || done || step === 0) return;
      setError('');
      setStep((s) => s - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [uploading, done, step]);

  const tooLong = meta.duration > MAX_VIDEO_SECONDS + 0.5;
  const isPortrait = meta.height > meta.width;
  // iPhone davomiylik/kadrni video o'ynatilmaguncha bermasligi mumkin — bu holda ham davom etish mumkin
  // (server hajm va formatni o'zi tekshiradi; muqova ixtiyoriy)
  const canNext = [
    Boolean(file) && !tooLong,
    !framesLoading || Boolean(cover),
    true,
    true,
  ][step];

  const pickFile = () => !uploading && fileInputRef.current?.click();

  const onFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type?.startsWith('video/')) return setError(T('Faqat video fayl yuklash mumkin'));
    if (f.size > MAX_VIDEO_SIZE) return setError(T('Video hajmi 50 MB dan oshmasligi kerak'));
    setError('');
    setMeta({ duration: 0, width: 0, height: 0 });
    setCover('');
    setCoverT(null);
    setFrames([]);
    setFile(f);
  };

  const onMeta = (e) => {
    const v = e.currentTarget;
    setMeta({ duration: v.duration || 0, width: v.videoWidth || 0, height: v.videoHeight || 0 });
    if (v.duration > MAX_VIDEO_SECONDS + 0.5) setError(T('Video {{max}} soniyadan oshmasligi kerak', { max: MAX_VIDEO_SECONDS }));
  };

  // Muqova bosqichi (Instagram kabi): yashirin videodan bir nechta kadr olinadi, foydalanuvchi bittasini tanlaydi.
  // Ko'rinib turgan <video>ni surish Android WebView'da seek'da osilib qolardi — yashirin element barqaror ishlaydi.
  const [frames, setFrames] = useState([]);
  const [coverT, setCoverT] = useState(null);
  const [framesLoading, setFramesLoading] = useState(false);
  useEffect(() => {
    if (step !== 1 || !previewUrl || frames.length >= FRAME_COUNT) return undefined;
    let cancelled = false;
    const v = document.createElement('video');
    Object.assign(v, { muted: true, playsInline: true, preload: 'auto', src: previewUrl });
    v.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none';
    document.body.appendChild(v);
    const once = (ev) => new Promise((res) => {
      const timer = setTimeout(() => res(false), 5000);
      v.addEventListener(ev, () => { clearTimeout(timer); res(true); }, { once: true });
    });
    (async () => {
      setFramesLoading(true);
      v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', ''); v.setAttribute('muted', '');
      v.load();
      // iPhone: muted inline play() dekoderni uyg'otadi, aks holda loadeddata kelmaydi
      v.play().then(() => v.pause()).catch(() => {});
      if (!(await once('loadeddata'))) { setFramesLoading(false); return; }
      const dur = meta.duration || (Number.isFinite(v.duration) ? v.duration : 0);
      if (!dur) { setFramesLoading(false); return; }
      if (!meta.duration) setMeta({ duration: dur, width: v.videoWidth || 0, height: v.videoHeight || 0 });
      const out = [];
      for (let i = 0; i < FRAME_COUNT && !cancelled; i += 1) {
        const t = Math.min(dur - 0.05, ((i + 0.5) / FRAME_COUNT) * dur);
        v.currentTime = t;
        if (!(await once('seeked'))) break;
        // seeked'dan keyin kadr ekranga chizilishini kutamiz — aks holda oldingi kadr qayta olinadi
        await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
        const shot = grabFrame(v);
        if (!shot || cancelled) continue;
        out.push({ t, shot });
        setFrames([...out]);
        if (out.length === 1 && !cover) { setCover(shot); setCoverT(t); }
      }
      if (cancelled) return;
      setFramesLoading(false);
    })();
    return () => { cancelled = true; v.removeAttribute('src'); v.load(); v.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, previewUrl, meta.duration]);

  const goNext = () => {
    if (!canNext) return;
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => {
    if (uploading) return;
    if (step === 0 || done) safeGoBack(navigate);
    else setStep((s) => s - 1);
  };

  const publish = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setProgress(0);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', title.trim() || 'Video');
      fd.append('description', description.trim());
      if (cover) fd.append('thumbnail', cover);
      fd.append('video', file);
      await createVideoPost(fd, (ev) => {
        if (ev.total) setProgress(Math.min(99, Math.round((ev.loaded * 100) / ev.total)));
      });
      setProgress(100);
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.error || T('Video yuklashda xatolik yuz berdi. Internetni tekshirib, qayta urinib ko‘ring.'));
    } finally {
      setUploading(false);
    }
  };

  const restart = () => {
    setFile(null);
    setFrames([]);
    setCover('');
    setTitle('');
    setDescription('');
    setProgress(0);
    setDone(false);
    setStep(0);
  };

  // Portal + to'liq ekran: ilovaning yuqori paneli va pastki menyusi sarlavhani (orqaga/Keyingi) yopib qo'ymasin
  return createPortal(
    <main className="avs-page" data-back-handler={uploading || (step > 0 && !done) ? '' : undefined}>
      <header className="avs-head">
        <button type="button" className="avs-icon-btn" onClick={goBack} disabled={uploading} aria-label={T('Orqaga')}>
          {step === 0 || done ? <X size={22} /> : <ArrowLeft size={22} />}
        </button>
        <strong>{done ? T('Tayyor') : T('Yangi video')}</strong>
        {!done && step < 3 ? (
          <button type="button" className="avs-next" onClick={goNext} disabled={!canNext}>{T('Keyingi')}</button>
        ) : <span className="avs-head__spacer" />}
      </header>

      {!done && (
        <ol className="avs-steps">
          {STEPS.map((s, i) => (
            <li key={s.id} className={i < step ? 'is-done' : i === step ? 'is-active' : ''}>
              <span className="avs-steps__dot">{i < step ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
              <span className="avs-steps__label">{s.label()}</span>
            </li>
          ))}
        </ol>
      )}

      <input ref={fileInputRef} type="file" accept="video/*" hidden onChange={onFile} />

      <section className="avs-body">
        {/* ---------- 1. Video tanlash ---------- */}
        {step === 0 && !done && (
          !file ? (
            <button type="button" className="avs-drop" onClick={pickFile}>
              <span className="avs-drop__icon"><UploadCloud size={36} strokeWidth={1.7} /></span>
              <strong>{T('Video tanlang')}</strong>
              <span>{T('Galereyadan video tanlash uchun bosing')}</span>
              <small>{T('MP4, WebM, MOV · 50 MB gacha · 90 soniyagacha')}</small>
            </button>
          ) : (
            <>
              <div className="avs-player">
                <video src={`${previewUrl}#t=0.1`} poster={TRANSPARENT_POSTER} controls playsInline webkit-playsinline="true"
                  muted autoPlay loop preload="auto" disablePictureInPicture onLoadedMetadata={onMeta} />
              </div>
              <div className="avs-file">
                <span className="avs-file__icon"><Film size={18} /></span>
                <span className="avs-file__info">
                  <strong>{file.name}</strong>
                  <small>{formatSize(file.size)}{meta.duration > 0 && ` · ${formatTime(meta.duration)}`}</small>
                </span>
                <button type="button" className="avs-chip" onClick={pickFile}><RotateCcw size={14} /> {T('Almashtirish')}</button>
              </div>
              {meta.width > 0 && !isPortrait && (
                <p className="avs-tip"><AlertCircle size={16} /> {T('Tik (9:16) video lentada chiroyliroq ko‘rinadi.')}</p>
              )}
            </>
          )
        )}

        {/* ---------- 2. Muqova ---------- */}
        {step === 1 && !done && (
          <>
            <p className="avs-lead">{T('Lentada va profilingizda ko‘rinadigan kadrni tanlang.')}</p>
            <div className="avs-player avs-player--cover">
              {cover ? <img src={cover} alt="" /> : <span className="avs-spinner" />}
            </div>
            {framesLoading && <p className="avs-lead avs-lead--center">{T('Kadrlar tayyorlanmoqda…')}</p>}
            {!framesLoading && frames.length === 0 && (
              <p className="avs-lead avs-lead--center">{T('Muqova videoning birinchi kadridan olinadi. “Keyingi”ni bosing.')}</p>
            )}
            {frames.length > 0 && (
              <div className="avs-strip" role="listbox" aria-label={T('Muqova kadri')}>
                {frames.map((f) => (
                  <button
                    key={f.t}
                    type="button"
                    role="option"
                    aria-selected={coverT === f.t}
                    className={coverT === f.t ? 'is-active' : ''}
                    onClick={() => { setCover(f.shot); setCoverT(f.t); }}
                  >
                    <img src={f.shot} alt="" />
                    <span>{formatTime(f.t)}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ---------- 3. Ma'lumot ---------- */}
        {step === 2 && !done && (
          <>
            <div className="avs-details-head">
              {cover ? <img src={cover} alt="" /> : <span className="avs-details-head__ph"><ImageIcon size={22} /></span>}
              <p>{T('Qisqa va aniq sarlavha videongizni ko‘proq odamga ko‘rsatadi.')}</p>
            </div>
            <label className="avs-field">
              <span>{T('Sarlavha')}<small>{title.length}/{MAX_TITLE}</small></span>
              <input value={title} maxLength={MAX_TITLE} onChange={(e) => setTitle(e.target.value)} placeholder={T('Masalan: Oshxona mebelini o‘rnatish')} />
            </label>
            <label className="avs-field">
              <span>{T('Tavsif')}<small>{description.length}/{MAX_DESCRIPTION}</small></span>
              <textarea rows={5} value={description} maxLength={MAX_DESCRIPTION} onChange={(e) => setDescription(e.target.value)} placeholder={T('Nima ko‘rsatilgan, narxi, manzil, bog‘lanish...')} />
            </label>
          </>
        )}

        {/* ---------- 4. Ko'rib chiqish va joylash ---------- */}
        {step === 3 && !done && (
          <>
            <div className="avs-review">
              <div className="avs-review__cover">
                {cover ? <img src={cover} alt="" /> : <video src={`${previewUrl}#t=0.5`} muted playsInline />}
                <span className="avs-review__badge"><Play size={11} fill="currentColor" /> {formatTime(meta.duration)}</span>
              </div>
              <div className="avs-review__info">
                <strong>{title.trim() || T('Sarlavhasiz video')}</strong>
                {description.trim() && <p>{description.trim()}</p>}
                <small>{formatSize(file.size)} · {isPortrait ? T('Tik video') : T('Yotiq video')}</small>
              </div>
            </div>

            {uploading && (
              <div className="avs-progress">
                <div className="avs-progress__row"><span>{progress >= 99 ? T('Server videoni tayyorlamoqda…') : T('Yuklanmoqda… ilovadan chiqmang')}</span><strong>{progress}%</strong></div>
                <div className="avs-progress__track"><div style={{ width: `${progress}%` }} /></div>
              </div>
            )}

            <button type="button" className="avs-publish" onClick={publish} disabled={uploading}>
              {uploading ? <span className="avs-spinner" /> : <Send size={18} />}
              {uploading ? T('Joylanmoqda…') : T('Joylash')}
            </button>
          </>
        )}

        {/* ---------- Tayyor ---------- */}
        {done && (
          <div className="avs-done">
            <span className="avs-done__icon"><CheckCircle2 size={44} /></span>
            <strong>{T('Videongiz joylandi!')}</strong>
            <p>{T('U endi lentada va profilingizdagi «Videolar» bo‘limida ko‘rinadi.')}</p>
            <button type="button" className="avs-publish" onClick={() => navigate('/profile?tab=videos', { replace: true })}>{T('Profilda ko‘rish')}</button>
            <button type="button" className="avs-secondary" onClick={restart}>{T('Yana video qo‘shish')}</button>
          </div>
        )}

        {error && <p className="avs-error" role="alert"><AlertCircle size={16} /> {error}</p>}
      </section>
    </main>,
    document.body
  );
}
