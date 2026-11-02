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

export function playDing() {
  // Sozlamalardagi "Ovozli signal" o'chirilgan bo'lsa hech qayerda chalinmaydi
  if (isChatMuted()) return;
  try {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume();

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, c.currentTime);
    osc.frequency.setValueAtTime(660, c.currentTime + 0.09);
    gain.gain.setValueAtTime(0.18, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.35);
  } catch {
    // Ignore unsupported or blocked audio playback.
  }
}

// Layk, izoh, obuna — buyurtma "ding"idan ajralib turadigan yengil marimba "ding-dong"
// (telefondagi push ovozi res/raw/zumo_social bilan bir xil ohang: E6 → B5)
export function playSocial() {
  if (isChatMuted()) return;
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
