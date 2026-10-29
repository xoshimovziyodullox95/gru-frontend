// AI javoblarini xavfsiz markdown sifatida ko'rsatish (xom HTML ishlatilmaydi).
// Ichki havolalar (/equipment/..) ilova ichida, tashqi havolalar yangi oynada ochiladi.
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';

const SAFE_PROTOCOL = /^(https?:|mailto:|tel:|\/)/i;

function MdLink({ href = '', children }) {
  if (!SAFE_PROTOCOL.test(href)) return <span>{children}</span>; // javascript: va h.k. — havola emas
  if (href.startsWith('/')) return <Link to={href}>{children}</Link>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  );
}

const COMPONENTS = {
  a: MdLink,
  // Jadval keng bo'lsa gorizontal aylantiriladi (telefon ekrani)
  table: ({ children }) => (
    <div className="ai-md-table">
      <table>{children}</table>
    </div>
  ),
  img: () => null, // model yuborgan tashqi rasmlarni ko'rsatmaymiz
};

export default function AiMarkdown({ children }) {
  return (
    <div className="ai-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {String(children || '')}
      </ReactMarkdown>
    </div>
  );
}
