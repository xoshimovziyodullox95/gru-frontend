import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Car,
  Check,
  CheckCircle2,
  GraduationCap,
  Hammer,
  HeartHandshake,
  Home,
  Info,
  Loader2,
  Palette,
  Sparkles,
  SprayCan,
  User,
  Users,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import {
  createServiceProvider,
  getServiceTaxonomy,
  uploadServiceMedia,
} from '../services/serviceProviders';

import MediaUploader from '../MediaUploader';
import SuccessModal from '../common/SuccessModal.jsx';
import AITextEnhanceButton from '../common/AITextEnhanceButton.jsx';

import '../../styles/becomeProvider.css';
import '../../styles/aienhance.css';

/* ============================================================
   YO‘NALISHLAR (label + icon)
   Backend taxonomy bilan bir xil sluglar.
   API ishlamasa ham fallback sifatida ishlaydi.
   ============================================================ */

const DIRECTIONS = {
  'maishiy-va-uy-xizmatlari': {
    label: 'Maishiy va uy xizmatlari',
    icon: Home,
    color: '#00c8f8',
    categories: {
      konditsioner: 'Konditsionerchi',
      'bir-soatga-usta': 'Bir soatga usta',
      santexnik: 'Santexnik',
      elektrik: 'Elektrik',
      'maishiy-texnika': 'Maishiy texnika',
      'lift-ustasi': 'Lift ustasi',
      'qulf-ustasi': 'Qulf ustasi',
      'mebel-montaj-va-tamirlash': 'Mebel montaj / ta’mirlash',
      'akvarium-xizmatlari': 'Akvarium xizmatlari',
      ventilyatsiya: 'Ventilyatsiya',
      elektronika: 'Elektronika',
    },
  },

  'tozalash-va-sanitariya': {
    label: 'Tozalash va sanitariya',
    icon: SprayCan,
    color: '#18c895',
    categories: {
      'tozalash-klining': 'Tozalash (Klining)',
      ximchistka: 'Ximchistka',
      'gilam-tozalash': 'Gilam tozalash',
      dezinfeksiya: 'Dezinfeksiya',
      'chiqindilarni-olib-tashlash': 'Chiqindilarni olib tashlash',
    },
  },

  'qurilish-va-tamirlash': {
    label: 'Qurilish va ta’mirlash',
    icon: Hammer,
    color: '#ff8a1f',
    categories: {
      'tamirlash-remont': 'Ta’mirlash (Remont)',
      'qurilish-ishlari': 'Qurilish ishlari',
      molyarchi: 'Molyarchi',
      'kunlik-ishchi-mardikor': 'Kunlik ishchi (Mardikor)',
    },
  },

  'talim-va-psixologiya': {
    label: 'Ta’lim va psixologiya',
    icon: GraduationCap,
    color: '#ffc21c',
    categories: {
      repetitorlar: 'Repetitorlar',
      'tillar-va-repetitorlik': 'Tillar va repetitorlik',
      psixolog: 'Psixolog',
      'murabbiylar-va-kouchlar': 'Murabbiylar, kouchlar',
    },
  },

  'oila-va-parvarish': {
    label: 'Oila va parvarish',
    icon: HeartHandshake,
    color: '#ff6357',
    categories: {
      enaga: 'Enaga',
      veterinar: 'Veterinar',
    },
  },

  'transport-va-maxsus-texnika': {
    label: 'Transport va maxsus texnika',
    icon: Car,
    color: '#438bff',
    categories: {
      'yuk-tashish': 'Yuk tashish',
      'qishloq-xojaligi-texnikasi': 'Qishloq xo‘jaligi texnikasi',
      'maxsus-texnika': 'Maxsus texnika',
      'avto-xizmat': 'Avto xizmat',
    },
  },

  'biznes-huquq-va-it': {
    label: 'Biznes, huquq va IT',
    icon: Briefcase,
    color: '#1685ff',
    categories: {
      'it-xizmatlari': 'IT',
      marketing: 'Marketing',
      advokat: 'Advokat',
      buxgalter: 'Buxgalter',
      'rieltorlik-xizmatlari': 'Rieltorlik xizmatlari',
      tarjimon: 'Tarjimon',
      poligrafiya: 'Poligrafiya',
    },
  },

  'gozallik-moda-va-tadbirlar': {
    label: 'Go‘zallik, moda va tadbirlar',
    icon: Palette,
    color: '#20cdb7',
    categories: {
      'shou-biznes': 'Shou-biznes',
      'bazm-xizmatlari': 'Bazm xizmatlari',
      'gozallik-ustalari': 'Go‘zallik ustalari',
      tikuvchilik: 'Tikuvchilik',
      modellar: 'Modellar',
      dizayn: 'Dizayn',
    },
  },

  'boshqa-xizmatlar': {
    label: 'Boshqa xizmatlar',
    icon: Sparkles,
    color: '#8fb9d8',
    categories: {
      bogdorchilik: 'Bog‘dorchilik',
      muhandis: 'Muhandis',
      turizm: 'Turizm',
      'yetkazib-berish': 'Yetkazib berish',
      'uyda-ishlash': 'Uyda ishlash',
    },
  },
};

