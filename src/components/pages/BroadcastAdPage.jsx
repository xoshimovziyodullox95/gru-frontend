import { safeGoBack } from '../utils/navigation.js';
// src/components/pages/BroadcastAdPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Send, Users, X } from 'lucide-react';
import api from '../services/api';
import { getSubscribers } from '../services/user';
import '../../styles/broadcastAd.css';

export default function BroadcastAdPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [audienceCount, setAudienceCount] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    getSubscribers()
      .then((response) => { if (active) setAudienceCount(Array.isArray(response.data) ? response.data.length : 0); })
      .catch(() => { if (active) setAudienceCount(null); });
    return () => { active = false; };
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 100 * 1024 * 1024) {
      setError('Fayl hajmi 100 MB dan oshmasligi kerak');
      e.target.value = '';
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowed.includes(selected.type)) {
      setError('JPG, PNG, WEBP, MP4, WEBM yoki MOV fayl tanlang');
      e.target.value = '';
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setIsVideo(selected.type.startsWith('video/'));
    setResult(null);
    setError('');
  };

  const handleSend = async () => {
    if (!file) {
      setError("Avval rasm yoki video tanlang");
      return;
    }
    setSending(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('caption', caption);
      const res = await api.post('/broadcast/ad', formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setCaption('');
    setResult(null);
    setError('');
  };

  return (
    <div className="ba-page">
      <button className="BackActionBtn" onClick={() => safeGoBack(navigate)}>
        <ArrowLeft size={16} /> Orqaga
      </button>

      <div className="ba-header">
        <h1><Send size={22} /> Reklama tarqatish</h1>
        <p className="ba-subtitle">
          Rasm yoki video reklama sizga obuna bo‘lgan mijozlarga yuboriladi
          {audienceCount !== null ? ` · ${audienceCount} ta obunachi` : ''}.
        </p>
      </div>

      {result ? (
        <div className="ba-success">
          <Users size={40} />
          <h2>Yuborildi!</h2>
          <p><strong>{result.sentTo}</strong> ta mijozga reklama yetkazildi</p>
          <button className="ba-btn-primary" onClick={reset}>Yana bittasini yuborish</button>
        </div>
      ) : (
        <>
          {!preview ? (
            <div className="ba-upload-zone" onClick={() => fileInputRef.current?.click()}>
              <Upload size={36} />
              <p>Banner rasmi yoki video yuklang</p>
              <span className="ba-upload-hint">JPG, PNG, WEBP, MP4, WEBM, MOV — 100 MB gacha</span>
            </div>
          ) : (
            <div className="ba-preview-zone">
              <button className="ba-remove-preview" onClick={reset}><X size={16} /></button>
              {isVideo ? (
                <video src={preview} controls className="ba-preview-media" />
              ) : (
                <img src={preview} alt="Banner" className="ba-preview-media" />
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          {preview && (
            <>
              <textarea
                className="ba-caption-input"
                placeholder="Reklama matni (ixtiyoriy)..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
              />

              {error && <div className="pt-error">{error}</div>}
              {audienceCount === 0 && <div className="pt-error">Hozircha obunachilaringiz yo‘q. Reklama yuborish uchun avval mijozlar sizga obuna bo‘lishi kerak.</div>}

              <button className="ba-send-btn" onClick={handleSend} disabled={sending || audienceCount === 0}>
                {sending ? 'Yuborilmoqda...' : <><Send size={18} /> Obunachilarga yuborish</>}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
