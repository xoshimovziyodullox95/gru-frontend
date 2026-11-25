// Web sayt Capacitor ichida ilova bo'lib ochilganda telefonga xos sozlamalar.
// Oddiy brauzerda hech narsa qilmaydi; plaginlar faqat ilovada yuklanadi.
import { Capacitor, registerPlugin } from '@capacitor/core';

// Faqat bosh sahifada "orqaga" ilovadan chiqaradi (ikki marta bosilganda)
const ROOT_PATHS = ['/', '/home'];
const EXIT_WINDOW_MS = 2000;
// Ochiq bo'lsa, "orqaga" avval shularni yopadi (komponentlar Escape tugmasini tinglaydi)
const OVERLAYS = '.tg-msg-menu, .tg-lightbox, .tg-wall-sheet, .reel-modal-overlay, .rv-viewer, .rv-sheet, .st-sheet, .pf-sheet, .ImageViewerOverlay, [role="dialog"][aria-modal="true"], .tg-chat--mobile-open, [data-back-handler], .mkt-add-menu, .mp-mobile-filter-overlay, .zumo-quick-menu';
let lastBackAt = 0;

// Android ilovani fonda yopib qo'ysa ham, qayta ochilganda oxirgi sahifadan davom etamiz
const LAST_ROUTE_KEY = 'zumo_last_route';
const LAST_ROUTE_TTL_MS = 12 * 60 * 60 * 1000;
const NO_RESTORE = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

function saveRoute() {
  const { pathname, search } = window.location;
  if (NO_RESTORE.includes(pathname)) return;
  try {
    localStorage.setItem(LAST_ROUTE_KEY, JSON.stringify({ path: pathname + search, at: Date.now() }));
  } catch { /* xotira yopiq bo'lsa — tiklanmaydi, xolos */ }
}

// Faqat Android ilovani o'zi yopgan bo'lsa (MainActivity → Launch plagini) oxirgi sahifaga qaytamiz.
// Foydalanuvchi ilovani qatordan o'chirsa yoki chiqib ketsa — landing'dan noldan boshlanadi.
// iPhone: iOS fondagi ilovani xotira uchun tez-tez yopadi (foydalanuvchi buni sezmaydi) —
// yaqinda (15 daqiqa ichida) ishlatilgan bo'lsa, qayta ochilganda o'sha sahifadan davom etamiz.
const IOS_RESTORE_MS = 15 * 60 * 1000;

async function shouldRestore() {
  if (Capacitor.getPlatform() === 'ios') {
    try {
      const saved = JSON.parse(localStorage.getItem(LAST_ROUTE_KEY) || 'null');
      return Boolean(saved && Date.now() - saved.at < IOS_RESTORE_MS);
    } catch {
      return false;
    }
  }
  try {
    const { restored } = await registerPlugin('Launch').wasRestored();
    return restored;
  } catch {
    return false;
  }
}

