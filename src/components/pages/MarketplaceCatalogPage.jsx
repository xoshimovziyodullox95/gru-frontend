import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, ArrowRight, BriefcaseBusiness, ChevronDown, ChevronRight,
  Cpu, MapPin, Search, Store,
} from 'lucide-react';
import { useProductCategories } from '../utils/productCategories';
import { getServiceTaxonomy } from '../services/serviceProviders';
import { safeGoBack } from '../utils/navigation.js';
import { T } from '../utils/T';
import '../../styles/marketplaceCatalog.css';

const formatSlug = (slug = '') => slug.replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

export default function MarketplaceCatalogPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { categories, loading: productsLoading } = useProductCategories();
  const [activeTab, setActiveTab] = useState('products');
  const [query, setQuery] = useState('');
  const [expandedProducts, setExpandedProducts] = useState(() => new Set());
  const [expandedServices, setExpandedServices] = useState(() => new Set());
  const [serviceTaxonomy, setServiceTaxonomy] = useState({});
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getServiceTaxonomy()
      .then((res) => {
        if (active) setServiceTaxonomy(res.data?.taxonomy || res.data?.data?.taxonomy || {});
      })
      .catch(() => {
        if (active) setServiceTaxonomy({});
      })
      .finally(() => {
        if (active) setServicesLoading(false);
      });
    return () => { active = false; };
  }, []);

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleProducts = useMemo(() => categories.map((category) => {
    const categoryMatches = category.name.toLocaleLowerCase().includes(normalizedQuery);
    const subs = normalizedQuery && !categoryMatches
      ? category.subs.filter((sub) => sub.name.toLocaleLowerCase().includes(normalizedQuery))
      : category.subs;
    return { ...category, subs, matches: !normalizedQuery || categoryMatches || subs.length > 0 };
  }).filter((category) => category.matches), [categories, normalizedQuery]);

  const visibleServices = useMemo(() => Object.entries(serviceTaxonomy)
    .map(([direction, slugs]) => {
      const directionName = t(`svc.dir.${direction}`, formatSlug(direction));
      const directionMatches = directionName.toLocaleLowerCase().includes(normalizedQuery);
      const services = (Array.isArray(slugs) ? slugs : []).map((slug) => ({
        slug,
        name: t(`svc.cat.${slug}`, formatSlug(slug)),
      }));
      const filteredServices = normalizedQuery && !directionMatches
        ? services.filter((service) => service.name.toLocaleLowerCase().includes(normalizedQuery))
        : services;
      return { direction, name: directionName, services: filteredServices, matches: !normalizedQuery || directionMatches || filteredServices.length > 0 };
    })
    .filter((group) => group.matches && group.services.length), [normalizedQuery, serviceTaxonomy, t]);

  const toggleExpanded = (setCurrent, key) => {
    setCurrent((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const tabs = [
    { id: 'products', label: t('marketplaceFilters.typeEquipment', 'Tovarlar'), Icon: Cpu },
    { id: 'services', label: t('marketplaceFilters.typeService', 'Xizmatlar'), Icon: BriefcaseBusiness },
    { id: 'locations', label: t('marketplaceFilters.typeLocation', 'Joylar'), Icon: MapPin },
  ];

  return (
    <div className="mph-page mpc-page">
      <button type="button" className="mph-back" onClick={() => safeGoBack(navigate)}>
        <ArrowLeft size={18} /> {t('common.back', 'Orqaga')}
      </button>

      <header className="mpc-heading">
        <span className="mpc-heading__icon"><Store size={22} /></span>
        <div>
          <h1>{T('Katalog')}</h1>
          <p>{T('Tovar, xizmat va joylarni bo‘limlar bo‘yicha toping')}</p>
        </div>
      </header>

      <div className="mpc-tabs" role="tablist" aria-label={T('Katalog bo‘limlari')}>
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={activeTab === id ? 'active' : ''}
            onClick={() => { setActiveTab(id); setQuery(''); }}
          >
            <Icon size={17} /> {label}
          </button>
        ))}
      </div>

      <label className="mpc-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={T('Kategoriya yoki bo‘limni qidiring')}
          aria-label={T('Kategoriya yoki bo‘limni qidiring')}
        />
      </label>

      {activeTab === 'products' && (
        <div className="mpc-list" role="tabpanel">
          {productsLoading ? <p className="mpc-state">{T('Yuklanmoqda...')}</p> : visibleProducts.map((category) => {
            const Icon = category.icon;
            const expanded = expandedProducts.has(category.id) || Boolean(normalizedQuery);
            return (
              <section className="mpc-group" key={category.id}>
                <button
                  type="button"
                  className="mpc-group__head"
                  aria-expanded={expanded}
                  onClick={() => toggleExpanded(setExpandedProducts, category.id)}
                >
                  <span className="mpc-group__glyph" style={{ '--mpc-from': category.colors[0], '--mpc-to': category.colors[1] }}>
                    <Icon size={19} />
                  </span>
                  <span className="mpc-group__title">{category.name}</span>
                  <span className="mpc-group__count">{category.subs.length}</span>
                  {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                {expanded && (
                  <div className="mpc-sublist">
                    <button
                      type="button"
                      className="mpc-sublist__item mpc-sublist__item--all"
                      onClick={() => navigate(`/marketplace/all?type=equipment&level1=${encodeURIComponent(category.id)}`)}
                    >
                      <span>{T('Barcha e’lonlar')}</span><ArrowRight size={15} />
                    </button>
                    {category.subs.map((sub) => (
                      <button
                        type="button"
                        className="mpc-sublist__item"
                        key={sub.id}
                        onClick={() => navigate(`/marketplace/all?type=equipment&level1=${encodeURIComponent(category.id)}&sub=${encodeURIComponent(sub.id)}`)}
                      >
                        <span>{sub.name}</span><ChevronRight size={15} />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
          {!productsLoading && !visibleProducts.length && <p className="mpc-state">{T('Mos kategoriya topilmadi')}</p>}
        </div>
      )}

      {activeTab === 'services' && (
        <div className="mpc-list" role="tabpanel">
          {servicesLoading ? <p className="mpc-state">{T('Yuklanmoqda...')}</p> : visibleServices.map((group) => {
            const expanded = expandedServices.has(group.direction) || Boolean(normalizedQuery);
            return (
              <section className="mpc-group" key={group.direction}>
                <button
                  type="button"
                  className="mpc-group__head"
                  aria-expanded={expanded}
                  onClick={() => toggleExpanded(setExpandedServices, group.direction)}
                >
                  <span className="mpc-group__glyph mpc-group__glyph--service"><BriefcaseBusiness size={19} /></span>
                  <span className="mpc-group__title">{group.name}</span>
                  <span className="mpc-group__count">{group.services.length}</span>
                  {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                {expanded && (
                  <div className="mpc-sublist">
                    {group.services.map((service) => (
                      <button
                        type="button"
                        className="mpc-sublist__item"
                        key={service.slug}
                        onClick={() => navigate(`/marketplace/services/${encodeURIComponent(service.slug)}`)}
                      >
                        <span>{service.name}</span><ChevronRight size={15} />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
          {!servicesLoading && !visibleServices.length && <p className="mpc-state">{T('Mos xizmat yo‘nalishi topilmadi')}</p>}
        </div>
      )}

      {activeTab === 'locations' && (
        <section className="mpc-location" role="tabpanel">
          <span className="mpc-location__icon"><MapPin size={25} /></span>
          <div>
            <h2>{T('Joylar va tijorat maydonlari')}</h2>
            <p>{T('Do‘kon, ofis, ombor va boshqa joy e’lonlarini ko‘ring.')}</p>
          </div>
          <button type="button" onClick={() => navigate('/marketplace/all?type=location')}>
            {T('Joylarni ko‘rish')} <ArrowRight size={16} />
          </button>
        </section>
      )}
    </div>
  );
}
