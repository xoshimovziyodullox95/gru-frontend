import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { T } from '../utils/T';
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
  const [tileError, setTileError] = useState(false);
  const [searchError, setSearchError] = useState('');
  const geocodeRequest = useRef(0);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return undefined;

    const startLat = Number.isFinite(Number(lat)) && lat !== null && lat !== undefined
      ? Number(lat)
      : DEFAULT_LAT;
    const startLng = Number.isFinite(Number(lng)) && lng !== null && lng !== undefined
      ? Number(lng)
      : DEFAULT_LNG;
    const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView(
      [startLat, startLng],
      lat != null && lng != null ? 16 : 12
    );
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    });
    let gotTile = false;
    const tileTimeout = window.setTimeout(() => { if (!gotTile) setTileError(true); }, 9000);
    tiles.on('tileload', () => {
      gotTile = true;
      window.clearTimeout(tileTimeout);
      setTileError(false);
    });
    tiles.on('tileerror', () => setTileError(true));
    tiles.addTo(map);

    const marker = L.marker([startLat, startLng], {
      draggable: true,
      icon: L.divIcon({
        className: 'rq-map-marker-wrap',
        html: '<span class="rq-map-marker"></span>',
        iconSize: [32, 42],
        iconAnchor: [16, 38],
      }),
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      reverseGeocode(pos.lat, pos.lng);
    });

    const onMapClick = (event) => {
      marker.setLatLng(event.latlng);
      reverseGeocode(event.latlng.lat, event.latlng.lng);
    };
    map.on('click', onMapClick);

    mapInstance.current = map;
    markerRef.current = marker;
    setReady(true);
    requestAnimationFrame(() => map.invalidateSize({ pan: false }));

    return () => {
      geocodeRequest.current += 1;
      window.clearTimeout(tileTimeout);
      map.off('click', onMapClick);
      map.remove();
      mapInstance.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reverseGeocode = async (la, ln) => {
    const requestId = ++geocodeRequest.current;
    // Koordinatani darhol saqlaymiz; manzil nomi topilmasa ham nuqta yo'qolmaydi.
    onSelect({ lat: la, lng: ln, address: null });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${la}&lon=${ln}`
      );
      if (!res.ok) throw new Error('Manzil xizmati javob bermadi');
      const data = await res.json();
      if (requestId === geocodeRequest.current && data?.display_name) {
        onSelect({ lat: la, lng: ln, address: data.display_name });
      }
    } catch (err) {
      console.error('Reverse geocode xatosi:', err);
    }
  };

  // Telefon GPS'i orqali hozirgi joy (ilovada joylashuv ruxsati so'raladi)
  const [locating, setLocating] = useState(false);
  const handleLocate = () => {
    if (!navigator.geolocation) {
      setSearchError(T('Qurilmangiz joylashuvni aniqlay olmaydi. Manzilni qo‘lda yozing.'));
      return;
    }
    setLocating(true);
    setSearchError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        if (mapInstance.current && markerRef.current) {
          mapInstance.current.setView([coords.latitude, coords.longitude], 17);
          markerRef.current.setLatLng([coords.latitude, coords.longitude]);
        }
        reverseGeocode(coords.latitude, coords.longitude);
      },
      () => {
        setLocating(false);
        setSearchError(T('Joylashuvni aniqlab bo‘lmadi. Ruxsat bering yoki xaritadan nuqta tanlang.'));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    const requestId = ++geocodeRequest.current;
    setSearching(true);
    setSearchError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1`
      );
      if (!res.ok) throw new Error('Manzil xizmati javob bermadi');
      const data = await res.json();
      if (requestId !== geocodeRequest.current) return;
      if (data?.[0]) {
        const { lat: la, lon: ln, display_name } = data[0];
        const latNum = parseFloat(la);
        const lngNum = parseFloat(ln);
        if (mapInstance.current && markerRef.current) {
          mapInstance.current.setView([latNum, lngNum], 16);
          markerRef.current.setLatLng([latNum, lngNum]);
        }
        onSelect({ lat: latNum, lng: lngNum, address: display_name });
      } else {
        setSearchError(T('Manzil topilmadi. Boshqa manzil bilan urinib ko‘ring.'));
      }
    } catch (err) {
      console.error('Geocode qidiruv xatosi:', err);
      setSearchError(T('Qidiruv ishlamadi. Xaritadan nuqta tanlang yoki manzilni pastga yozing.'));
    } finally {
      if (requestId === geocodeRequest.current) setSearching(false);
    }
  };

  return (
    <div className="map-picker">
      <div className="map-search-row">
        <input
          type="text"
          placeholder={T('Manzilni qidirish (masalan: Chilonzor, Toshkent)')}
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
          {searching ? '...' : T('Qidirish')}
        </button>
      </div>
      <button type="button" className="map-locate-btn" onClick={handleLocate} disabled={locating}>
        {locating ? T('Aniqlanmoqda...') : `📍 ${T('Mening joylashuvim')}`}
      </button>
      {searchError && <div className="map-search-error" role="status">{searchError}</div>}

      <div ref={mapRef} className="map-container" />
      {!ready && <div className="map-loading">{T('Xarita yuklanmoqda...')}</div>}
      {tileError && ready && (
        <div className="map-error" role="status">
          {T('Xarita yuklanmadi. Manzilni pastdagi maydonga yozishingiz mumkin.')}
        </div>
      )}

      <p className="map-hint">{T('Xaritadan nuqta tanlang yoki markerni suring.')}</p>
    </div>
  );
}
