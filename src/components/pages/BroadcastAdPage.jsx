// src/components/pages/BroadcastAdPage.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Send, Image as ImageIcon, Video, Users, X } from 'lucide-react';
import api from '../services/api';
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
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
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
      const res = await api.post('/broadcast/ad', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setCaption('');
    setResult(null);
    setError('');
  };

  return (
    <div className="ba-page">
      <button className="BackActionBtn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Orqaga
      </button>

      <div className="ba-header">
        <h1><Send size={22} /> Reklama tarqatish</h1>
        <p className="ba-subtitle">
          Banner yoki video yuklang — u sizdan avval buyurtma bergan{' '}
          <strong>barcha do'konchilarga</strong> avtomatik yuboriladi
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
              <span className="ba-upload-hint">JPG, PNG, MP4 — 100MB gacha</span>
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

              <button className="ba-send-btn" onClick={handleSend} disabled={sending}>
                {sending ? 'Yuborilmoqda...' : <><Send size={18} /> Barcha mijozlarga yuborish</>}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}