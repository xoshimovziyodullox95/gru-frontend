// Yulduzchalar: ko'rsatish (value) yoki tanlash (onChange berilsa)
import { useState } from 'react';
import { Star } from 'lucide-react';
import { T } from '../utils/T';

export default function Stars({ value = 0, size = 16, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  if (!onChange) {
    return (
      <span className="rv-stars" role="img" aria-label={T('{{value}} / 5 yulduz', { value })}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={size} className={n <= Math.round(value) ? 'is-on' : ''} />
        ))}
      </span>
    );
  }

  return (
    <span className="rv-stars rv-stars--input" role="radiogroup" aria-label={T('Baho')} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={T('{{value}} yulduz', { value: n })}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
        >
          <Star size={size} className={n <= shown ? 'is-on' : ''} />
        </button>
      ))}
    </span>
  );
}
