/* ============================================================
   SEARCH OVERLAY — qayta ishlatiladigan to'liq ekranli qidiruv
   OLX uslubi: trigger bosiladi → overlay ochiladi → "Oxirgi
   qidiruvlar" ro'yxati ko'rinadi → tanlanadi yoki yoziladi
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Clock, Tag, Package } from 'lucide-react';
import '../../styles/searchOverlay.css';

const MAX_RECENT = 10;

function readRecent(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed).filter((item) => typeof item === 'string' && item.trim()).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function writeRecent(storageKey, list) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(list));
  } catch {
    // localStorage yo'q bo'lsa — jim o'tamiz, dastur buzilmaydi
  }
}

export default function SearchOverlay({
  isOpen,
  onClose,
  onSearch,
  storageKey = 'zumo_recent_search',
  placeholder,
  initialValue = '',
  suggestions = [],
  onSelectSuggestion,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [value, setValue] = useState(initialValue);
  const [recent, setRecent] = useState([]);

  /* Overlay ochilganda: inputni to'ldirish, tarixni o'qish, fokus berish */
  useEffect(() => {
    if (!isOpen) return undefined;

    setValue(initialValue);
    setRecent(readRecent(storageKey));

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 60);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen, initialValue, storageKey]);

  /* Esc tugmasi bilan yopish */
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commitSearch = (term) => {
    const trimmed = term.trim();
    onSearch(trimmed);

    if (trimmed) {
      const next = [
        trimmed,
        ...recent.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, MAX_RECENT);

      setRecent(next);
      writeRecent(storageKey, next);
    }

    onClose();
  };

  const removeRecentItem = (event, item) => {
    event.stopPropagation();
    const next = recent.filter((entry) => entry !== item);
    setRecent(next);
    writeRecent(storageKey, next);
  };

  const clearAllRecent = () => {
    setRecent([]);
    writeRecent(storageKey, []);
  };

  const normalizedQuery = value.trim().toLocaleLowerCase('uz-UZ');
  const matchingSuggestions = normalizedQuery
    ? suggestions
      .filter((item) => typeof item?.label === 'string' && item.label.toLocaleLowerCase('uz-UZ').startsWith(normalizedQuery))
      .slice(0, 8)
    : [];

  const selectSuggestion = (suggestion) => {
    const term = suggestion.label.trim();
    if (term) {
      const next = [term, ...recent.filter((item) => item.toLocaleLowerCase('uz-UZ') !== term.toLocaleLowerCase('uz-UZ'))].slice(0, MAX_RECENT);
      setRecent(next);
      writeRecent(storageKey, next);
    }
    if (onSelectSuggestion) onSelectSuggestion(suggestion);
    else onSearch(term);
    onClose();
  };

  return (
    <div className="search-overlay" role="dialog" aria-modal="true">
      {/* ===== Yuqori panel: input + Bekor qilish ===== */}
      <div className="search-overlay__header">
        <div className="search-overlay__input-wrap">
          <Search size={18} />
          <input
            ref={inputRef}
            type="text"
            value={value}
            placeholder={placeholder || t('common.searchPlaceholder', 'Nima qidiryapsiz?')}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitSearch(value);
            }}
          />
          {value && (
            <button
              type="button"
              className="search-overlay__input-clear"
              onClick={() => setValue('')}
              aria-label={t('marketplacePage.clearSearch', 'Tozalash')}
            >
              ✕
            </button>
          )}
        </div>

        <button type="button" className="search-overlay__cancel" onClick={onClose}>
          {t('common.cancel', 'Bekor qilish')}
        </button>
      </div>

      {/* ===== Pastki panel: Oxirgi qidiruvlar ===== */}
      <div className="search-overlay__body">
        {normalizedQuery ? (
          matchingSuggestions.length > 0 ? (
            <>
              <div className="search-overlay__recent-header">
                <span>{t('common.suggestions', 'Mos natijalar')}</span>
              </div>
              <ul className="search-overlay__recent-list">
                {matchingSuggestions.map((suggestion) => {
                  const Icon = suggestion.kind === 'category' ? Tag : Package;
                  return (
                    <li key={`${suggestion.kind || 'item'}-${suggestion.id || suggestion.label}`} onClick={() => selectSuggestion(suggestion)}>
                      <span className="search-overlay__recent-icon"><Icon size={15} /></span>
                      <span className="search-overlay__recent-text">{suggestion.label}</span>
                      {suggestion.hint && <span className="search-overlay__suggestion-hint">{suggestion.hint}</span>}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="search-overlay__empty">
              <Search size={32} />
              <p>{t('marketplacePage.noResults', 'Mos kategoriya yoki e’lon topilmadi')}</p>
            </div>
          )
        ) : recent.length > 0 ? (
          <>
            <div className="search-overlay__recent-header">
              <span>{t('common.recentSearches', 'Oxirgi qidiruvlar')}</span>
              <button type="button" onClick={clearAllRecent}>
                {t('common.clearAll', 'Tozalash')}
              </button>
            </div>

            <ul className="search-overlay__recent-list">
              {recent.map((item) => (
                <li key={item} onClick={() => commitSearch(item)}>
                  <span className="search-overlay__recent-icon">
                    <Clock size={15} />
                  </span>
                  <span className="search-overlay__recent-text">{item}</span>
                  <button
                    type="button"
                    className="search-overlay__recent-remove"
                    onClick={(event) => removeRecentItem(event, item)}
                    aria-label="O‘chirish"
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="search-overlay__empty">
            <Search size={32} />
            <p>{t('common.noRecentSearches', 'Hozircha qidiruvlar yo‘q')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
