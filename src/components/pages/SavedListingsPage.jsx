import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Trash2, Search } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { getImageUrl } from '../utils/imageUrl';
import { safeGoBack } from '../utils/navigation.js';
import '../../styles/savedListings.css';

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
        <button type="button" onClick={() => safeGoBack(navigate)} aria-label="Orqaga">
          <ArrowLeft size={19} />
        </button>
        <div>
          <span className="saved-listings__eyebrow">ZUMO</span>
          <h1>Saqlangan e’lonlar</h1>
        </div>
        <span className="saved-listings__count">{favorites.length}</span>
      </header>

      {favorites.length ? (
        <section className="saved-listings__grid" aria-label="Saqlangan e’lonlar ro‘yxati">
          {favorites.map((item) => (
            <article className="saved-listing-card" key={`${item.type}-${item.id}`}>
              <button
                type="button"
                className="saved-listing-card__image"
                onClick={() => item.link && navigate(item.link)}
                aria-label={`${item.title || 'E’lon'} sahifasini ochish`}
                disabled={!item.link}
              >
                <img src={getImageUrl(item.image)} alt="" loading="lazy" />
                <span>{TYPE_LABELS[item.type] || 'E’lon'}</span>
              </button>
              <div className="saved-listing-card__body">
                <button
                  type="button"
                  className="saved-listing-card__title"
                  onClick={() => item.link && navigate(item.link)}
                  disabled={!item.link}
                >
                  {item.title || 'Nomsiz e’lon'}
                </button>
                <div className="saved-listing-card__footer">
                  <strong>{item.price || 'Narxi ko‘rsatilmagan'}</strong>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(item)}
                    aria-label="Saqlanganlardan olib tashlash"
                  >
                    <Trash2 size={16} />
                    <span>Olib tashlash</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="saved-listings__empty">
          <span className="saved-listings__empty-icon"><Heart size={27} /></span>
          <h2>Hozircha saqlangan e’lon yo‘q</h2>
          <p>Yoqtirgan e’lonlaringizdagi yurak belgisini bosing — ular shu yerda saqlanadi.</p>
          <button type="button" onClick={() => navigate('/marketplace/all')}>
            <Search size={17} /> E’lonlarni ko‘rish
          </button>
        </section>
      )}
    </main>
  );
}
