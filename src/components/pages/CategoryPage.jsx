// src/pages/CategoryPage.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLevel2 } from '../services/categories';
import { ArrowLeft, Search, Wallet } from 'lucide-react';
import '../../styles/category-grid.css';

const imageMap = {
  // ==================== AGRO (20 ta) ====================
  "Issiqxona": "/images/categories/level2/issiqxona.jpg",
  "Intensiv bog'": "/images/categories/level2/intensiv_bog_.jpg",
  "Chorvachilik": "/images/categories/level2/molxona.jpg",          // ← kalit o‘zgardi
  "Parrandachilik": "/images/categories/level2/tovuqxona.jpg",      // ← kalit o‘zgardi
  "Baliqchilik": "/images/categories/level2/baliqxona.jpg",         // ← kalit o‘zgardi
  "Asalari xo'jaligi": "/images/categories/level2/asalari.jpg",
  "Gidroponika fermasi": "/images/categories/level2/gidroponika.jpg",
  "Sovutgichli omborxona": "/images/categories/level2/sovutgichli-ombor.jpg",
  "Agro-dron xizmati punkti": "/images/categories/level2/agro-dron.jpg",
  "Limonariy": "/images/categories/level2/limonariy.jpg",
  "Biogumus sexi": "/images/categories/level2/biogumus.jpg",
  "Dorivor o'simliklar plantatsiyasi": "/images/categories/level2/dorivor.jpg",
  "Quyosh panelli sug'orish stansiyasi": "/images/categories/level2/quyosh-sugorish.jpg",
  "Quyonchilik fermasi": "/images/categories/level2/quyon.jpg",
  "G'alla va poliz maydoni": "/images/categories/level2/galla.jpg",
  "Qo'ziqorinxona": "/images/categories/level2/goziqorin.jpg",
  "Don ombori (Elevator)": "/images/categories/level2/elevato.png",
  "Agro-eko zona": "/images/categories/level2/agro-eko.jpg",
  // "Yong'oqzor va bodomzor" – O'CHIRILDI (bu kategoriya yo'q)
  "Agro-texnika ijarasi punkti": "/images/categories/level2/agro-texnika.jpg",

  // ==================== DO'KONLAR (20 ta) ====================
  "Supermarket / Minimarket": "/images/categories/level2/supermarket.jpg",
  "Kiyim kechak": "/images/categories/level2/kiyim-kechak.jpg",
  "Maishiy texnika va elektronika do'koni": "/images/categories/level2/elektronika.jpg",
  "Kosmetika va parfyumeriya do'koni": "/images/categories/level2/kosmetika.jpg",
  "Qurilish materiallari do'koni": "/images/categories/level2/qurilish-materiallari.jpg",
  "Avto ehtiyot qismlar": "/images/categories/level2/avtozapchast.jpg",
  "Bolalar o'yinchoqlari va kiyimlari do'koni": "/images/categories/level2/bolalar-dokoni.jpg",
  "Kitob va kanselyariya do'koni": "/images/categories/level2/kitob.jpg",
  "Mebel va interyer saloni": "/images/categories/level2/mebel.jpg",
  "Sport anjomlari": "/images/categories/level2/sport.jpg",
  "Zargarlik buyumlari do'koni": "/images/categories/level2/zargarlik.jpg",
  "Smartfon va gadjetlar do'koni": "/images/categories/level2/gadjet.jpg",
  "Apteka": "/images/categories/level2/dorixona.jpg",
  "Gul va sovg'alar do'koni": "/images/categories/level2/gul.jpg",
  "Zoo-do'kon": "/images/categories/level2/zoo-dokon.jpg",
  "Xojalik": "/images/categories/level2/idish-tovoq.jpg",
  "Velosiped va skuterlar do'koni": "/images/categories/level2/velosiped.jpg",
  "Suvenirlar va milliy hunarmandchilik do'koni": "/images/categories/level2/suvenir.jpg",
  "Optika do'koni": "/images/categories/level2/optika.jpg",
  "Mato va pardalar do'koni": "/images/categories/level2/mato.jpg",

  // ==================== KLINIKA (20 ta) ====================
  "Stomatologiya": "/images/categories/level2/stomatologiya.jpg",
  "Diagnostika": "/images/categories/level2/diagnostika.jpg",
  "Ko'p tarmoqli xususiy poliklinika": "/images/categories/level2/poliklinika.jpg",
  "Tibbiy laboratoriya": "/images/categories/level2/laboratoriya.jpg",
  "Ginekologiya": "/images/categories/level2/ginekologiya.jpg",
  "Pediatriya (Bolalar shifoxonasi)": "/images/categories/level2/pediatriya.jpg",
  "Oftalmologiya va optika do'koni": "/images/categories/level2/oftalmologiya.jpg",
  "Fizioterapiya": "/images/categories/level2/reabilitatsiya.jpg",
  "Kardiologiya": "/images/categories/level2/kardiologiya.jpg",
  "Nevrologiya": "/images/categories/level2/nevrologiya.jpg",
  "Plastik xirurgiya klinikasi": "/images/categories/level2/plastik-xirurgiya.jpg",
  "Kosmetologiya va dermatologiya": "/images/categories/level2/dermatologiya.jpg",
  "LOR": "/images/categories/level2/lor.jpg",
  "Ortopediya": "/images/categories/level2/ortopediya.jpg",
  "Endokrinologiya": "/images/categories/level2/endokrinologiya.jpg",
  "Uyda parvarish xizmati ofisi": "/images/categories/level2/uyda-parvarish.jpg",
  "Allergo-klinika": "/images/categories/level2/allergologiya.jpg",
  "EKO klinika (Reproduktiv tibbiyot)": "/images/categories/level2/eko.jpg",
  "Massaj": "/images/categories/level2/massaj.jpg",
  "Xususiy tez yordam": "/images/categories/level2/tez-yordam.jpg",

  // ==================== KO'NGILOCHAR (20 ta) ====================
  "Bolalar o'yin maydonchasi (Playzone)": "/images/categories/level2/playzone.jpg",
  "Kinoteatr": "/images/categories/level2/kinoteatr.jpg",
  "Virtual reallik va o'yin klubi": "/images/categories/level2/vr-klub.jpg",
  "Akvapark / Suzish havzasi": "/images/categories/level2/akvapark.jpg",
  "Muz maydoni (Ice Rink)": "/images/categories/level2/muz-maydoni.jpg",
  "Bouling va bilyard klubi": "/images/categories/level2/bouling.jpg",
  "Osmondan sakrash markazi (Skaydrom)": "/images/categories/level2/ekstremal-park.jpg",
  "Karaoke klubi": "/images/categories/level2/karaoke.jpg",
  "Teatr va konsert zali": "/images/categories/level2/teatr.jpg",
  "Topishmoq xonasi": "/images/categories/level2/kvest.jpg",
  "Istirohat va attraksion bog'i": "/images/categories/level2/attraksion-bog.jpg",
  "Ot sporti klubi": "/images/categories/level2/ot-klubi.jpg",
  "Bo'yoqli o'q otish maydoni": "/images/categories/level2/paintball.jpg",
  "Mini-zoopark / Okeanarium": "/images/categories/level2/mini-zoopark.jpg",
  "Karting klubi": "/images/categories/level2/karting.jpg",
  "Batut markazi": "/images/categories/level2/batut.jpg",
  "Tog' kampingi / Dam olish maskani": "/images/categories/level2/kamping.jpg",
  "SPA va sauna majmuasi": "/images/categories/level2/spa.jpg",
  "Nishonga otish maydoni": "/images/categories/level2/otishma.jpg",
  "Ilmiy muzey va ko'rgazma zali": "/images/categories/level2/ilmiy-muzey.jpg",

  // ==================== RESTORAN/KAFE (20 ta) ====================
  "Milliy taomlar restorani": "/images/categories/level2/milliy-taomlar.jpg",
  "Choyxona": "/images/categories/level2/choyxona.jpg",
  "Bistro": "/images/categories/level2/fast-food.jpg",
  "Qahvaxona": "/images/categories/level2/qahvaxona.jpg",
  "Pizzeriya": "/images/categories/level2/pitseriya.jpg",
  "Go'sht taomlari restorani": "/images/categories/level2/lounge-bar.jpg",
  "Yapon taomlari kafesi": "/images/categories/level2/sushi-bar.jpg",
  "Tort va shirinlik sexi": "/images/categories/level2/konditer.jpg",
  "Muzqaymoq va shirinliklar kafesi": "/images/categories/level2/muzqaymoqxona.jpg",
  "Ko'chma oshxona (mashinada)": "/images/categories/level2/food-truck.jpg",
  "Oshxona / Bufet": "/images/categories/level2/bufet.jpg",
  "Sog'lom taomlar kafesi": "/images/categories/level2/soglom-taomlar.jpg",
  "To'yxona / Banket zali": "/images/categories/level2/banket-zali.jpg",
  "Vaqt bo'yicha to'lanadigan kafe": "/images/categories/level2/antikafe.jpg",
  "Express-Nonushta nuqtasi": "/images/categories/level2/express-nonushta.jpg",
  "Fast food": "/images/categories/level2/shavurmaxona.jpg",
  "Somsa xona": "/images/categories/level2/somsaxona.jpg",
  "Uyga/tadbirga taom yetkazish xizmati": "/images/categories/level2/catering.jpg",
  "Bar": "/images/categories/level2/gastro-pub.jpg",
  "Muzlatilgan yogurt nuqtasi": "/images/categories/level2/frozen-yogurt.jpg",

  // ==================== SERVICE (20 ta) ====================
  "Qurilish va ta'mirlash kompaniyasi": "/images/categories/level2/qurilish-tamirlash.jpg",
  "Santexnika ustaxonasi": "/images/categories/level2/santexnika.jpg",
  "Ijtimoiy tarmoqlarda reklama xizmati": "/images/categories/level2/smm-agentlik.jpg",
  "Maishiy texnika ta'mirlash ustaxonasi": "/images/categories/level2/texnika-servisi.jpg",
  "Avtoservis / Detailing markazi": "/images/categories/level2/avtoservis.jpg",
  "Kimyoviy tozalash (Ximchistka)": "/images/categories/level2/ximchistka.jpg",
  "Klining (Cleaning) kompaniyasi": "/images/categories/level2/cleaning.jpg",
  "Go'zallik saloni / Barbershop": "/images/categories/level2/gozallik-saloni.jpg",
  "Yuk tashish va logistika kompaniyasi": "/images/categories/level2/yuk-tashish.jpg",
  "Dasturlash va sayt yaratish xizmati": "/images/categories/level2/it-studiya.jpg",
  "Buxgalteriya va audit ofisi": "/images/categories/level2/buxgalteriya.jpg",
  "Yuridik / Advokatlik firmasi": "/images/categories/level2/yuridik.jpg",
  "Tarjima va viza markazi": "/images/categories/level2/tarjima.jpg",
  "Ko'chmas mulk sotuvchisi (Rieltor)": "/images/categories/level2/rieltorlik.jpg",
  "Dezinfeksiya xizmati markazi": "/images/categories/level2/dezinfeksiya.jpg",
  "Bosmaxona": "/images/categories/level2/poligrafiya.jpg",
  "Xavfsizlik tizimlari do'koni": "/images/categories/level2/xavfsizlik.jpg",
  "Vetklinika / Gruming salon": "/images/categories/level2/vetklinika.jpg",
  "Tadbir tashkil qilish xizmati": "/images/categories/level2/event-agentlik.jpg",
  "Xodim tanlash agentligi": "/images/categories/level2/hr-agentlik.jpg",

  // ==================== TA'LIM (20 ta) ====================
  "Xususiy bog'cha": "/images/categories/level2/talim-bogcha.jpg",
  "Xususiy maktab": "/images/categories/level2/talim-maktab.jpg",
  "Tillar o'quv markazi": "/images/categories/level2/talim-tillar.jpg",
  "IT-akademiya": "/images/categories/level2/talim-it.jpg",
  "Prezident maktabiga tayyorlov kursi": "/images/categories/level2/talim-tayyorlov.jpg",
  "Robototexnika to'garagi": "/images/categories/level2/talim-robot.jpg",
  "Abituriyentlar tayyorlov markazi": "/images/categories/level2/talim-abituriyent.jpg",
  "San'at va rasm chizish studiyasi": "/images/categories/level2/talim-sanat.jpg",
  "Musiqa va vokal maktabi": "/images/categories/level2/talim-musiqa.jpg",
  "Kasb-hunar maktabi": "/images/categories/level2/talim-kasb.jpg",
  "Logopediya va defektologiya markazi": "/images/categories/level2/talim-logoped.jpg",
  "Avtomaktab": "/images/categories/level2/talim-avto.jpg",
  "Biznes boshqaruvi kurslari": "/images/categories/level2/talim-mba.jpg",
  "Shaxmat klubi": "/images/categories/level2/talim-shaxmat.jpg",
  "Inklyuziv o'quv markazi": "/images/categories/level2/talim-inklyuziv.jpg",
  "Chet elda o'qishga yordam beruvchi agentlik": "/images/categories/level2/talim-xorij.jpg",
  "Yozgi bolalar oromgohi": "/images/categories/level2/talim-yozgi.jpg",
  "Internet orqali dars beradigan platforma": "/images/categories/level2/talim-onlayn.jpg",
  "Mental arifmetika markazi": "/images/categories/level2/talim-arifmetika.jpg",
  "Malaka oshirish o'quv markazi": "/images/categories/level2/talim-malaka.jpg",

  // ==================== YANGI BIZNES (20 ta) ====================
  "Yangi tadbirkorlarga yordam markazi": "/images/categories/level2/yangi-startap.jpg",
  "Sun'iy intellekt xizmatlari": "/images/categories/level2/yangi-ai.jpg",
  "Raqamli valyuta markazi": "/images/categories/level2/yangi-blockchain.jpg",
  "Internet orqali savdo platformasi": "/images/categories/level2/yangi-ecommerce.jpg",
  "Kompyuter o'yinlari klubi": "/images/categories/level2/yangi-esports.jpg",
  "Virtual olam studiyasi": "/images/categories/level2/yangi-metaverse.jpg",
  "Aqlli ta'lim platformasi": "/images/categories/level2/yangi-ai-talim.jpg",
  "Aqlli qurilmalar markazi": "/images/categories/level2/yangi-iot.jpg",
  "Masofadan ishlash platformasi": "/images/categories/level2/yangi-frilans.jpg",
  "Quyosh va shamol energiyasi kompaniyasi": "/images/categories/level2/yangi-yashil.jpg",
  "Biologik tadqiqot laboratoriyasi": "/images/categories/level2/yangi-biotech.jpg",
  "Onlayn maktab": "/images/categories/level2/yangi-edtech.jpg",
  "Moliyaviy texnologiya kompaniyasi": "/images/categories/level2/yangi-fintech.jpg",
  "Aqlli qishloq xo'jaligi xizmati": "/images/categories/level2/yangi-agritech.jpg",
  "Chiqindilarni qayta ishlash zavodi": "/images/categories/level2/yangi-qayta-ishlash.jpg",
  "Robot yasash markazi": "/images/categories/level2/yangi-robototech.jpg",
  "Ruhiy salomatlik platformasi": "/images/categories/level2/yangi-mental.jpg",
  "Umumiy ish maskani": "/images/categories/level2/yangi-kovorking.jpg",
  "Onlayn psixologik yordam markazi": "/images/categories/level2/yangi-psixolog.jpg",
  "Logistika va yuk tashish startapi": "/images/categories/level2/yangi-logistika.jpg",
};

