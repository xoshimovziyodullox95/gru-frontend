import { safeGoBack } from '../utils/navigation.js';
/* ============================================================
   REQUEST PAGE — Usta kerak
   3 qadamli wizard + RequestTrackerModal
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Check, ChevronRight, X } from 'lucide-react';

import LocationMapPicker from '../forms/LocationMapPicker';
import RequestTrackerModal from '../client/RequestTrackerModal';  // вњ… YANGI
import { getServiceTaxonomy } from '../services/serviceProviders';
import { createServiceRequest } from '../services/serviceRequests';

import '../../styles/request.css';

/* ============================================================
   CONSTANTS
   ============================================================ */

const formatSlug = (slug = '') =>
  String(slug)
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

const WHEN_OPTIONS = ['Hozir', 'Bugun', 'Ertaga', 'Shu hafta'];

const QUICK_PHRASES = [
  'Ishlamay qoldi',
  'Suv oqyapti',
  "Yangi o'rnatish kerak",
  'Narxini bilmoqchiman',
];

const TITLES = ['Nima kerak?', 'Nima buzildi?', 'Usta qayerga borsin?'];

/* ============================================================
   PAGE
   ============================================================ */

export default function RequestPage({ defaultCategory = '' }) {
  const navigate = useNavigate();

  /* ============ STATE ============ */

  const [step, setStep] = useState(1);
  const [taxonomy, setTaxonomy] = useState({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(defaultCategory);
  const [activeDir, setActiveDir] = useState('all');
  const [search, setSearch] = useState('');
  const [description, setDescription] = useState('');
  const [when, setWhen] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  /* вњ… YANGI — modal uchun state */
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);

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
          setError("Xizmat turlarini yuklab bo'lmadi. Sahifani yangilang.");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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
          label: formatSlug(slug),
          directionLabel: formatSlug(direction),
        }))
      ),
    [directions]
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
    if (step > 1) setStep(step - 1);
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
    if (loc?.address) setManualAddress(loc.address);
  };

  /* ============ SUBMIT ============ */

  const handleSubmit = async () => {
    if (!category) {
      setError('Xizmat turini tanlang');
      setStep(1);
      return;
    }
    if (descLen < 10) {
      setError('Muammoni kamida 10 ta belgi bilan yozing');
      setStep(2);
      return;
    }
    if (!hasAddress) {
      setError('Manzilni yozing yoki xaritadan belgilang');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const finalAddress = location?.address || manualAddress.trim();
      const text = when
        ? `[${when}] ${description.trim()}`
        : description.trim();

      const res = await createServiceRequest({
        category,
        description: text,
        location: {
          address: finalAddress,
          lat: location?.lat ?? null,
          lng: location?.lng ?? null,
        },
      });

      toast.success(
        `So'rov yuborildi. ${res.data?.notifiedCount || 0} ta ustaga xabar ketdi`
      );

      /* вњ… MODAL OCHISH (navigate o'rniga) */
      setCreatedRequest(res.data.request);
      setTrackerOpen(true);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Xatolik yuz berdi. Qayta urinib ko'ring."
      );
      toast.error("So'rov yuborilmadi");
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
          aria-label="Orqaga"
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
        <h1 className="rq-title">{TITLES[step - 1]}</h1>

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
                    placeholder="Qidiring: kran, rozetka, konditsioner"
                    autoComplete="off"
                    aria-label="Qidirish"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label="Tozalash"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {!search && (
                  <div className="rq-tabs" role="tablist">
                    {[
                      ['all', 'Hammasi'],
                      ...directions.map(([d]) => [d, formatSlug(d)]),
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
                Xizmat turlari topilmadi. Sahifani yangilang.
              </p>
            )}

            {!loading && flat.length > 0 && visible.length === 0 && (
              <p className="rq-note">
                В«{search}В» topilmadi. Boshqa so'z bilan qidirib ko'ring.
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
            {selected && (
              <p className="rq-chosen">
                <span>
                  {selected.directionLabel} В· <strong>{selected.label}</strong>
                </span>
                <button type="button" onClick={() => setStep(1)}>
                  O'zgartirish
                </button>
              </p>
            )}

            <fieldset className="rq-group">
              <legend>Qachon kerak?</legend>
              <div className="rq-seg">
                {WHEN_OPTIONS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    className={when === w ? 'is-on' : ''}
                    aria-pressed={when === w}
                    onClick={() => setWhen(when === w ? '' : w)}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="rq-group">
              <span className="rq-legend">Muammoni yozing</span>

              <textarea
                className="rq-field rq-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                maxLength={3000}
                placeholder="Masalan: oshxonadagi kran tagidan suv oqyapti, ikki kundan beri."
              />

              <span className={`rq-count ${descLen >= 10 ? 'is-ok' : ''}`}>
                {descLen >= 10
                  ? 'Yetarli'
                  : `Yana ${10 - descLen} ta belgi kerak`}
              </span>
            </label>

            <div className="rq-quick">
              {QUICK_PHRASES.map((p) => (
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
              Xaritada aniq joyni bosing yoki manzilni pastga yozing.
            </p>

            <label className="rq-group">
              <span className="rq-legend">Manzil</span>

              <input
                type="text"
                className="rq-field"
                value={manualAddress}
                maxLength={200}
                placeholder="Tuman, mahalla, ko'cha, uy raqami"
                onChange={(e) => {
                  setManualAddress(e.target.value);

                  if (location && location.address !== e.target.value) {
                    setLocation({ ...location, address: e.target.value });
                  }
                }}
              />
            </label>

            {selected && (
              <div className="rq-summary">
                <div>
                  <strong>{selected.label}</strong>
                  {when && <em>{when}</em>}
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
              Davom etish
            </button>
          ) : (
            <button
              type="button"
              className="rq-btn"
              disabled={!canNext}
              onClick={handleSubmit}
            >
              {submitting ? 'Yuborilmoqda...' : 'Ustalarga yuborish'}
            </button>
          )}
        </div>
      </footer>

      {/* ============================================================
         вњ… REQUEST TRACKER MODAL
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