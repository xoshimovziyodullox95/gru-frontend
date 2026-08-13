// src/components/common/AITextEnhanceButton.jsx
//
// Foydalanish: <AITextEnhanceButton value={text} onChange={setText} />
// Textarea/input ustiga, o'ng burchakka joylashtiriladi.

import { useState, useRef, useEffect } from 'react';
import { Sparkles, SpellCheck, Wand2, Combine, Loader2 } from 'lucide-react';
import api from '../services/api';
import '../../styles/aienhance.css'

export default function AITextEnhanceButton({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
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
    setLoading(true);
    setLoadingMode(mode);
    try {
      const res = await api.post('/ai/enhance-text', { text: value, mode });
      onChange(res.data.enhancedText);
      setOpen(false);
    } catch (err) {
      alert("AI xatolik: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
      setLoadingMode(null);
    }
  };

  return (
    <div className="ai-enhance-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`ai-enhance-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        disabled={disabled}
        title="AI bilan yaxshilash"
      >
        <Sparkles size={15} />
        <span>AI</span>
      </button>

      <div className={`ai-enhance-menu ${open ? 'ai-enhance-menu-open' : ''}`}>
        <button type="button" onClick={() => handleEnhance('fix')} disabled={loading}>
          {loading && loadingMode === 'fix' ? <Loader2 size={14} className="ai-spin" /> : <SpellCheck size={14} />}
          Imloni tuzatish
        </button>
        <button type="button" onClick={() => handleEnhance('expand')} disabled={loading}>
          {loading && loadingMode === 'expand' ? <Loader2 size={14} className="ai-spin" /> : <Wand2 size={14} />}
          Batafsilroq qilish
        </button>
        <button type="button" onClick={() => handleEnhance('both')} disabled={loading}>
          {loading && loadingMode === 'both' ? <Loader2 size={14} className="ai-spin" /> : <Combine size={14} />}
          Ikkalasini ham
        </button>
      </div>
    </div>
  );
}