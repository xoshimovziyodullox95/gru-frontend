// src/components/common/RequestMap.jsx
// Xizmat so'rovi manzilini ko'rsatuvchi kichik xarita (faqat ko'rish uchun).
// searching=true bo'lsa, belgi atrofida "qidiruv" to'lqini aylanadi.
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import '../../styles/requestMap.css';

// Loyihaning boshqa xaritalari bilan bir xil manba (kalit talab qilmaydi);
// ilova ranglariga moslab requestMap.css'da qoraytiriladi
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '© OpenStreetMap';

export default function RequestMap({ lat, lng, searching = false, height = 220 }) {
  const containerRef = useRef(null);
  const markerRef = useRef(null);
  const hasCoords = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && (lat || lng);

  useEffect(() => {
    if (!hasCoords || !containerRef.current) return undefined;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView([Number(lat), Number(lng)], 15);

    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

    markerRef.current = L.marker([Number(lat), Number(lng)], {
      icon: L.divIcon({
        className: 'rmap-marker',
        html: '<span class="rmap-wave"></span><span class="rmap-wave rmap-wave--2"></span><span class="rmap-dot"></span>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
      interactive: false,
    }).addTo(map);

    // Pastki panel xaritaning bir qismini yopadi — belgini biroz yuqoriga suramiz
    map.panBy([0, height * 0.12], { animate: false });

    return () => map.remove();
  }, [hasCoords, lat, lng, height]);

  return (
    <div
      className={`rmap ${searching ? 'rmap--searching' : ''} ${hasCoords ? '' : 'rmap--empty'}`}
      style={{ height }}
    >
      {hasCoords ? (
        <div ref={containerRef} className="rmap-canvas" />
      ) : (
        <div className="rmap-fallback">
          <span className="rmap-fallback__pin"><MapPin size={22} /></span>
        </div>
      )}
    </div>
  );
}
