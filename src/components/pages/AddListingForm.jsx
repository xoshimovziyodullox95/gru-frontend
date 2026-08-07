import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { createLocation, uploadLocationMedia } from '../services/locations';
import { createEquipment } from '../services/equipment';
import { createService } from '../services/services';
import {
  Upload, X, MapPin, Package, Phone, User, Mail,
  ArrowLeft, Check, Wrench, Sofa, Hammer, Home, FileText, Briefcase,
  DollarSign, Image as ImageIcon, Coffee, Boxes
} from 'lucide-react';
import '../../styles/forms.css';

// ============================================================
// TOVAR TURLARI (faqat "Tovar" — /add-equipment — sahifasida ko‘rinadi)
// ============================================================
const PRODUCT_TYPES = [
  { id: 'equipment', labelKey: 'addListing.productTypes.equipment', icon: Wrench },
  { id: 'furniture', labelKey: 'addListing.productTypes.furniture', icon: Sofa },
  { id: 'tool', labelKey: 'addListing.productTypes.tool', icon: Hammer },
  { id: 'household', labelKey: 'addListing.productTypes.household', icon: Home },
  { id: 'food', labelKey: 'addListing.productTypes.food', icon: Coffee },
  { id: 'other', labelKey: 'addListing.productTypes.other', icon: Package },
];

// Sahifa qaysi route’da ochilganiga qarab e’lon turini aniqlaymiz
const TYPE_META = {
  location: { type: 'location', icon: MapPin },
  product: { type: 'product', icon: Boxes },
  service: { type: 'service', icon: Briefcase },
};

function resolveTypeFromPath(pathname) {
  if (pathname.includes('add-location')) return 'location';
  if (pathname.includes('add-service')) return 'service';
  return 'product'; // /add-equipment
}

