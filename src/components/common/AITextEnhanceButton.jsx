// src/components/common/AITextEnhanceButton.jsx
//
// Foydalanish: <AITextEnhanceButton value={text} onChange={setText} />
// Textarea ustiga qo'yiladi — doim ko'rinib turadigan AI tugmalari qatori.

import { useState } from 'react';
import { Sparkles, SpellCheck, Wand2, Combine, Loader2, Undo2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

import { T } from '../utils/T';

const ACTIONS = [
  { mode: 'fix', icon: SpellCheck, label: T('Imloni tuzatish') },
  { mode: 'expand', icon: Wand2, label: T('Uzaytirish') },
  { mode: 'both', icon: Combine, label: T('Ikkalasi') },
];

export default function AITextEnhanceButton({ value, onChange, disabled }) {
  const [loadingMode, setLoadingMode] = useState(null);
  // AI natijasi yoqmasa — oldingi matnga qaytish uchun
  const [previous, setPrevious] = useState(null);

  const handleEnhance = async (mode) => {
    if (!value || value.trim().length < 5) {
      toast(T('Avval bir-ikki gap yozing — AI uni tuzatib, chiroyli qilib beradi'));
      return;
    }
    setLoadingMode(mode);
    try {
      const res = await api.post('/ai/enhance-text', { text: value, mode });
      setPrevious(value);
      onChange(res.data.enhancedText);
    } catch (err) {
      toast.error(err.response?.data?.error || T('AI hozir javob bermadi, birozdan so‘ng urinib ko‘ring'));
    } finally {
      setLoadingMode(null);
    }
  };

  const handleUndo = () => {
    onChange(previous);
    setPrevious(null);
  };

  const busy = Boolean(loadingMode);

  return (
    <div className={`ai-bar ${busy ? 'is-busy' : ''}`}>
      <span className="ai-bar__label">
        <Sparkles size={14} /> {T('AI yordamchi')}
      </span>
      <div className="ai-bar__actions">
        {ACTIONS.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            type="button"
            className={`ai-chip ${loadingMode === mode ? 'is-loading' : ''}`}
            onClick={() => handleEnhance(mode)}
            disabled={disabled || busy}
          >
            {loadingMode === mode ? <Loader2 size={14} className="ai-spin" /> : <Icon size={14} />}
            {label}
          </button>
        ))}
        {previous !== null && !busy && (
          <button type="button" className="ai-chip ai-chip--undo" onClick={handleUndo}>
            <Undo2 size={14} /> {T('Qaytarish')}
          </button>
        )}
      </div>
    </div>
  );
}
