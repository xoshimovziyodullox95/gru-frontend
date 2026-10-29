import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Trash2, Search } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { getImageUrl } from '../utils/imageUrl';
import { safeGoBack } from '../utils/navigation.js';
import '../../styles/savedListings.css';

import { T } from '../utils/T';
const TYPE_LABELS = {
  location: 'Joy',
  equipment: 'Tovar',
  service: 'Xizmat',
};

export default function SavedListingsPage() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavorites();

  return (
    <main className="saved-listings">
      <header className="saved-listings__header">
        <button type="button" onClick={() => safeGoBack(navigate)} aria-label={T('Orqaga')}>
          <ArrowLeft size={19} />
        </button>
        <div>
          <span className="saved-listings__eyebrow">ZUMO</span>
          <h1>{T('Saqlangan e’lonlar')}</h1>
        </div>
        <span className="saved-listings__count">{favorites.length}</span>
      </header>

      {favorites.length ? (
        <section className="saved-listings__grid" aria-label={T('Saqlangan e’lonlar ro‘yxati')}>
          {favorites.map((item) => (
            <article className="saved-listing-card" key={`${item.type}-${item.id}`}>
              <button
                type="button"
                className="saved-listing-card__image"
                onClick={() => item.link && navigate(item.link)}
                aria-label={T('{{v}} sahifasini ochish', { v: item.title || 'E’lon' })}
                disabled={!item.link}
              >
                <img src={getImageUrl(item.image)} alt="" loading="lazy" />
                <span>{TYPE_LABELS[item.type] || T('E’lon')}</span>
              </button>
              <div className="saved-listing-card__body">
                <button
                  type="button"
                  className="saved-listing-card__title"
                  onClick={() => item.link && navigate(item.link)}
                  disabled={!item.link}
                >
                  {item.title || T('Nomsiz e’lon')}
                </button>
                <div className="saved-listing-card__footer">
                  <strong>{item.price || T('Narxi ko‘rsatilmagan')}</strong>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(item)}
                    aria-label={T('Saqlanganlardan olib tashlash')}
                  >
                    <Trash2 size={16} />
                    <span>{T('Olib tashlash')}</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="saved-listings__empty">
          <span className="saved-listings__empty-icon"><Heart size={27} /></span>
          <h2>{T('Hozircha saqlangan e’lon yo‘q')}</h2>
          <p>{T('Yoqtirgan e’lonlaringizdagi yurak belgisini bosing — ular shu yerda saqlanadi.')}</p>
          <button type="button" onClick={() => navigate('/marketplace/all')}>
            <Search size={17} /> {T('E’lonlarni ko‘rish')}
          </button>
        </section>
      )}
    </main>
  );
}
