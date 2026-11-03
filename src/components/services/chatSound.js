// src/services/chatSound.js
// Navbar va ChatPage ikkalasi shu yerdan foydalanadi (bitta AudioContext)

let ctx = null;

function getCtx() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  return ctx;
}

// Brauzer birinchi bosishdan keyingina ovozga ruxsat beradi
export function unlockAudio() {
  try {
    const c = getCtx();
    if (c && c.state === 'suspended') c.resume();
  } catch {
    // Audio is optional; browsers may deny it until the user interacts.
  }
}

export function isChatMuted() {
  try {
    return localStorage.getItem('chat_muted') === '1';
  } catch {
    return false;
  }
}

export function setChatMuted(muted) {
  try {
    localStorage.setItem('chat_muted', muted ? '1' : '0');
  } catch {
    // saqlab bo'lmasa ham ilova ishlayveradi
  }
}

// Haqiqiy ovoz fayllari (push'dagi bilan bir xil): baland va jarangdor. Fayl o'ynamasa — sintez.
const SAMPLES = { message: '/sounds/zumo_message.wav', social: '/sounds/zumo_social.wav', service: '/sounds/zumo_service.wav' };
const sampleCache = {};
function playSample(name) {
  try {
    const audio = sampleCache[name] || (sampleCache[name] = new Audio(SAMPLES[name]));
    audio.volume = 1;
    audio.currentTime = 0;
    const played = audio.play();
    return played && typeof played.then === 'function' ? played.then(() => true, () => false) : Promise.resolve(true);
  } catch {
    return Promise.resolve(false);
  }
}

// Chat va umumiy bildirishnoma ovozi — jarangdor qo'ng'iroqcha "tiling-ling"
export function playDing() {
  // Sozlamalardagi "Ovozli signal" o'chirilgan bo'lsa hech qayerda chalinmaydi
  if (isChatMuted()) return;
  playSample('message').then((ok) => { if (!ok) synthBell([1760, 2217.5, 2637], 0.09, 0.32); });
}

// Usta chaqirish jarayoni (taklif, qabul, yo'lda, yetib keldi, tugadi) — uzunroq jarangdor qo'ng'iroq
export function playService() {
  if (isChatMuted()) return;
  playSample('service').then((ok) => { if (!ok) synthBell([1046.5, 1318.5, 1568, 2093], 0.14, 0.32); });
}

// Zaxira: brauzer faylni o'ynata olmasa — qo'ng'iroqcha sintezi
function synthBell(freqs, gap, vol) {
  try {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    freqs.forEach((freq, k) => {
      const t0 = c.currentTime + k * gap;
      [[1, 1], [2.76, 0.45], [5.4, 0.2]].forEach(([mul, amp]) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * mul, t0);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(vol * amp, t0 + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.6);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(t0);
        osc.stop(t0 + 0.62);
      });
    });
  } catch {
    // Ovoz ixtiyoriy
  }
}

// Layk, izoh, obuna — buyurtma "ding"idan ajralib turadigan yengil marimba "ding-dong"
// (telefondagi push ovozi res/raw/zumo_social bilan bir xil ohang: E6 → B5)
export function playSocial() {
  if (isChatMuted()) return;
  playSample('social').then((ok) => { if (!ok) synthSocial(); });
}

function synthSocial() {
  try {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    [[1318.5, 0], [987.8, 0.16]].forEach(([freq, delay]) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      const t0 = c.currentTime + delay;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.14, t0 + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + 0.5);
    });
  } catch {
    // Ovoz ixtiyoriy — brauzer bloklasa ham ilova ishlayveradi
  }
}
