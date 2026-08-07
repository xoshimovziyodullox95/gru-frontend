import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import './EntrepreneursSlider.css';

const entrepreneurs = [
  { id: 1, name: 'Zafar Hoshimov', title: 'Korzinka.uz asoschisi', slogan: 'Biznesda eng asosiysi — mijozning ishonchi va har kuni to‘xtovsiz harakat qilish.', image: '/images/entrepreneurs/zafar-hoshimov.jpg' },
  { id: 2, name: 'Baxtiyor Fazilov', title: 'Yirik agro-klasterlar rahbari', slogan: 'Zamonaviy texnologiyalarsiz va tizimli yondashuvsiz qishloq xo‘jaligida yirik natijaga erishib bo‘lmaydi.', image: '/images/entrepreneurs/baxtiyor-fazilov.jpg' },
  { id: 3, name: 'Elon Musk', title: 'Tesla, SpaceX asoschisi', slogan: 'Agar biror narsa juda muhim bo‘lsa, hatto barcha imkoniyatlar sizga qarshi bo‘lsa ham, baribir uni amalga oshiring.', image: '/images/entrepreneurs/elon-musk.jpg' },
  { id: 4, name: 'Hikmat Abdurahmonov', title: 'HM Partners asoschisi', slogan: 'Tadbirkorlik — bu doimiy o‘rganish, tavakkal qilish va kuchli jamoani shakllantirish san’atidir.', image: '/images/entrepreneurs/hikmat-abdurahmonov.jpg' },
  { id: 5, name: 'Alisher Sadullayev', title: 'Yoshlar tadbirkorligi yetakchisi', slogan: 'Bugungi yosh tadbirkor — ertangi iqtisodiyot poydevori. Imkoniyat bor joyda natija bo‘ladi.', image: '/images/entrepreneurs/alisher-sadullayev.jpg' }
];

export default function EntrepreneursSlider() {
  const [index, setIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Random indeks bilan boshlash
  useEffect(() => {
    setIndex(Math.floor(Math.random() * entrepreneurs.length));
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % entrepreneurs.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const next = () => setIndex((prev) => (prev + 1) % entrepreneurs.length);
  const prev = () => setIndex((prev) => (prev - 1 + entrepreneurs.length) % entrepreneurs.length);
  const current = entrepreneurs[index];

  return (
    <div className="entrepreneurs-slider">
      <button className="slider-nav prev" onClick={prev}><ChevronLeft size={24} /></button>
      <div className="slider-content">
        <div className="slider-image"><img src={current.image} alt={current.name} onError={(e) => e.target.src = '/images/placeholder.jpg'} /></div>
        <div className="slider-text">
          <Quote size={32} className="quote-icon" />
          <p className="slogan">{current.slogan}</p>
          <h4 className="name">{current.name}</h4>
          <p className="title">{current.title}</p>
        </div>
      </div>
      <button className="slider-nav next" onClick={next}><ChevronRight size={24} /></button>
    </div>
  );
}