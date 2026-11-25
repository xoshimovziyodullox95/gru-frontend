// "Kategoriya" oynasi: qidiruv + barcha kategoriyalar katakchalari. Bosilsa — o'sha kategoriya kataloqi ochiladi.
// Telefonda pastdan chiqadigan keng oyna, kompyuterda markazdagi dialog.
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { categoryPath } from '../utils/productCategories';
import useEscapeClose from '../hooks/useEscapeClose';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { T } from '../utils/T';
import '../../styles/categoryModal.css';

const norm = (v) => String(v || '').toLocaleLowerCase('uz-UZ');

function Tile({ category, onPick }) {
  const [failed, setFailed] = useState(false);
  const Icon = category.icon;
  return (
    <button type="button" className="cm-tile" onClick={() => onPick(category)}>
      <span className="cm-tile__name">{category.name}</span>
      {category.image && !failed ? (
        <img className="cm-tile__img" src={category.image} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <Icon className="cm-tile__icon" size={44} strokeWidth={1.6} aria-hidden="true" />
      )}
    </button>
  );
}

export default function CategoryModal({ categories, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  // Ikkinchi bosqich: kategoriya tanlangach uning ichki bo'limlari (alohida katalog) ro'yxati ochiladi
  const [active, setActive] = useState(null);
  // "Orqaga" tugmasi avval ichki bo'limlardan ro'yxatga qaytaradi, keyin oynani yopadi
  useEscapeClose(true, () => (active ? setActive(null) : onClose()));
  useBodyScrollLock(true);

  const list = useMemo(() => {
    const q = norm(query).trim();
    if (!q) return categories;
    return categories.filter((c) => norm(c.name).includes(q) || c.subs.some((s) => norm(s.name).includes(q)));
  }, [categories, query]);

  const openCatalog = (category, subId) => {
    onClose();
    navigate(categoryPath(category.id, subId));
  };

  if (active) {
    const Icon = active.icon;
    return createPortal(
      <div className="cm-overlay" onClick={onClose}>
        <div className="cm-sheet" role="dialog" aria-modal="true" aria-label={active.name} onClick={(e) => e.stopPropagation()}>
          <header className="cm-head">
            <button type="button" className="cm-back" onClick={() => setActive(null)} aria-label={T('Orqaga')}>
              <ChevronLeft size={24} />
            </button>
            <h2>{active.name}</h2>
            <button type="button" className="cm-close" onClick={onClose} aria-label={T('Yopish')}>
              <X size={22} />
            </button>
          </header>
          <div className="cm-scroll">
            <ul className="cm-list">
              <li>
                <button type="button" className="cm-row cm-row--all" onClick={() => openCatalog(active)}>
                  <span className="cm-row__icon">
                    {active.image ? <img src={active.image} alt="" /> : <Icon size={22} />}
                  </span>
                  <span className="cm-row__name">{T('Barcha e’lonlar')}</span>
                  <ChevronRight size={20} />
                </button>
              </li>
              {active.subs.map((sub) => (
                <li key={sub.id}>
                  <button type="button" className="cm-row" onClick={() => openCatalog(active, sub.id)}>
                    <span className="cm-row__name">{sub.name}</span>
                    <ChevronRight size={20} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="cm-overlay" onClick={onClose}>
      <div className="cm-sheet" role="dialog" aria-modal="true" aria-label={T('Kategoriya')} onClick={(e) => e.stopPropagation()}>
        <header className="cm-head">
          <h2>{T('Kategoriya')}</h2>
          <button type="button" className="cm-close" onClick={onClose} aria-label={T('Yopish')}>
            <X size={22} />
          </button>
        </header>
        <div className="cm-search">
          <Search size={18} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={T('Topish')}
            enterKeyHint="search"
          />
        </div>
        <div className="cm-scroll">
          {list.length ? (
            <div className="cm-grid">
              {list.map((c) => <Tile key={c.id} category={c} onPick={setActive} />)}
            </div>
          ) : (
            <p className="cm-empty">{T('Hech narsa topilmadi')}</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
