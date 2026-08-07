import { useEffect, useRef, useState } from 'react';
import { Navigation } from 'lucide-react';

// Leaflet'ni CDN orqali dinamik yuklaymiz — npm install shart emas.
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);

    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// Joylashuvni faqat ko'rsatish uchun (tahrirlab bo'lmaydi) — LocationDetailPage'da ishlatiladi
export default function LocationMapView({ lat, lng, address }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!lat || !lng) return undefined;
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !mapRef.current || mapInstance.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([lat, lng], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      L.marker([lat, lng]).addTo(map);

      mapInstance.current = map;
      setReady(true);
    });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lng]);

  const openInMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  if (!lat || !lng) return null;

  return (
    <div className="RealMapBox">
      <div ref={mapRef} className="RealMapContainer" />
      {!ready && <div className="map-loading">Xarita yuklanmoqda...</div>}
      <button className="MapInteractionHint RealMapOpenBtn" onClick={openInMaps} title={address}>
        <Navigation size={13} /> Google Maps’da ochish
      </button>
    </div>
  );
}