// src/components/common/AIEnhancedTextarea.jsx
//
// To'liq, ichida AI tugmasi VA yuklanish animatsiyasi bo'lgan textarea.
// Foydalanish (oddiy <textarea> o'rniga):
// <AIEnhancedTextarea
//   name="description"
//   rows={4}
//   value={formData.description}
//   onChange={(newVal) => setFormData(prev => ({ ...prev, description: newVal }))}
//   placeholder="..."
// />

import { useState, useRef, useEffect } from 'react';
import { Sparkles, SpellCheck, Wand2, Combine, Check } from 'lucide-react';
import api from '../services/api';

export default function AIEnhancedTextarea({ value, onChange, placeholder, rows = 4, name, disabled }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEnhance = async (mode) => {
    if (!value || !value.trim()) {
      alert("Avval matn kiriting");
      return;
    }
    setMenuOpen(false);
    setLoading(true);
    try {
      const res = await api.post('/ai/enhance-text', { text: value, mode });
      onChange(res.data.enhancedText);
      setLoading(false);
      setJustFinished(true);
      setTimeout(() => setJustFinished(false), 1200);
    } catch (err) {
      setLoading(false);
      alert("AI xatolik: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="aet-wrap" ref={wrapRef}>
      <div className="aet-header">
        <button
          type="button"
          className={`aet-trigger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          disabled={disabled || loading}
          title="AI bilan yaxshilash"
        >
          <Sparkles size={15} />
          <span>AI</span>
        </button>

        <div className={`aet-menu ${menuOpen ? 'aet-menu-open' : ''}`}>
          <button type="button" onClick={() => handleEnhance('fix')}>
            <SpellCheck size={14} /> Imloni tuzatish
          </button>
          <button type="button" onClick={() => handleEnhance('expand')}>
            <Wand2 size={14} /> Batafsilroq qilish
          </button>
          <button type="button" onClick={() => handleEnhance('both')}>
            <Combine size={14} /> Ikkalasini ham
          </button>
        </div>
      </div>

      <div className="aet-textarea-container">
        <textarea
          name={name}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || loading}
          className={justFinished ? 'aet-flash' : ''}
        />

        {/* 🔥 YUKLANISH OVERLAY — INPUTNI TO'LIQ YOPADI */}
        {loading && (
          <div className="aet-loading-overlay">
            <div className="aet-shimmer" />
            <div className="aet-loading-content">
              <div className="aet-orb-wrap">
                <span className="aet-orb aet-orb-1" />
                <span className="aet-orb aet-orb-2" />
                <span className="aet-orb aet-orb-3" />
              </div>
              <span className="aet-loading-text">AI matningizni yaxshilamoqda...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}