import { Link } from 'react-router-dom';

// Har bir kategoriya uchun gradient ranglar
const COLOR_PALETTE = [
  ['#22c55e', '#0d9c56'], // yashil — Agro
  ['#f97316', '#c2410c'], // to'q sariq — Restoran/Kafe
  ['#3b82f6', '#1d4ed8'], // ko'k — Klinika
  ['#a855f7', '#7e22ce'], // binafsha — Ko'ngilochar
  ['#ef4444', '#b91c1c'], // qizil — Service
  ['#14b8a6', '#0f766e'], // firuza — Ta'lim
  ['#eab308', '#a16207'], // sariq — Do'konlar
  ['#ec4899', '#be185d'], // pushti — Yangi biznes
];

export default function CategoryCard({ title, emoji, imageUrl, linkTo, delay = 0, colorIndex = 0 }) {
  const [colorFrom, colorTo] = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];

  return (
    <Link
      to={linkTo}
      className="cat-card-modern"
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className="cat-card-shape"
        style={{ background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})` }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="cat-card-img"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <span className="cat-card-emoji" style={{ display: imageUrl ? 'none' : 'flex' }}>
          {emoji}
        </span>
        <div className="cat-card-glow"></div>
      </div>
      <span className="cat-card-title">{title}</span>
    </Link>
  );
}