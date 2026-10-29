import { safeGoBack } from '../utils/navigation.js';
/* ============================================================
   REQUEST PAGE — Usta kerak
   3 qadamli wizard + RequestTrackerModal
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, ChevronRight, X } from 'lucide-react';

import LocationMapPicker from '../forms/LocationMapPicker';
import RequestTrackerModal from '../client/RequestTrackerModal';  // ✅ YANGI
import { getServiceTaxonomy, getServiceProviderById } from '../services/serviceProviders';
import { createServiceRequest } from '../services/serviceRequests';
import { getUserProfile } from '../services/user';
import { getServiceTaxonomyLabel } from '../utils/serviceTaxonomyLabels';

import '../../styles/request.css';

import { T } from '../utils/T';
/* ============================================================
   CONSTANTS
   ============================================================ */

/* ============================================================
   PAGE
   ============================================================ */

export default function RequestPage({ defaultCategory = '' }) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  // /request?category=santexnik — AI yordamchi yoki usta kartasidan kelganda xizmat turi tanlangan bo'ladi
  const [searchParams] = useSearchParams();
  const initialCategory = defaultCategory || searchParams.get('category') || '';
  // /request?provider=ID — usta sahifasidagi "Buyurtma berish": so'rov faqat shu ustaga boradi
  const targetProviderId = searchParams.get('provider') || '';
  const [targetProvider, setTargetProvider] = useState(null);

  /* ============ STATE ============ */

  const [step, setStep] = useState(1);
  const [taxonomy, setTaxonomy] = useState({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [activeDir, setActiveDir] = useState('all');
  const [search, setSearch] = useState('');
  const [description, setDescription] = useState('');
  const [when, setWhen] = useState('now');
  // Usta tanlangach siz bilan bog'lanishi uchun (profildan to'ldiriladi)
  const [phone, setPhone] = useState(() => {
    try { return localStorage.getItem('zumo_contact_phone') || ''; } catch { return ''; }
  });
  const [manualAddress, setManualAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  /* ✅ YANGI — modal uchun state */
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);

  useEffect(() => {
    let mounted = true;
    getUserProfile()
      .then((res) => { if (mounted && res.data?.phone) setPhone((prev) => prev || res.data.phone); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  /* ============ LOAD TAXONOMY ============ */

  useEffect(() => {
    let mounted = true;

    getServiceTaxonomy()
      .then((res) => {
        if (mounted) {
          setTaxonomy(res.data?.taxonomy || res.data?.data?.taxonomy || {});
        }
      })
      .catch(() => {
        if (mounted) {
          setError(T('Xizmat turlarini yuklab bo\'lmadi. Sahifani yangilang.'));
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // To'g'ridan-to'g'ri buyurtma: ustaning xizmat turi avtomatik, 1-qadam o'tkazib yuboriladi
  useEffect(() => {
    if (!targetProviderId) return undefined;
    let mounted = true;
    getServiceProviderById(targetProviderId)
      .then((res) => {
        const p = res.data?.provider || res.data;
        if (!mounted || !p?.service_category) return;
        setTargetProvider({ id: p._id, name: p.company ? `${p.name} · ${p.company}` : p.name });
        setCategory(p.service_category);
        setStep((st) => (st === 1 ? 2 : st));
      })
      .catch(() => {
        if (mounted) setError(T('Usta topilmadi. Xizmat turini o‘zingiz tanlang.'));
      });
    return () => { mounted = false; };
  }, [targetProviderId]);

  /* ============ DERIVED ============ */

  const directions = useMemo(
    () =>
      Object.entries(taxonomy).filter(
        ([, items]) => Array.isArray(items) && items.length
      ),
    [taxonomy]
  );

  const flat = useMemo(
    () =>
      directions.flatMap(([direction, items]) =>
        items.map((slug) => ({
          slug,
          direction,
          label: getServiceTaxonomyLabel(slug, i18n.language),
          directionLabel: getServiceTaxonomyLabel(direction, i18n.language),
        }))
      ),
    [directions, i18n.language]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();

    return flat.filter((c) => {
      if (q) {
        return (
          c.label.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.directionLabel.toLowerCase().includes(q)
        );
      }
      return activeDir === 'all' || c.direction === activeDir;
    });
  }, [flat, search, activeDir]);

  const selected = flat.find((c) => c.slug === category) || null;
  const whenOptions = [
    { key: 'now', label: T('Hozir') },
    { key: 'today', label: T('Bugun') },
    { key: 'tomorrow', label: T('Ertaga') },
    { key: 'week', label: T('Shu hafta') },
  ];
  const whenText = whenOptions.find((w) => w.key === when)?.label || '';
  const phoneDigits = phone.replace(/\D/g, '');
  const phoneOk = phoneDigits.length >= 9;
  const quickPhrases = [T('Ishlamay qoldi'), T('Suv oqyapti'), T('Yangi o\'rnatish kerak'), T('Narxini bilmoqchiman')];
  const stepTitles = [T('Nima kerak?'), T('Nima qilish kerak?'), T('Usta qayerga borsin?')];
  const descLen = description.trim().length;
  const hasAddress = Boolean(location?.address || manualAddress.trim());

  const canNext =
    step === 1
      ? Boolean(category)
      : step === 2
      ? descLen >= 10
      : hasAddress && !submitting;

  /* ============ NAV ============ */

  const goBack = () => {
    setError('');
    if (step > 1 && !(targetProvider && step === 2)) setStep(step - 1);
    else safeGoBack(navigate);
  };

  const goNext = () => {
    setError('');
    if (step === 1 && category) {
      setSearch('');
      setStep(2);
    } else if (step === 2 && descLen >= 10) {
      setStep(3);
    }
  };

  const addPhrase = (text) =>
    setDescription((d) =>
      (d.trim() ? `${d.trim()}. ${text}` : text).slice(0, 3000)
    );

  const handleMapSelect = (loc) => {
    setLocation(loc);
    // New map point invalidates any previous address until reverse geocoding resolves.
    setManualAddress(loc?.address || '');
  };

  /* ============ SUBMIT ============ */

  const handleSubmit = async () => {
    if (!category) {
      setError(T('Xizmat turini tanlang'));
      setStep(1);
      return;
    }
    if (descLen < 10) {
      setError(T('Muammoni kamida 10 ta belgi bilan yozing'));
      setStep(2);
      return;
    }
    if (!hasAddress) {
      setError(T('Manzilni yozing yoki xaritadan belgilang'));
      return;
    }
    if (!phoneOk) {
      setError(T('Telefon raqamingizni yozing — usta siz bilan bog‘lanadi'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const finalAddress = location?.address || manualAddress.trim();
      const res = await createServiceRequest({
        ...(targetProvider ? { targetProviderId: targetProvider.id } : {}),
        category,
        description: description.trim(),
        when,
        contactPhone: phone.trim(),
        location: {
          address: finalAddress,
          lat: location?.lat ?? null,
          lng: location?.lng ?? null,
        },
      });

      try { localStorage.setItem('zumo_contact_phone', phone.trim()); } catch { /* xotira yopiq */ }

      toast.success(
        targetProvider
          ? T('Buyurtma ustaga yuborildi')
          : T('So\'rov yuborildi. {{v}} ta ustaga xabar ketdi', { v: res.data?.notifiedCount || 0 })
      );

      /* ✅ MODAL OCHISH (navigate o'rniga) */
      setCreatedRequest(res.data.request);
      setTrackerOpen(true);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          T('Xatolik yuz berdi. Qayta urinib ko\'ring.')
      );
      toast.error(T('So\'rov yuborilmadi'));
    } finally {
      setSubmitting(false);
    }
  };

  /* ============ MODAL YOPISH ============ */

  const handleModalClose = () => {
    setTrackerOpen(false);

    /* Modal yopilganda — so'rov tafsilotlariga o'tish */
    const id = createdRequest?._id;
    if (id) {
      navigate(`/requests/${id}`);
    } else {
      navigate('/');
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="rq">
      {/* ============ HEADER ============ */}

      <header className="rq-top">
        <button
          type="button"
          className="rq-back"
          onClick={goBack}
          aria-label={T('Orqaga')}
        >
          <ArrowLeft size={22} />
        </button>

        <span className="rq-top__step">{step} / 3</span>

        <div className="rq-top__bar" aria-hidden="true">
          <span style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </header>

      {/* ============ MAIN ============ */}

      <main className="rq-main">
        <h1 className="rq-title">{stepTitles[step - 1]}</h1>
        {targetProvider && (
          <p className="rq-target">
            {T('Buyurtma: {{name}}', { name: targetProvider.name })}
            <span>{T('So‘rov faqat shu ustaga yuboriladi')}</span>
          </p>
        )}

        {/* ============ STEP 1: KATEGORIYA ============ */}

        {step === 1 && (
          <section>
            {!loading && flat.length > 0 && (
              <>
                <div className="rq-search">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={T('Qidiring: kran, rozetka, konditsioner')}
                    autoComplete="off"
                    aria-label={T('Qidirish')}
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label={T('Tozalash')}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {!search && (
                  <div className="rq-tabs" role="tablist">
                    {[
                      ['all', T('Hammasi')],
                      ...directions.map(([d]) => [d, getServiceTaxonomyLabel(d, i18n.language)]),
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={activeDir === key}
                        className={`rq-tab ${activeDir === key ? 'is-on' : ''}`}
                        onClick={() => setActiveDir(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {loading && (
              <div className="rq-list">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="rq-skel" />
                ))}
              </div>
            )}

            {!loading && flat.length === 0 && !error && (
              <p className="rq-note">
                {T('Xizmat turlari topilmadi. Sahifani yangilang.')}
              </p>
            )}

            {!loading && flat.length > 0 && visible.length === 0 && (
              <p className="rq-note">
                {T('«{{search}}» topilmadi. Boshqa so‘z bilan qidirib ko‘ring.', { search })}
              </p>
            )}

            {visible.length > 0 && (
              <ul className="rq-list">
                {visible.map((c) => {
                  const on = category === c.slug;

                  return (
                    <li key={`${c.direction}-${c.slug}`}>
                      <button
                        type="button"
                        className={`rq-row ${on ? 'is-on' : ''}`}
                        onClick={() => setCategory(c.slug)}
                        aria-pressed={on}
                      >
                        <span className="rq-row__text">
                          <strong>{c.label}</strong>
                          {(activeDir === 'all' || search) && (
                            <small>{c.directionLabel}</small>
                          )}
                        </span>

                        {on ? (
                          <Check size={20} strokeWidth={3} />
                        ) : (
                          <ChevronRight size={18} className="rq-row__go" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* ============ STEP 2: TAVSIF ============ */}

        {step === 2 && (
          <section>
            {selected && !targetProvider && (
              <p className="rq-chosen">
                <span>
                  {selected.directionLabel} · <strong>{selected.label}</strong>
                </span>
                <button type="button" onClick={() => setStep(1)}>
                  {T('O\'zgartirish')}
                </button>
              </p>
            )}

            <fieldset className="rq-group">
              <legend>{T('Qachon kerak?')}</legend>
              <div className="rq-seg">
                {whenOptions.map((w) => (
                  <button
                    key={w.key}
                    type="button"
                    className={when === w.key ? 'is-on' : ''}
                    aria-pressed={when === w.key}
                    onClick={() => setWhen(w.key)}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="rq-group">
              <span className="rq-legend">{T('Muammo yoki ishni yozing')}</span>

              <textarea
                className="rq-field rq-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                maxLength={3000}
                placeholder={T('Masalan: oshxonadagi kran tagidan suv oqyapti, ikki kundan beri.')}
              />

              <span className={`rq-count ${descLen >= 10 ? 'is-ok' : ''}`}>
                {descLen >= 10
                  ? T('Yetarli')
                  : T('Yana {{v}} ta belgi kerak', { v: 10 - descLen })}
              </span>
            </label>

            <div className="rq-quick">
              {quickPhrases.map((p) => (
                <button key={p} type="button" onClick={() => addPhrase(p)}>
                  + {p}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ============ STEP 3: MANZIL ============ */}

        {step === 3 && (
          <section>
            <div className="rq-map">
              <LocationMapPicker
                lat={location?.lat}
                lng={location?.lng}
                onSelect={handleMapSelect}
              />
            </div>

            <p className="rq-hint">
              {T('Xaritada aniq joyni bosing yoki manzilni pastga yozing.')}
            </p>

            <label className="rq-group">
              <span className="rq-legend">{T('Manzil')}</span>

              <input
                type="text"
                className="rq-field"
                value={manualAddress}
                maxLength={200}
                placeholder={T('Tuman, mahalla, ko\'cha, uy raqami')}
                onChange={(e) => {
                  setManualAddress(e.target.value);

                  if (location && location.address !== e.target.value) {
                    setLocation({ ...location, address: e.target.value });
                  }
                }}
              />
            </label>

            <label className="rq-group">
              <span className="rq-legend">{T('Telefon raqamingiz')}</span>
              <input
                type="tel"
                inputMode="tel"
                className="rq-field"
                value={phone}
                maxLength={20}
                placeholder="+998 90 123 45 67"
                onChange={(e) => setPhone(e.target.value)}
              />
              <span className="rq-count">{T('Faqat siz tanlagan ustaga ko‘rinadi')}</span>
            </label>

            {selected && (
              <div className="rq-summary">
                <div>
                  <strong>{selected.label}</strong>
                  {whenText && <em>{whenText}</em>}
                </div>
                <p>{description.trim()}</p>
              </div>
            )}
          </section>
        )}

        {error && (
          <p className="rq-error" role="alert">
            {error}
          </p>
        )}
      </main>

      {/* ============ FOOTER ============ */}

      <footer className="rq-foot">
        <div className="rq-foot__in">
          {step === 1 && selected && (
            <span className="rq-foot__pick">{selected.label}</span>
          )}

          {step < 3 ? (
            <button
              type="button"
              className="rq-btn"
              disabled={!canNext}
              onClick={goNext}
            >
              {T('Davom etish')}
            </button>
          ) : (
            <button
              type="button"
              className="rq-btn"
              disabled={!canNext}
              onClick={handleSubmit}
            >
              {submitting ? T('Yuborilmoqda...') : targetProvider ? T('Ustaga yuborish') : T('Ustalarga yuborish')}
            </button>
          )}
        </div>
      </footer>

      {/* ============================================================
         ✅ REQUEST TRACKER MODAL
         Zakaz bergandan keyin ochiladi
         ============================================================ */}

      <RequestTrackerModal
        key={createdRequest?._id || 'none'}
        isOpen={trackerOpen}
        request={createdRequest}
        onClose={handleModalClose}
      />
    </div>
  );
}
