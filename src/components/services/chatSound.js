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
