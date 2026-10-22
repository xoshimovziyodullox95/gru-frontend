// Manzilgacha yo'l ko'rsatish havolalari (ustaning telefonidagi navigator ilovalari).
// Ilova o'rnatilgan bo'lsa to'g'ridan-to'g'ri ochiladi, aks holda brauzer versiyasi.

export function getRouteLinks(lat, lng) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return [];
  const la = Number(lat);
  const lo = Number(lng);
  return [
    {
      key: 'yandex-navi',
      label: 'Yandex Navigator',
      // Ilova bo'lmasa — Yandex Xaritalar sayti
      app: `yandexnavi://build_route_on_map?lat_to=${la}&lon_to=${lo}`,
      web: `https://yandex.uz/maps/?rtext=~${la},${lo}&rtt=auto`,
    },
    {
      key: 'yandex-maps',
      label: 'Yandex Xaritalar',
      web: `https://yandex.uz/maps/?rtext=~${la},${lo}&rtt=auto`,
    },
    {
      key: 'google',
      label: 'Google Maps',
      web: `https://www.google.com/maps/dir/?api=1&destination=${la},${lo}&travelmode=driving`,
    },
  ];
}

// Ilova sxemasini sinab ko'radi; sahifa yashirinmasa (ilova ochilmagan) — sayt versiyasi
export function openRoute(link) {
  if (!link.app) {
    window.open(link.web, '_blank', 'noopener');
    return;
  }
  let opened = false;
  const onHide = () => { opened = true; };
  document.addEventListener('visibilitychange', onHide, { once: true });
  window.location.href = link.app;
  setTimeout(() => {
    document.removeEventListener('visibilitychange', onHide);
    if (!opened && document.visibilityState === 'visible') {
      window.open(link.web, '_blank', 'noopener');
    }
  }, 1200);
}
