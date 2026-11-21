// "Zumik" — tanishtiruv roboti. angle berilsa o'ng qo'li shu tomonga (gradus, 0 = o'ngga,
// 90 = pastga) ishora qiladi; berilmasa qo'l silkitib salomlashadi (still — qo'l pastda, tinch).
// talking — matn yozilayotganda og'zi qimirlaydi.
import { useId } from 'react';
import '../../styles/zumoBot.css';

export default function ZumoBot({ angle = null, size = 72, className = '', talking = false, still = false, emotion = 'neutral' }) {
  const pointing = typeof angle === 'number' && Number.isFinite(angle);
  const isHappy = emotion === 'happy';
  const isThinking = emotion === 'thinking';
  const isSad = emotion === 'sad';
  const isSurprised = emotion === 'surprised';
  const isLove = emotion === 'love';
  const isAngry = emotion === 'angry';
  // Sahifada bir nechta robot bo'lsa gradient id to'qnashmasin
  const shell = `zumoBotShell-${useId().replace(/:/g, '')}`;
  const fill = `url(#${shell})`;
  const eye = isAngry ? '#ff8a8a' : '#7ff3ff';
  return (
    <svg
      className={`zumo-bot zumo-bot--${emotion} ${className}`}
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
          {isHappy || isLove ? (
            <>
              <path d="M28 34q3.5-4 7 0" fill="none" stroke="#7ff3ff" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M45 34q3.5-4 7 0" fill="none" stroke="#7ff3ff" strokeWidth="2.6" strokeLinecap="round" />
            </>
          ) : isSad ? (
            <>
              <path d="M28 35q3.5-3.2 7 0" fill="none" stroke="#7ff3ff" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M45 35q3.5-3.2 7 0" fill="none" stroke="#7ff3ff" strokeWidth="2.4" strokeLinecap="round" />
            </>
          ) : isAngry ? (
            <>
              <path d="M26 27.5l9 3" stroke={eye} strokeWidth="2.6" strokeLinecap="round" />
              <path d="M54 27.5l-9 3" stroke={eye} strokeWidth="2.6" strokeLinecap="round" />
              <circle cx="31.5" cy="34" r="3" fill={eye} />
              <circle cx="48.5" cy="34" r="3" fill={eye} />
            </>
          ) : isSurprised ? (
            <>
              <circle cx="31.5" cy="33" r="4.6" fill="#7ff3ff" />
              <circle cx="48.5" cy="33" r="4.6" fill="#7ff3ff" />
            </>
          ) : (
            <>
              <circle cx={isThinking ? 30 : 31.5} cy={isThinking ? 30.5 : 33} r="3.6" fill="#7ff3ff" />
              <circle cx={isThinking ? 47 : 48.5} cy={isThinking ? 30.5 : 33} r="3.6" fill="#7ff3ff" />
            </>
          )}
        </g>
        {isSad && <path className="zumo-bot__tear" d="M30 38.5q-2 3.2 0 4.6q2-1.4 0-4.6Z" fill="#9be7ff" />}
        {talking
          ? <ellipse className="zumo-bot__mouth--talk" cx="40" cy="40" rx="4" ry="2.4" fill="#7ff3ff" />
          : isHappy || isLove
          ? <path d="M33 38.5q7 6 14 0" fill="none" stroke="#7ff3ff" strokeWidth="2.4" strokeLinecap="round" />
          : isSad
          ? <path d="M34 42q6-4 12 0" fill="none" stroke="#7ff3ff" strokeWidth="2" strokeLinecap="round" />
          : isAngry
          ? <path d="M34 42.5q6-3.4 12 0" fill="none" stroke={eye} strokeWidth="2.4" strokeLinecap="round" />
          : isSurprised
          ? <ellipse cx="40" cy="40.5" rx="2.6" ry="3.2" fill="#7ff3ff" />
          : isThinking
          ? <circle cx="40" cy="40" r="1.8" fill="#7ff3ff" />
          : <path d="M35 39.5q5 3.4 10 0" fill="none" stroke="#7ff3ff" strokeWidth="2" strokeLinecap="round" />}
        {isLove ? (
          <>
            <path d="M19.5 38.6c-1.6-1.6-4.1-.4-4.1 1.5 0 1.7 2.4 3.1 4.1 4.4 1.7-1.3 4.1-2.7 4.1-4.4 0-1.9-2.5-3.1-4.1-1.5Z" fill="#ff8fb1" />
            <path d="M55.5 38.6c-1.6-1.6-4.1-.4-4.1 1.5 0 1.7 2.4 3.1 4.1 4.4 1.7-1.3 4.1-2.7 4.1-4.4 0-1.9-2.5-3.1-4.1-1.5Z" fill="#ff8fb1" />
          </>
        ) : (
          <>
            <circle cx="22" cy="40" r="2.4" fill={isAngry ? '#ff5c5c' : '#ff8fb1'} opacity={isHappy || isAngry ? .9 : .55} />
            <circle cx="58" cy="40" r="2.4" fill={isAngry ? '#ff5c5c' : '#ff8fb1'} opacity={isHappy || isAngry ? .9 : .55} />
          </>
        )}
        {isLove && (
          <g className="zumo-bot__hearts">
            <path d="M66 14c-1.2-1.2-3.1-.3-3.1 1.1 0 1.3 1.8 2.3 3.1 3.3 1.3-1 3.1-2 3.1-3.3 0-1.4-1.9-2.3-3.1-1.1Z" fill="#ff6f9c" />
            <path d="M72 6c-.9-.9-2.3-.2-2.3.8 0 1 1.3 1.7 2.3 2.5 1-.8 2.3-1.5 2.3-2.5 0-1-1.4-1.7-2.3-.8Z" fill="#ff8fb1" />
          </g>
        )}
        {isAngry && (
          <g className="zumo-bot__steam" fill="none" stroke="#ff9a9a" strokeWidth="2" strokeLinecap="round">
            <path d="M10 18q-3-3 0-6" />
            <path d="M70 18q3-3 0-6" />
          </g>
        )}
        {isThinking && (
          <g className="zumo-bot__think">
            <circle cx="64" cy="13" r="1.6" fill="#bfefff" />
            <circle cx="69" cy="8" r="2.2" fill="#bfefff" />
            <circle cx="75" cy="2.5" r="2.8" fill="#bfefff" />
          </g>
        )}

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
