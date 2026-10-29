// Marketplace tovar kategoriyalari — qatorda 5 ta, rasm bilan (OLX ilovasidagidek).
// Yig'iq holatda 2 qator: 9 ta kategoriya + "Hammasi" tugmasi.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, LayoutGrid } from 'lucide-react';
import { categoryPath } from '../utils/productCategories';
import { T } from '../utils/T';
import '../../styles/productCategoryGrid.css';

const COLLAPSED = 9;

function CategoryTile({ category }) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = category.icon;
  return (
    <Link
      to={categoryPath(category.id)}
      className="pcg-tile"
      aria-label={category.name}
      style={{ '--pcg-from': category.colors[0], '--pcg-to': category.colors[1] }}
    >
      <span className="pcg-tile__media">
        {category.image && !imageFailed ? (
          <img
            className="pcg-tile__image"
            src={category.image}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : <Icon className="pcg-tile__fallback" size={36} strokeWidth={2} aria-hidden="true" />}
      </span>
      <span className="pcg-tile__name">{category.short}</span>
    </Link>
  );
}

export default function ProductCategoryGrid({ categories }) {
  const [expanded, setExpanded] = useState(false);
  if (!categories.length) return null;

  const canCollapse = categories.length > COLLAPSED + 1;
  const visible = expanded || !canCollapse ? categories : categories.slice(0, COLLAPSED);

  return (
    <div className="pcg-grid">
      {visible.map((category) => <CategoryTile key={category.id} category={category} />)}
      {canCollapse && (
        <button type="button" className="pcg-tile pcg-tile--more" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          <span className="pcg-tile__media">
            {expanded ? <ChevronUp size={38} strokeWidth={2.4} /> : <LayoutGrid size={38} strokeWidth={2.4} />}
          </span>
          <span className="pcg-tile__name">{expanded ? T('Yig‘ish') : T('Hammasi')}</span>
        </button>
      )}
    </div>
  );
}
