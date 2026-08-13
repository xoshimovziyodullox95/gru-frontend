import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createServiceProvider, uploadServiceMedia } from '../services/serviceProviders';
import { useCategories } from '../hooks/useCategories';
import MediaUploader from '../MediaUploader';
import SuccessModal from '../common/SuccessModal';
import AITextEnhanceButton from '../common/AITextEnhanceButton'; // <-- AI tugma
import '../../styles/AddServiceForm.css';
import '../../styles/aiEnhance.css'; // <-- AI uslubi

// SERVICE_TAGS endi t() dan foydalanadi
const getServiceTags = (t) => [
  { slug: 'qurilish-va-tamirlash', label: t('services.construction') },
  { slug: 'santexnika', label: t('services.plumbing') },
  { slug: 'smm-marketing', label: t('services.smm') },
  { slug: 'jihozlar-taminot', label: t('services.supply') },
  { slug: 'event', label: t('services.event') },
  { slug: 'qr-oplata', label: t('services.qrPayment') },
  { slug: 'pko', label: t('services.pko') },
  { slug: 'kredit', label: t('services.credit') },
  { slug: 'rassrochka', label: t('services.installment') },
  { slug: 'buxgalteriya', label: t('services.accounting') },
  { slug: 'sayt-yaratish', label: t('services.website') },
  { slug: 'internet', label: t('services.internet') },
  { slug: 'vkladlar', label: t('services.deposits') },
  { slug: 'kartalar', label: t('services.cards') },
  { slug: 'pul-otkazmalari', label: t('services.moneyTransfers') },
];

export default function AddServiceForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);

  const { level1List, level2List, level1, level2, setLevel1, setLevel2 } = useCategories(
    queryParams.get('level1') || ''
  );

  const [formData, setFormData] = useState({
    name: '', description: '', phone: '', price_range: '', company: '', email: '', website: ''
  });

  const [providerType, setProviderType] = useState('individual');
  const [selectedTags, setSelectedTags] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successInfo, setSuccessInfo] = useState(null);

  const serviceTags = getServiceTags(t);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProviderTypeChange = (type) => {
    setProviderType(type);
    if (type === 'individual') {
      setFormData((prev) => ({ ...prev, company: '' }));
    }
  };

  const toggleTag = (slug) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert(t('addService.errors.loginRequired'));
      return navigate('/login');
    }
    if (!level2) {
      alert(t('addService.errors.selectCategory'));
      return;
    }
    if (providerType === 'business' && !formData.company.trim()) {
      alert(t('addService.errors.companyRequired'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        level1,
        service_category: level2,
        provider_type: providerType,
        serviceTags: selectedTags,
      };
      const res = await createServiceProvider(payload);
      const serviceId = res.data._id;

      if (mediaFiles.length > 0) {
        const fd = new FormData();
        mediaFiles.forEach(mf => fd.append('media', mf.file));
        await uploadServiceMedia(serviceId, fd, (p) => {
          setUploadProgress(Math.round((p.loaded * 100) / p.total));
        });
      }

      setSuccessInfo({ target: `/services/${level2}` });
    } catch (err) {
      alert(t('addService.errors.submitError', { error: err.response?.data?.error || err.message }));
    } finally {
      setLoading(false);
    }
  };

  // Tarjima qilingan level nomlari
  const level1Display = t(`categories.${level1}`, { defaultValue: level1 });
  const level2Display = t(`categoriesLevel2.${level2}`, { defaultValue: level2 });

  return (
    <div className="add-form-container">
      <button type="button" className="back-action-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        {t('addService.back')}
      </button>

      <form onSubmit={handleSubmit} className="add-form">
        <h2>{t('addService.title')}</h2>

        <div className="form-group">
          <label>{t('addService.fields.name')}</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('addService.fields.namePlaceholder')}
            required
          />
        </div>

        {/* ===== TAVSIFI (AI TUGMA BILAN) ===== */}
        <div className="form-group">
          <label>{t('addService.fields.description')}</label>
          <AITextEnhanceButton
            value={formData.description}
            onChange={(newText) => setFormData(prev => ({ ...prev, description: newText }))}
          />
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            placeholder={t('addService.fields.descriptionPlaceholder')}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t('addService.fields.direction')}</label>
            <select value={level1} onChange={e => setLevel1(e.target.value)} required>
              <option value="">{t('addService.fields.directionPlaceholder')}</option>
              {level1List.map(l => (
                <option key={l.key} value={l.key}>
                  {t(`categories.${l.key}`, { defaultValue: l.name || l.key })}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{t('addService.fields.category')}</label>
            <select
              value={level2}
              onChange={e => setLevel2(e.target.value)}
              required
              disabled={!level1}
            >
              <option value="">{t('addService.fields.categoryPlaceholder')}</option>
              {level2List.map(l => {
                const key = l.key || l.level2;
                return (
                  <option key={key} value={key}>
                    {t(`categoriesLevel2.${key}`, { defaultValue: l.name || key })}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">{t('addService.sectionTitle')}</h3>

          <div className="form-group">
            <label>{t('addService.fields.providerType')}</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-option ${providerType === 'individual' ? 'active' : ''}`}
                onClick={() => handleProviderTypeChange('individual')}
              >
                {t('addService.fields.providerIndividual')}
              </button>
              <button
                type="button"
                className={`segmented-option ${providerType === 'business' ? 'active' : ''}`}
                onClick={() => handleProviderTypeChange('business')}
              >
                {t('addService.fields.providerBusiness')}
              </button>
            </div>
          </div>

          {providerType === 'business' && (
            <>
              <div className="form-group">
                <label>{t('addService.fields.company')}</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder={t('addService.fields.companyPlaceholder')}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('addService.fields.website')}</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder={t('addService.fields.websitePlaceholder')}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>{t('addService.tagsLabel')}</label>
            <div className="service-tags-grid">
              {serviceTags.map((tag) => {
                const active = selectedTags.includes(tag.slug);
                return (
                  <button
                    key={tag.slug}
                    type="button"
                    className={`service-tag-chip ${active ? 'active' : ''}`}
                    onClick={() => toggleTag(tag.slug)}
                  >
                    {active && <Check size={12} />}
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t('addService.fields.priceRange')}</label>
            <input
              type="text"
              name="price_range"
              value={formData.price_range}
              onChange={handleChange}
              placeholder={t('addService.fields.priceRangePlaceholder')}
              required
            />
          </div>
          <div className="form-group">
            <label>{t('addService.fields.phone')}</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('addService.fields.phonePlaceholder')}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>{t('addService.fields.email')}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t('addService.fields.emailPlaceholder')}
          />
        </div>

        <MediaUploader
          mediaFiles={mediaFiles}
          setMediaFiles={setMediaFiles}
          label={t('addService.fields.media')}
        />

        {uploadProgress > 0 && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? t('addService.submitting') : t('addService.submit')}
        </button>
      </form>

      {successInfo && (
        <SuccessModal
          message={t('addService.success')}
          onDone={() => navigate(successInfo.target)}
        />
      )}
    </div>
  );
}