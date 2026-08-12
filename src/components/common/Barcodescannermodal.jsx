// src/components/common/BarcodeScannerModal.jsx
import { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';

const LIB_URL = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';

function loadScannerLib() {
  return new Promise((resolve, reject) => {
    if (window.Html5Qrcode) return resolve(window.Html5Qrcode);
    const existing = document.querySelector(`script[src="${LIB_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Html5Qrcode));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = LIB_URL;
    script.async = true;
    script.onload = () => resolve(window.Html5Qrcode);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function BarcodeScannerModal({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const runningRef = useRef(false);
  const containerId = 'gru-barcode-reader';
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    let cancelled = false;
    let scannerInstance = null;

    const startScanner = async (Html5Qrcode) => {
      scannerInstance = new Html5Qrcode(containerId);
      scannerRef.current = scannerInstance;

      const onDecoded = (decodedText) => {
        onScan(decodedText);
        if (runningRef.current) {
          runningRef.current = false;
          scannerInstance.stop().catch(() => {});
        }
      };
      const onFrameError = () => {};

      // 🔥 Avval orqa kamerani sinaymiz, topilmasa — istalgan mavjud kamerani ishlatamiz
      try {
        await scannerInstance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 160 } },
          onDecoded,
          onFrameError
        );
        runningRef.current = true;
      } catch (envErr) {
        console.warn("Orqa kamera topilmadi, boshqa kamera qidirilmoqda:", envErr.message);
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (!cameras || cameras.length === 0) throw new Error('Kamera topilmadi');
          await scannerInstance.start(
            cameras[0].id,
            { fps: 10, qrbox: { width: 260, height: 160 } },
            onDecoded,
            onFrameError
          );
          runningRef.current = true;
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      }
    };

    loadScannerLib()
      .then((Html5Qrcode) => {
        if (cancelled) return;
        return startScanner(Html5Qrcode);
      })
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err) => {
        console.error('Skaner xatosi:', err);
        if (!cancelled) {
          setError("Kamerani ochib bo'lmadi. Ruxsat berilganini tekshiring yoki qo'lda kiriting.");
        }
      });

    return () => {
      cancelled = true;
      if (scannerInstance && runningRef.current) {
        runningRef.current = false;
        scannerInstance.stop().then(() => scannerInstance.clear()).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="bcs-overlay" onClick={onClose}>
      <div className="bcs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bcs-header">
          <h3><Camera size={18} /> Shtrix-kodni skaner qiling</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {error ? (
          <div className="bcs-error">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div id={containerId} className="bcs-reader" />
            {!ready && <p className="bcs-loading">Kamera ochilmoqda...</p>}
          </>
        )}

        <div className="bcs-manual">
          <p>Yoki kodni qo'lda kiriting:</p>
          <form onSubmit={handleManualSubmit} className="bcs-manual-form">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Shtrix-kod raqami"
            />
            <button type="submit">Qo'shish</button>
          </form>
        </div>
      </div>
    </div>
  );
}