export function restoreLastRoute() {
  if (!Capacitor.isNativePlatform()) return;
  shouldRestore().then((restored) => {
    if (!restored || window.location.pathname !== '/') return;
    try {
      const saved = JSON.parse(localStorage.getItem(LAST_ROUTE_KEY) || 'null');
      if (saved?.path && Date.now() - saved.at < LAST_ROUTE_TTL_MS) {
        window.history.replaceState(null, '', saved.path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch { /* buzilgan yozuv — landing'dan boshlaymiz */ }
  });

  for (const method of ['pushState', 'replaceState']) {
    const original = window.history[method].bind(window.history);
    window.history[method] = (...args) => {
      original(...args);
      saveRoute();
    };
  }
  window.addEventListener('popstate', saveRoute);
  // Fonga o'tayotganda vaqtni yangilaymiz — uzoq bitta sahifada turilgan bo'lsa ham tiklanadi
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveRoute(); });
}

function showExitHint() {
  import('react-hot-toast').then(({ default: toast }) =>
    import('./T').then(({ T }) => toast(T('Chiqish uchun yana bir marta bosing'), { id: 'exit-hint', duration: EXIT_WINDOW_MS }))
  );
}

export async function setupNativeShell() {
  if (!Capacitor.isNativePlatform()) return;

  // iPhone: ilova soat/batareyagacha to'liq ekranni egallaydi; sarlavhalar
  // env(safe-area-inset-top) bilan orolcha ostidan pastga suriladi.
  // Faqat iOS — Android'da env() 0 bo'lib qoladi va hozirgi ko'rinish o'zgarmaydi.
  if (Capacitor.getPlatform() === 'ios') {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta && !meta.content.includes('viewport-fit')) meta.content += ', viewport-fit=cover';
    // Kichik shriftli maydon bosilganda iPhone sahifani kattalashtirib yubormasin (ilovada odatiy holat)
    if (meta && !meta.content.includes('maximum-scale')) meta.content += ', maximum-scale=1';
    document.documentElement.classList.add('is-ios-app');
  }

  const [{ App }, { StatusBar, Style }, { SplashScreen }] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
  ]);

  // iPhone: chap chetdan surish — Android "orqaga" bilan bir xil: oyna → oldingi sahifa (ilovadan chiqmaydi)
  if (Capacitor.getPlatform() === 'ios') {
    const { setupIosEdgeSwipe } = await import('./iosEdgeSwipe');
    setupIosEdgeSwipe(() => {
      if (document.querySelector(OVERLAYS)) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return;
      }
      if (ROOT_PATHS.includes(window.location.pathname)) return;
      const routerIdx = window.history.state?.idx;
      if (Number.isInteger(routerIdx) && routerIdx > 0) return window.history.back();
      window.history.replaceState(null, '', '/home');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  }

  // Android "orqaga" tugmasi: oyna → oldingi sahifa → (faqat bosh sahifada) ikki bosishda chiqish
  App.addListener('backButton', ({ canGoBack }) => {
    if (document.querySelector(OVERLAYS)) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return;
    }
    const atRoot = ROOT_PATHS.includes(window.location.pathname);
    // WebView'ning canGoBack'i pushState yozuvlarini ba'zan hisobga olmaydi va sahifa "o'tkazib yuboriladi" —
    // React Router'ning o'z tarix indeksiga ham qaraymiz
    const routerIdx = window.history.state?.idx;
    if (!atRoot && (canGoBack || (Number.isInteger(routerIdx) && routerIdx > 0))) return window.history.back();
    if (!atRoot) {
      // Tarix yo'q (masalan, havola orqali ochilgan) — chiqib ketmasdan bosh sahifaga
      window.history.replaceState(null, '', '/home');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    if (Date.now() - lastBackAt < EXIT_WINDOW_MS) return App.exitApp();
    lastBackAt = Date.now();
    showExitHint();
  });

  // Google / email tasdiqlashdan keyin uz.zumo.marketplace://auth/callback bilan qaytish
  const { completeNativeAuth } = await import('./googleAuth');
  const onAuthUrl = (url) => completeNativeAuth(url).catch((err) => {
    import('react-hot-toast').then(({ default: toast }) => toast.error(err.message));
  });
  App.addListener('appUrlOpen', ({ url }) => onAuthUrl(url));
  App.getLaunchUrl().then((launch) => launch?.url && onAuthUrl(launch.url)).catch(() => {});

  document.documentElement.classList.add('is-native-app');
  if (Capacitor.getPlatform() === 'ios') {
    // iPhone'da status bar shaffof va sarlavha ustida turadi: soat/batareya rangi mavzuga mos bo'lsin
    // (oq fonda oq yozuv ko'rinmay qolardi). Style.Light = qora yozuv, Style.Dark = oq yozuv.
    const root = document.documentElement;
    const syncStatusBar = () => {
      const dark = root.classList.contains('dark') || root.dataset.theme === 'dark';
      StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
    };
    syncStatusBar();
    new MutationObserver(syncStatusBar).observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    // Klaviatura: yuqoridagi "^ v ✓" panelini yashiramiz (ilova o'z yuborish tugmasiga ega)
    import('@capacitor/keyboard')
      .then(({ Keyboard }) => Keyboard.setAccessoryBarVisible({ isVisible: false }))
      .catch(() => {});
  } else {
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#0A1628' }).catch(() => {});
  }
  SplashScreen.hide().catch(() => {});
}
