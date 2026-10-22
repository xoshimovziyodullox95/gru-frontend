export const ZUMO_GUIDE_EVENT = 'zumo:open-guide';

export function openZumoGuide(flow = 'welcome') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ZUMO_GUIDE_EVENT, { detail: { flow } }));
}
