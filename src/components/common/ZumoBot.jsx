// "Zumik" — tanishtiruv roboti. angle berilsa o'ng qo'li shu tomonga (gradus, 0 = o'ngga,
// 90 = pastga) ishora qiladi; berilmasa qo'l silkitib salomlashadi (still — qo'l pastda, tinch).
// talking — matn yozilayotganda og'zi qimirlaydi.
import { useId } from 'react';
import '../../styles/zumoBot.css';

export default function ZumoBot({ angle = null, size = 72, className = '', talking = false, still = false }) {
  const pointing = typeof angle === 'number' && Number.isFinite(angle);
  // Sahifada bir nechta robot bo'lsa gradient id to'qnashmasin
  const shell = `zumoBotShell-${useId().replace(/:/g, '')}`;
  const fill = `url(#${shell})`;
  return (
    <svg
      className={`zumo-bot ${className}`}
      width={size}
      height={size}
      viewBox="0 0 80 80"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={shell} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3fe6ff" />
          <stop offset="1" stopColor="#0a84e0" />
        </linearGradient>
      </defs>

      <g className="zumo-bot__float">
        {/* antenna */}
        <line x1="40" y1="9" x2="40" y2="17" stroke="#7fdcff" strokeWidth="2.4" strokeLinecap="round" />
        <circle className="zumo-bot__beacon" cx="40" cy="7" r="3.4" fill="#ffd166" />

        {/* chap qo'l — doim pastda */}
        <rect x="14" y="54" width="6" height="15" rx="3" fill={fill} transform="rotate(18 17 55)" />

        {/* tana */}
        <rect x="23" y="51" width="34" height="21" rx="9" fill={fill} />
        <path d="M34 58h12l-11 8h12" fill="none" stroke="#06223f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />

        {/* bosh */}
        <rect x="13" y="16" width="54" height="37" rx="15" fill={fill} />
        <rect x="19" y="23" width="42" height="22" rx="11" fill="#06162e" />
        <g className="zumo-bot__eyes">
          <circle cx="31.5" cy="33" r="3.6" fill="#7ff3ff" />
          <circle cx="48.5" cy="33" r="3.6" fill="#7ff3ff" />
        </g>
        {talking
          ? <ellipse className="zumo-bot__mouth--talk" cx="40" cy="40" rx="4" ry="2.4" fill="#7ff3ff" />
          : <path d="M35 39.5q5 3.4 10 0" fill="none" stroke="#7ff3ff" strokeWidth="2" strokeLinecap="round" />}
        <circle cx="22" cy="40" r="2.4" fill="#ff8fb1" opacity=".55" />
        <circle cx="58" cy="40" r="2.4" fill="#ff8fb1" opacity=".55" />

        {/* o'ng qo'l — ishora qiluvchi (yelka: 58,58) */}
        <g
          className={`zumo-bot__arm ${pointing || still ? '' : 'zumo-bot__arm--wave'}`}
          style={pointing ? { transform: `rotate(${angle}deg)` } : still ? { transform: 'rotate(75deg)' } : undefined}
        >
          <rect x="56" y="55.3" width="21" height="5.4" rx="2.7" fill={fill} />
          <circle cx="79" cy="58" r="5.2" fill="#e8fbff" stroke="#0a84e0" strokeWidth="1.4" />
          <rect x="82" y="56.5" width="8" height="3" rx="1.5" fill="#e8fbff" stroke="#0a84e0" strokeWidth="1" />
        </g>
        <circle cx="58" cy="58" r="3.4" fill="#0a84e0" />
      </g>
    </svg>
  );
}

// Yelkaning SVG ichidagi nisbiy joyi — ZumoGuide qo'l burchagini shu nuqtadan hisoblaydi
ZumoBot.SHOULDER = { x: 58 / 80, y: 58 / 80 };
