import { Link } from 'react-router-dom';
import { Boxes } from 'lucide-react';

export default function CategoryCard({
  title,
  icon: Icon = Boxes,
  colors = ['#00c8f8', '#1267d8'],
  linkTo,
  delay = 0,
}) {
  const [colorFrom, colorTo] = colors;

  return (
    <Link
      to={linkTo}
      className="cat-card-modern"
      style={{
        '--cat-color-from': colorFrom,
        '--cat-color-to': colorTo,
        '--cat-animation-delay': `${delay}s`,
      }}
      aria-label={title}
    >
      <span className="cat-card-shape">
        <span className="cat-card-light" aria-hidden="true" />

        <Icon
          className="cat-card-svg"
          size={31}
          strokeWidth={1.9}
          aria-hidden="true"
        />

        <span className="cat-card-shine" aria-hidden="true" />
      </span>

      <span className="cat-card-title">{title}</span>
    </Link>
  );
}