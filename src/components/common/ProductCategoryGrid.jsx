// Marketplace tovar kategoriyalari — qatorda 5 ta, rasm bilan (OLX ilovasidagidek).
// 2 qator: 9 ta kategoriya + "Hammasi" tugmasi — u barcha kategoriyalar oynasini ochadi.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import CategoryModal from './CategoryModal';
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
  const [open, setOpen] = useState(false);
  if (!categories.length) return null;

  const canCollapse = categories.length > COLLAPSED + 1;
  const visible = canCollapse ? categories.slice(0, COLLAPSED) : categories;

  return (
    <div className="pcg-grid">
      {visible.map((category) => <CategoryTile key={category.id} category={category} />)}
      {canCollapse && (
        <button type="button" className="pcg-tile pcg-tile--more" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <span className="pcg-tile__media"><LayoutGrid size={38} strokeWidth={2.4} /></span>
          <span className="pcg-tile__name">{T('Hammasi')}</span>
        </button>
      )}
      {open && <CategoryModal categories={categories} onClose={() => setOpen(false)} />}
    </div>
  );
}