export default function CategoryPage() {
  const { level1 } = useParams();
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const decodedLevel1 = decodeURIComponent(level1);

    // 🔥 "Yangi biznes" uchun ham faqat o'z yo'nalishining kategoriyalari
    getLevel2(decodedLevel1)
      .then(res => {
        const data = (res.data || []).map(item => {
          const key = item.level2 || item.key;
          return {
            key,
            imageUrl: imageMap[key] || null,
            capex_min: item.capex_min,
            capex_max: item.capex_max,
          };
        });
        setItems(data);
        setFiltered(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ getLevel2 xatosi:', err);
        setLoading(false);
      });
  }, [level1]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (term) {
      const filteredItems = items.filter(item => {
        const name = t(`categoriesLevel2.${item.key}`, { defaultValue: item.key });
        return name.toLowerCase().includes(term);
      });
      setFiltered(filteredItems);
    } else {
      setFiltered(items);
    }
  };

  const handleImageError = (key) => {
    setImageErrors(prev => ({ ...prev, [key]: true }));
  };

  if (loading) return <div className="cat-loading-spinner">{t('categoryPage.loading')}</div>;

  const level1Key = decodeURIComponent(level1);
  const translatedLevel1 = t(`categories.${level1Key}`, { defaultValue: level1Key });

  return (
    <div className="cat-page">
      <div className="cat-header">
        <Link to="/" className="cat-back-btn">
          <ArrowLeft size={20} /> {t('categoryPage.back')}
        </Link>
        <h1 className="cat-title">{translatedLevel1}</h1>
        <p className="cat-desc">{t('categoryPage.description')}</p>
      </div>

      <div className="cat-search-bar">
        <Search className="cat-search-icon" size={20} />
        <input
          type="text"
          placeholder={t('categoryPage.searchPlaceholder')}
          value={searchTerm}
          onChange={handleSearch}
          className="cat-search-input"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="cat-no-results">{t('categoryPage.noResults')}</div>
      ) : (
        <div className="cat-grid">
          {filtered.map(sub => {
            const name = t(`categoriesLevel2.${sub.key}`, { defaultValue: sub.key });
            const hasError = imageErrors[sub.key];
            return (
              <Link
                key={sub.key}
                to={`/subcategory/${encodeURIComponent(level1Key)}/${encodeURIComponent(sub.key)}`}
                className="cat-card"
              >
                <div className="cat-img-wrapper">
                  {sub.imageUrl && !hasError ? (
                    <img
                      src={sub.imageUrl}
                      alt={name}
                      className="cat-img"
                      onError={() => handleImageError(sub.key)}
                    />
                  ) : (
                    <div className="cat-placeholder">{name.charAt(0)}</div>
                  )}
                </div>
                <div className="cat-info">
                  <div className="cat-badge">{t('categoryPage.categoryBadge')}</div>
                  <h3 className="cat-name">{name}</h3>
                  {sub.capex_min && sub.capex_max && (
                    <span className="cat-invest">
                      <Wallet size={14} /> {t('categoryPage.invest', { min: sub.capex_min, max: sub.capex_max })}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}