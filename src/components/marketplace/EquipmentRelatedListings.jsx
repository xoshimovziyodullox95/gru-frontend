import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getEquipment } from '../services/equipment';
import { getLocations } from '../services/locations';
import { getServiceProviders } from '../services/serviceProviders';
import UniversalCard from '../pages/UniversalCard';
import ServiceProviderCard from './ServiceProviderCard';
import { getImageUrl } from '../utils/imageUrl';
import { T } from '../utils/T';
import { searchWords, wordHits } from '../utils/searchMatch';
import '../../styles/equipmentRelatedListings.css';

const toArray = (response) => {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const GROUPS = [
  { key: 'equipment', title: 'O‘xshash tovarlar', link: '/marketplace/all?type=equipment' },
  { key: 'locations', title: 'Joylar va do‘konlar', link: '/marketplace/all?type=location' },
  { key: 'services', title: 'Xizmat ko‘rsatuvchilar', link: '/marketplace/all?type=service' },
];

function RelatedRow({ group, items }) {
  const navigate = useNavigate();
  const scroll = (direction) => {
    const row = document.getElementById(`equipment-related-${group.key}`);
    if (row) row.scrollBy({ left: direction * Math.max(260, row.clientWidth * 0.75), behavior: 'smooth' });
  };

  if (!items.length) return null;

  return (
    <section className="eq-related-section" aria-label={T(group.title)}>
      <div className="eq-related-heading">
        <h2>{T(group.title)}</h2>
        <div className="eq-related-actions">
          <button type="button" onClick={() => scroll(-1)} aria-label={T('Chapga surish')}><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => scroll(1)} aria-label={T('O‘ngga surish')}><ChevronRight size={18} /></button>
          <button type="button" className="eq-related-all" onClick={() => navigate(group.link)}>{T('Barchasini ko‘rish')}</button>
        </div>
      </div>
      <div className="eq-related-row" id={`equipment-related-${group.key}`}>
        {items.map((item) => (
          <div className="eq-related-card" key={item._id}>
            {group.key === 'services' ? (
              <ServiceProviderCard
                id={item._id}
                name={item.name || item.title || T('Xizmat ko‘rsatuvchi')}
                company={item.company || item.service_category || ''}
                image={item.image ? getImageUrl(item.image) : ''}
                price_range={item.price_range}
                description={item.description}
              />
            ) : (
              <UniversalCard
                id={item._id}
                type={group.key === 'equipment' ? 'equipment' : 'location'}
                title={item.title || item.name || T('Nomsiz e’lon')}
                image={getImageUrl(item.images?.[0] || item.image || '/images/zumo-placeholder.svg')}
                price={item.price ?? item.price_range ?? item.price_per_month}
                currency={item.currency}
                link={group.key === 'equipment' ? `/equipment/${item._id}` : `/location/${item._id}`}
                maxQuantity={item.stockQuantity}
                saleMode={item.saleMode}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// O'xshashlik: bir xil ichki bo'lim, sarlavhadagi umumiy so'zlar, narxga yaqinlik
function rankSimilar(current, list) {
  const words = searchWords(current.title).filter((w) => w.length >= 3);
  const toUzs = (e) => (e.currency === 'USD' ? (e.price || 0) * 12500 : e.price || 0);
  const base = toUzs(current);
  return list
    .filter((e) => String(e._id) !== String(current._id))
    .map((e) => {
      let score = 0;
      if (e.category === current.category) score += 3;
      if (e.level1 === current.level1) score += 1;
      score += wordHits(e.title, words) * 2;
      if (base > 0 && e.price > 0) {
        const ratio = toUzs(e) / base;
        if (ratio > 0.5 && ratio < 2) score += 1;
      }
      return { e, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.e);
}

export default function EquipmentRelatedListings({ currentId, equipment }) {
  const [groups, setGroups] = useState({ equipment: [], locations: [], services: [] });

  useEffect(() => {
    let active = true;
    const level1 = equipment?.level1;
    Promise.allSettled([
      // Avval shu kategoriyadagilar; kam bo'lsa — eng yangilari bilan to'ldiriladi
      level1 ? getEquipment({ level1, limit: 60 }) : Promise.resolve([]),
      getEquipment({ limit: 12 }),
      getLocations({ limit: 12 }),
      getServiceProviders({ limit: 12 }),
    ]).then((results) => {
      if (!active) return;
      const [sameResult, latestResult, locationsResult, servicesResult] = results;
      const list = (result) => (result.status === 'fulfilled' ? toArray(result.value) : []);
      const withoutCurrent = (result) => list(result)
        .filter((item) => String(item?._id || item?.id) !== String(currentId)).slice(0, 8);
      const similar = equipment ? rankSimilar(equipment, list(sameResult)) : [];
      const seen = new Set(similar.map((e) => String(e._id)));
      const filler = list(latestResult).filter((e) => !seen.has(String(e._id)) && String(e._id) !== String(currentId));
      setGroups({
        equipment: [...similar, ...filler].slice(0, 10),
        locations: withoutCurrent(locationsResult),
        services: withoutCurrent(servicesResult),
      });
    });
    return () => { active = false; };
  // like/izohda equipment obyekti yangilanadi — qayta yuklamaslik uchun faqat kerakli maydonlar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, equipment?.level1, equipment?.category, equipment?.title]);

  if (!Object.values(groups).some((items) => items.length)) return null;

  return (
    <div className="eq-related-listings">
      {GROUPS.map((group) => <RelatedRow key={group.key} group={group} items={groups[group.key]} />)}
    </div>
  );
}