export default function AddListingForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const routerLocation = useLocation();
  const queryParams = new URLSearchParams(routerLocation.search);
  const level1 = queryParams.get('level1') || '';
  const level2 = queryParams.get('level2') || '';
  const selectedType = resolveTypeFromPath(routerLocation.pathname);
  const TypeMeta = TYPE_META[selectedType];

  const [selectedProductType, setSelectedProductType] = useState('equipment');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    price_currency: 'UZS',
    phone: user?.phone || '',
    address: '',
    contactPerson: user?.full_name || '',
    email: user?.email || '',
  });

  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Agar kimdir yo‘nalish/kategoriya tanlamasdan to‘g‘ridan-to‘g‘ri shu sahifaga kirsa —
  // uni avval tanlov sahifasiga qaytaramiz
  useEffect(() => {
    if (!level1 || !level2) {
      navigate('/add-listing');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level1, level2]);

  // Tarjima qilingan level1 va level2 nomlarini olish (agar kerak bo'lsa)
  const level1Display = t(`categories.${level1}`, { defaultValue: level1 });
  const level2Display = t(`categoriesLevel2.${level2}`, { defaultValue: level2 });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video'
    }));
    setMediaFiles(prev => [...prev, ...newFiles]);
  };

  const removeMedia = (index) => {
    URL.revokeObjectURL(mediaFiles[index].preview);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const goBack = () => navigate('/add-listing');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert(t('addListing.errors.loginRequired'));
      navigate('/login');
      return;
    }
    if (!level1 || !level2) {
      navigate('/add-listing');
      return;
    }
    if (formData.title.length < 5) {
      alert(t('addListing.errors.titleMinLength'));
      return;
    }
    if (formData.description.length < 20) {
      alert(t('addListing.errors.descriptionMinLength'));
      return;
    }
    setLoading(true);
    setUploadProgress(0);
    try {
      let payload;
      let createdItem;

      if (selectedType === 'location') {
        payload = {
          title: formData.title,
          address: formData.address,
          phone: formData.phone,
          category: level2,
          level1,
          level2,
          description: formData.description,
          price_range: `${formData.price} ${formData.price_currency}`,
          userId: user.id
        };
        const res = await createLocation(payload);
        createdItem = res.data;
      } else if (selectedType === 'service') {
        payload = {
          name: formData.title,
          description: formData.description,
          price_range: `${formData.price} ${formData.price_currency}`,
          category: level2,
          service_category: level2,
          level1,
          level2,
          phone: formData.phone,
          contactPerson: formData.contactPerson,
          email: formData.email,
          userId: user.id,
        };
        const res = await createService(payload);
        createdItem = res.data;
      } else {
        // Tovar — equipment modeliga yozamiz
        payload = {
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price) || 0,
          category: selectedProductType,
          level1,
          level2,
          phone: formData.phone,
          supplier: formData.contactPerson,
          userId: user.id,
          condition: 'new',
        };
        const res = await createEquipment(payload);
        createdItem = res.data;
      }

      if (mediaFiles.length > 0) {
        const formDataMedia = new FormData();
        mediaFiles.forEach(mf => formDataMedia.append('media', mf.file));
        if (selectedType === 'location') {
          await uploadLocationMedia(createdItem._id, formDataMedia, (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          });
        } else {
          console.log('Media yuklash bu turdagi e’lon uchun hali qo‘llanilmagan');
        }
      }
      alert(t('addListing.success'));
      const routeBase = selectedType === 'location' ? 'location' : selectedType === 'service' ? 'service' : 'equipment';
      navigate(`/${routeBase}/${createdItem._id}`);
    } catch (err) {
      console.error(err);
      alert(t('addListing.errors.submitError', { error: err.response?.data?.error || err.message }));
    } finally {
      setLoading(false);
    }
  };

  if (!level1 || !level2) return null;

  // Tarjima qilingan product type nomlarini olish
  const productTypes = PRODUCT_TYPES.map(pt => ({
    ...pt,
    label: t(pt.labelKey)
  }));

  return (
    <div className="add-listing-container">
      <form onSubmit={handleSubmit} className="add-listing-form">
        <button type="button" className="back-btn-top" onClick={goBack}>
          <ArrowLeft size={18} /> {t('addListing.back')}
        </button>

        <div className="context-bar">
          <span className="context-chip"><TypeMeta.icon size={14} /> {t(`addListing.typeMeta.${TypeMeta.type}`)}</span>
          <span className="context-sep">/</span>
          <span className="context-chip muted">{level1Display}</span>
          <span className="context-sep">/</span>
          <span className="context-chip muted">{level2Display}</span>
          <button type="button" className="context-edit" onClick={goBack}>{t('addListing.change')}</button>
        </div>

        <h2>{t('addListing.title')}</h2>
        <p className="step-subtitle">{t('addListing.subtitle')}</p>

        {selectedType === 'product' && (
          <div className="form-group">
            <label><Boxes size={16} /> {t('addListing.productTypeLabel')}</label>
            <div className="product-type-grid">
              {productTypes.map(pt => {
                const Icon = pt.icon;
                return (
                  <button
                    key={pt.id}
                    type="button"
                    className={`product-type-btn ${selectedProductType === pt.id ? 'active' : ''}`}
                    onClick={() => setSelectedProductType(pt.id)}
                  >
                    <Icon size={20} />
                    <span>{pt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="form-group">
          <label><Package size={16} /> {t('addListing.fields.name')}</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            minLength={5}
            placeholder={t('addListing.fields.namePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label><FileText size={16} /> {t('addListing.fields.description')}</label>
          <textarea
            name="description"
            rows={5}
            value={formData.description}
            onChange={handleInputChange}
            required
            minLength={20}
            placeholder={t('addListing.fields.descriptionPlaceholder')}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label><DollarSign size={16} /> {t('addListing.fields.price')}</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder={t('addListing.fields.pricePlaceholder')}
            />
          </div>
          <div className="form-group">
            <label>{t('addListing.fields.currency')}</label>
            <select name="price_currency" value={formData.price_currency} onChange={handleInputChange}>
              <option value="UZS">{t('addListing.fields.currencyUZS')}</option>
              <option value="USD">{t('addListing.fields.currencyUSD')}</option>
            </select>
          </div>
        </div>

        {selectedType === 'location' && (
          <div className="form-group">
            <label><MapPin size={16} /> {t('addListing.fields.address')}</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              placeholder={t('addListing.fields.addressPlaceholder')}
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label><Phone size={16} /> {t('addListing.fields.phone')}</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label><User size={16} /> {t('addListing.fields.contactPerson')}</label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label><Mail size={16} /> {t('addListing.fields.email')}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder={t('addListing.fields.emailPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label><ImageIcon size={16} /> {t('addListing.fields.media')}</label>
          <div className="media-upload-area">
            <label className="upload-btn">
              <Upload size={20} /> {t('addListing.fields.uploadBtn')}
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            {mediaFiles.length > 0 && (
              <div className="media-previews">
                {mediaFiles.map((mf, idx) => (
                  <div key={idx} className="media-preview">
                    {mf.type === 'image' ? <img src={mf.preview} alt="preview" /> : <video src={mf.preview} muted />}
                    <button type="button" onClick={() => removeMedia(idx)} className="remove-media"><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div></div>
        )}

        <div className="step-navigation">
          <button type="button" className="back-step-btn" onClick={goBack}>
            <ArrowLeft size={16} /> {t('addListing.back')}
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? t('addListing.submitting') : <>{t('addListing.submitBtn')} <Check size={18} /></>}
          </button>
        </div>
      </form>
    </div>
  );
}