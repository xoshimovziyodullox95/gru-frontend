import { useEffect, useRef, useState } from 'react';

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

// Toshkent markazi - default nuqta
const DEFAULT_LAT = 41.311081;
const DEFAULT_LNG = 69.240562;

export default function LocationMapPicker({ lat, lng, onSelect }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !mapRef.current || mapInstance.current) return;

      const startLat = lat || DEFAULT_LAT;
      const startLng = lng || DEFAULT_LNG;

      const map = L.map(mapRef.current).setView([startLat, startLng], lat ? 16 : 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([startLat, startLng], { draggable: true }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      mapInstance.current = map;
      markerRef.current = marker;
      setReady(true);
    });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reverseGeocode = async (la, ln) => {
    // Koordinatani darhol yangilaymiz, manzil matnini keyin reverse-geocode orqali to'ldiramiz
    onSelect({ lat: la, lng: ln, address: null });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${la}&lon=${ln}`
      );
      const data = await res.json();
      if (data && data.display_name) {
        onSelect({ lat: la, lng: ln, address: data.display_name });
      }
    } catch (err) {
      console.error('Reverse geocode xatosi:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1`
      );
      const data = await res.json();
      if (data && data[0]) {
        const { lat: la, lon: ln, display_name } = data[0];
        const latNum = parseFloat(la);
        const lngNum = parseFloat(ln);
        if (mapInstance.current && markerRef.current) {
          mapInstance.current.setView([latNum, lngNum], 16);
          markerRef.current.setLatLng([latNum, lngNum]);
        }
        onSelect({ lat: latNum, lng: lngNum, address: display_name });
      } else {
        alert('Manzil topilmadi, boshqacha nom bilan qidirib ko‘ring');
      }
    } catch (err) {
      console.error('Geocode qidiruv xatosi:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="map-picker">
      <div className="map-search-row">
        <input
          type="text"
          placeholder="Manzilni qidirish (masalan: Chilonzor, Toshkent)"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <button type="button" onClick={handleSearch} disabled={searching}>
          {searching ? '...' : 'Qidirish'}
        </button>
      </div>

      <div ref={mapRef} className="map-container" />
      {!ready && <div className="map-loading">Xarita yuklanmoqda...</div>}

      <p className="map-hint">
        Xaritadan kerakli nuqtani bosing yoki markerni suring — manzil avtomatik aniqlanadi.
      </p>
    </div>
  );
}