/* Lokal taxonomy (fallback) */

const LOCAL_TAXONOMY = Object.fromEntries(
  Object.entries(DIRECTIONS).map(([slug, value]) => [
    slug,
    Object.keys(value.categories),
  ])
);

const STEPS = [
  { key: 'type', label: 'Tur' },
  { key: 'direction', label: 'Yo‘nalish' },
  { key: 'category', label: 'Kasb' },
  { key: 'details', label: 'Ma’lumot' },
  { key: 'review', label: 'Tasdiq' },
];

const INITIAL_FORM = {
  name: '',
  company: '',
  description: '',
  phone: '',
  price_range: '',
  email: '',
  website: '',
};

/* ============================================================
   COMPONENT
   ============================================================ */

export default function BecomeProviderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [step, setStep] = useState(0);

  const [entityType, setEntityType] = useState('');
  const [direction, setDirection] = useState('');
  const [category, setCategory] = useState('');

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [mediaFiles, setMediaFiles] = useState([]);

  const [taxonomy, setTaxonomy] = useState(LOCAL_TAXONOMY);

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [successTarget, setSuccessTarget] = useState(null);

  /* ==========================================================
     TAXONOMY
     ========================================================== */

  useEffect(() => {
    let mounted = true;

    getServiceTaxonomy()
      .then((response) => {
        const remoteTaxonomy = response?.data?.taxonomy;

        if (
          mounted &&
          remoteTaxonomy &&
          typeof remoteTaxonomy === 'object'
        ) {
          setTaxonomy(remoteTaxonomy);
        }
      })
      .catch(() => {
        /* Lokal taxonomy ishlatiladi */
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================
     LABEL HELPERS
     ========================================================== */

  const getDirectionLabel = (slug) =>
    t(`serviceTaxonomy.directions.${slug}`, {
      defaultValue: DIRECTIONS[slug]?.label || slug,
    });

  const getCategoryLabel = (directionSlug, slug) =>
    t(`serviceTaxonomy.categories.${slug}`, {
      defaultValue:
        DIRECTIONS[directionSlug]?.categories?.[slug] || slug,
    });

  const directionList = useMemo(
    () => Object.keys(taxonomy),
    [taxonomy]
  );

  const categoryList = useMemo(
    () => (direction ? taxonomy[direction] || [] : []),
    [taxonomy, direction]
  );

  /* ==========================================================
     VALIDATION
     ========================================================== */

  const isDetailsValid =
    formData.name.trim() &&
    formData.description.trim() &&
    formData.phone.trim() &&
    (entityType !== 'company' || formData.company.trim());

  const isStepValid = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return Boolean(entityType);
      case 1:
        return Boolean(direction);
      case 2:
        return Boolean(category);
      case 3:
        return Boolean(isDetailsValid);
      default:
        return true;
    }
  };

  /* ==========================================================
     HANDLERS
     ========================================================== */

  const goNext = () => {
    if (!isStepValid(step)) return;

    setError('');
    setStep((current) =>
      Math.min(current + 1, STEPS.length - 1)
    );
  };

  const goBack = () => {
    setError('');

    if (step === 0) {
      navigate(-1);
      return;
    }

    setStep((current) => Math.max(current - 1, 0));
  };

  const goToStep = (index) => {
    const canGo =
      index <= step ||
      STEPS.slice(0, index).every((_, i) => isStepValid(i));

    if (canGo) setStep(index);
  };

  const handleSelectEntity = (value) => {
    setEntityType(value);

    if (value === 'individual') {
      setFormData((prev) => ({
        ...prev,
        company: '',
        website: '',
      }));
    }

    window.setTimeout(() => setStep(1), 250);
  };

  const handleSelectDirection = (slug) => {
    if (slug !== direction) {
      setCategory('');
    }

    setDirection(slug);
    window.setTimeout(() => setStep(2), 250);
  };

  const handleSelectCategory = (slug) => {
    setCategory(slug);
    window.setTimeout(() => setStep(3), 250);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ==========================================================
     SUBMIT
     ========================================================== */

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!entityType || !direction || !category || !isDetailsValid) {
      setError(
        t(
          'becomeProvider.errors.incomplete',
          'Iltimos, barcha majburiy maydonlarni to‘ldiring'
        )
      );
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    setError('');

    try {
      const payload = {
        entityType,
        company:
          entityType === 'company'
            ? formData.company.trim()
            : '',
        name: formData.name.trim(),
        description: formData.description.trim(),
        phone: formData.phone.trim(),
        price_range: formData.price_range.trim(),
        email: formData.email.trim(),
        website:
          entityType === 'company'
            ? formData.website.trim()
            : '',
        level1: direction,
        service_category: category,
        serviceTags: [category],
      };

      const response = await createServiceProvider(payload);
      const providerId = response?.data?._id;

      if (providerId && mediaFiles.length > 0) {
        const mediaData = new FormData();

        mediaFiles.forEach((mediaFile) => {
          if (mediaFile?.file) {
            mediaData.append('media', mediaFile.file);
          }
        });

        await uploadServiceMedia(
          providerId,
          mediaData,
          (progressEvent) => {
            if (!progressEvent.total) return;

            setUploadProgress(
              Math.round(
                (progressEvent.loaded * 100) /
                  progressEvent.total
              )
            );
          }
        );
      }

      setSuccessTarget(
        providerId
          ? `/service-provider/${providerId}`
          : '/profile'
      );
    } catch (requestError) {
      console.error('Become provider xatosi:', requestError);

      setError(
        requestError?.response?.data?.error ||
          t(
            'becomeProvider.errors.submit',
            'Ro‘yxatdan o‘tishda xatolik yuz berdi'
          )
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ==========================================================
     RENDER HELPERS
     ========================================================== */

  const selectedDirection = DIRECTIONS[direction];
  const DirectionIcon = selectedDirection?.icon || Sparkles;

  const renderTypeStep = () => (
    <div className="bp-panel">
      <div className="bp-panel__head">
        <h2>
          {t(
            'becomeProvider.type.title',
            'Siz kim sifatida xizmat ko‘rsatasiz?'
          )}
        </h2>
        <p>
          {t(
            'becomeProvider.type.desc',
            'Keyinchalik bu ma’lumotni o‘zgartirishingiz mumkin'
          )}
        </p>
      </div>

      <div className="bp-type-grid">
        <button
          type="button"
          className={`bp-type-card ${
            entityType === 'individual' ? 'is-active' : ''
          }`}
          onClick={() => handleSelectEntity('individual')}
        >
          {entityType === 'individual' && (
            <span className="bp-check">
              <Check size={13} />
            </span>
          )}

          <span className="bp-type-card__icon">
            <User size={28} />
          </span>

          <strong>
            {t('becomeProvider.type.individual', 'Jismoniy shaxs')}
          </strong>

          <span>
            {t(
              'becomeProvider.type.individualDesc',
              'O‘zingiz mustaqil usta yoki mutaxassis sifatida'
            )}
          </span>
        </button>

        <button
          type="button"
          className={`bp-type-card ${
            entityType === 'company' ? 'is-active' : ''
          }`}
          onClick={() => handleSelectEntity('company')}
        >
          {entityType === 'company' && (
            <span className="bp-check">
              <Check size={13} />
            </span>
          )}

          <span className="bp-type-card__icon">
            <Building2 size={28} />
          </span>

          <strong>{t('becomeProvider.type.company', 'Firma')}</strong>

          <span>
            {t(
              'becomeProvider.type.companyDesc',
              'Jamoa bilan ishlaydigan kompaniya sifatida'
            )}
          </span>
        </button>
      </div>
    </div>
  );

  const renderDirectionStep = () => (
    <div className="bp-panel">
      <div className="bp-panel__head">
        <h2>
          {t('becomeProvider.direction.title', 'Yo‘nalishni tanlang')}
        </h2>
        <p>
          {t(
            'becomeProvider.direction.desc',
            'Xizmatingiz qaysi sohaga tegishli?'
          )}
        </p>
      </div>

      <div className="bp-direction-grid">
        {directionList.map((slug) => {
          const meta = DIRECTIONS[slug] || {};
          const Icon = meta.icon || Sparkles;
          const active = direction === slug;

          return (
            <button
              key={slug}
              type="button"
              className={`bp-direction-card ${
                active ? 'is-active' : ''
              }`}
              style={{
                '--bp-item-color': meta.color || '#00c8f8',
              }}
              onClick={() => handleSelectDirection(slug)}
            >
              <span className="bp-direction-card__icon">
                <Icon size={22} />
              </span>

              <span className="bp-direction-card__text">
                <strong>{getDirectionLabel(slug)}</strong>
                <small>
                  {(taxonomy[slug] || []).length}{' '}
                  {t('becomeProvider.direction.count', 'ta kasb')}
                </small>
              </span>

              {active && (
                <span className="bp-direction-card__check">
                  <Check size={14} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderCategoryStep = () => (
    <div className="bp-panel">
      <div className="bp-panel__head">
        <h2>
          {t('becomeProvider.category.title', 'Kasbingizni tanlang')}
        </h2>
        <p>
          <DirectionIcon size={14} />{' '}
          {direction ? getDirectionLabel(direction) : ''}
        </p>
      </div>

      <div className="bp-chip-grid">
        {categoryList.map((slug) => {
          const active = category === slug;

          return (
            <button
              key={slug}
              type="button"
              className={`bp-chip ${active ? 'is-active' : ''}`}
              onClick={() => handleSelectCategory(slug)}
            >
              {active && <Check size={14} />}
              <span>{getCategoryLabel(direction, slug)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="bp-panel">
      <div className="bp-panel__head">
        <h2>
          {t('becomeProvider.details.title', 'Xizmat ma’lumotlari')}
        </h2>
        <p>
          {t(
            'becomeProvider.details.desc',
            'Mijozlar sizni shu ma’lumotlar orqali topadi'
          )}
        </p>
      </div>

      {entityType === 'company' && (
        <>
          <div className="bp-field">
            <label htmlFor="bp-company">
              {t('becomeProvider.fields.company', 'Firma nomi')} *
            </label>
            <input
              id="bp-company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              maxLength={200}
              placeholder={t(
                'becomeProvider.fields.companyPlaceholder',
                'Masalan: GRU Service MCHJ'
              )}
            />
          </div>

          <div className="bp-note">
            <Users size={17} />
            <span>
              {t(
                'becomeProvider.companyStaffNote',
                'Firma yaratilgandan keyin xodimlarni qo‘shishingiz mumkin. Arizalar barcha xodimlarga yuboriladi.'
              )}
            </span>
          </div>
        </>
      )}

      <div className="bp-field">
        <label htmlFor="bp-name">
          {t('becomeProvider.fields.name', 'Xizmat nomi')} *
        </label>
        <input
          id="bp-name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          maxLength={150}
          placeholder={t(
            'becomeProvider.fields.namePlaceholder',
            'Masalan: Tez va sifatli santexnika xizmati'
          )}
        />
      </div>

      <div className="bp-field">
        <label htmlFor="bp-description">
          {t('becomeProvider.fields.description', 'Tavsif')} *
        </label>

        <AITextEnhanceButton
          value={formData.description}
          onChange={(newText) =>
            setFormData((prev) => ({
              ...prev,
              description: newText,
            }))
          }
        />

        <textarea
          id="bp-description"
          name="description"
          rows={5}
          value={formData.description}
          onChange={handleChange}
          maxLength={5000}
          placeholder={t(
            'becomeProvider.fields.descriptionPlaceholder',
            'Tajribangiz, ish sharoitlari va afzalliklaringiz haqida yozing'
          )}
        />
      </div>

      <div className="bp-row">
        <div className="bp-field">
          <label htmlFor="bp-phone">
            {t('becomeProvider.fields.phone', 'Telefon')} *
          </label>
          <input
            id="bp-phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            maxLength={50}
            placeholder="+998 90 123 45 67"
          />
        </div>

        <div className="bp-field">
          <label htmlFor="bp-price">
            {t('becomeProvider.fields.priceRange', 'Narx oralig‘i')}
          </label>
          <input
            id="bp-price"
            name="price_range"
            value={formData.price_range}
            onChange={handleChange}
            maxLength={200}
            placeholder={t(
              'becomeProvider.fields.pricePlaceholder',
              'Masalan: 100 000 – 300 000 so‘m'
            )}
          />
        </div>
      </div>

      <div className="bp-row">
        <div className="bp-field">
          <label htmlFor="bp-email">
            {t('becomeProvider.fields.email', 'Email')}
          </label>
          <input
            id="bp-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            maxLength={200}
            placeholder="example@mail.com"
          />
        </div>

        {entityType === 'company' && (
          <div className="bp-field">
            <label htmlFor="bp-website">
              {t('becomeProvider.fields.website', 'Veb-sayt')}
            </label>
            <input
              id="bp-website"
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              maxLength={500}
              placeholder="https://..."
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="bp-panel">
      <div className="bp-panel__head">
        <h2>
          {t('becomeProvider.review.title', 'Media va tasdiqlash')}
        </h2>
        <p>
          {t(
            'becomeProvider.review.desc',
            'Ishlaringizdan rasm yoki video qo‘shing (ixtiyoriy)'
          )}
        </p>
      </div>

      <MediaUploader
        mediaFiles={mediaFiles}
        setMediaFiles={setMediaFiles}
        label={t('becomeProvider.fields.media', 'Rasm va videolar')}
      />

      <div className="bp-summary">
        <div className="bp-summary__row">
          <span>{t('becomeProvider.summary.type', 'Tur')}</span>
          <strong>
            {entityType === 'company'
              ? t('becomeProvider.type.company', 'Firma')
              : t('becomeProvider.type.individual', 'Jismoniy shaxs')}
          </strong>
        </div>

        {entityType === 'company' && (
          <div className="bp-summary__row">
            <span>{t('becomeProvider.fields.company', 'Firma nomi')}</span>
            <strong>{formData.company}</strong>
          </div>
        )}

        <div className="bp-summary__row">
          <span>{t('becomeProvider.summary.direction', 'Yo‘nalish')}</span>
          <strong>{getDirectionLabel(direction)}</strong>
        </div>

        <div className="bp-summary__row">
          <span>{t('becomeProvider.summary.category', 'Kasb')}</span>
          <strong>{getCategoryLabel(direction, category)}</strong>
        </div>

        <div className="bp-summary__row">
          <span>{t('becomeProvider.fields.name', 'Xizmat nomi')}</span>
          <strong>{formData.name}</strong>
        </div>

        <div className="bp-summary__row">
          <span>{t('becomeProvider.fields.phone', 'Telefon')}</span>
          <strong>{formData.phone}</strong>
        </div>
      </div>

      {submitting && uploadProgress > 0 && (
        <div className="bp-progress">
          <div
            className="bp-progress__fill"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return renderTypeStep();
      case 1:
        return renderDirectionStep();
      case 2:
        return renderCategoryStep();
      case 3:
        return renderDetailsStep();
      default:
        return renderReviewStep();
    }
  };

  const isLastStep = step === STEPS.length - 1;

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <main className="bp-page">
      <button
        type="button"
        className="bp-back-btn"
        onClick={() => navigate(-1)}
        disabled={submitting}
      >
        <ArrowLeft size={16} />
        <span>{t('common.back', 'Orqaga')}</span>
      </button>

      <header className="bp-hero">
        <span className="bp-hero__eyebrow">
          <Sparkles size={14} />
          {t('becomeProvider.eyebrow', 'G.R.U Xizmatlar')}
        </span>

        <h1>
          {t('becomeProvider.title', 'Xizmat ko‘rsatuvchi bo‘lish')}
        </h1>

        <p>
          {t(
            'becomeProvider.subtitle',
            'Hunaringizni ko‘rsating — mijozlar sizni o‘zlari topsin'
          )}
        </p>
      </header>

      <section className="bp-card">
        {/* Progress */}
        <nav className="bp-steps" aria-label="Qadamlar">
          {STEPS.map((item, index) => {
            const state =
              index < step
                ? 'done'
                : index === step
                  ? 'active'
                  : 'upcoming';

            return (
              <button
                key={item.key}
                type="button"
                className={`bp-step bp-step--${state}`}
                onClick={() => goToStep(index)}
                disabled={submitting}
              >
                <span className="bp-step__dot">
                  {state === 'done' ? (
                    <Check size={13} />
                  ) : (
                    index + 1
                  )}
                </span>

                <span className="bp-step__label">
                  {t(`becomeProvider.steps.${item.key}`, item.label)}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="bp-steps-bar">
          <div
            className="bp-steps-bar__fill"
            style={{
              width: `${(step / (STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Body */}
        <div className="bp-body" key={step}>
          {renderStep()}
        </div>

        {error && (
          <div className="bp-error" role="alert">
            <Info size={17} />
            <span>{error}</span>
          </div>
        )}

        {/* Footer */}
        <footer className="bp-footer">
          <button
            type="button"
            className="bp-btn bp-btn--ghost"
            onClick={goBack}
            disabled={submitting}
          >
            <ArrowLeft size={16} />
            <span>{t('becomeProvider.buttons.back', 'Orqaga')}</span>
          </button>

          {isLastStep ? (
            <button
              type="button"
              className="bp-btn bp-btn--primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={17} className="bp-spin" />
                  <span>
                    {t('becomeProvider.buttons.submitting', 'Yuborilmoqda...')}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} />
                  <span>
                    {t(
                      'becomeProvider.buttons.submit',
                      'Ro‘yxatdan o‘tish'
                    )}
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="bp-btn bp-btn--primary"
              onClick={goNext}
              disabled={!isStepValid(step)}
            >
              <span>{t('becomeProvider.buttons.next', 'Keyingi')}</span>
              <ArrowRight size={16} />
            </button>
          )}
        </footer>
      </section>

      {successTarget && (
        <SuccessModal
          message={t(
            'becomeProvider.success',
            'Tabriklaymiz! Siz endi xizmat ko‘rsatuvchisiz'
          )}
          onDone={() => navigate(successTarget, { replace: true })}
        />
      )}
    </main>
  );
}