// src/components/forms/AddEquipmentForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getLevel1, getLevel2 } from '../services/categories';
import { createEquipment, uploadEquipmentMedia } from '../services/equipment';
import { Upload, X, Cpu, UtensilsCrossed, Sofa, Package, Check, ArrowLeft } from 'lucide-react';
import SuccessModal from '../common/SuccessModal';
import '../../styles/forms.css';
import '../../styles/addEquipmentForm.css';

export default function AddEquipmentForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preSelectedLevel1 = queryParams.get('level1') || '';
  const preSelectedLevel2 = queryParams.get('level2') || '';

  const [loading, setLoading] = useState(false);
  const [level1List, setLevel1List] = useState([]);
  const [level2List, setLevel2List] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'USD',   // <--- YANGI qo'shildi
    level1: preSelectedLevel1,
    category: preSelectedLevel2,
    condition: 'new',
    phone: '',
    supplier: '',
    stockQuantity: '1',
  });

  const [productType, setProductType] = useState('');
  const [attrs, setAttrs] = useState({});
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successInfo, setSuccessInfo] = useState(null);

  // Mahsulot turlari – t() bilan
  const PRODUCT_TYPES = [
    { id: 'texnika', label: t('addEquipment.productTypes.texnika.label'), desc: t('addEquipment.productTypes.texnika.desc'), icon: Cpu },
    { id: 'oziqovqat', label: t('addEquipment.productTypes.oziqovqat.label'), desc: t('addEquipment.productTypes.oziqovqat.desc'), icon: UtensilsCrossed },
    { id: 'mebel', label: t('addEquipment.productTypes.mebel.label'), desc: t('addEquipment.productTypes.mebel.desc'), icon: Sofa },
    { id: 'boshqa', label: t('addEquipment.productTypes.boshqa.label'), desc: t('addEquipment.productTypes.boshqa.desc'), icon: Package },
  ];

  const UNIT_OPTIONS = [
    { value: 'dona', label: t('addEquipment.units.dona') },
    { value: 'kg', label: t('addEquipment.units.kg') },
    { value: 'g', label: t('addEquipment.units.g') },
    { value: 'l', label: t('addEquipment.units.l') },
    { value: 'ml', label: t('addEquipment.units.ml') },
  ];

  useEffect(() => {
    getLevel1().then(res => {
      const data = res.data.map(item => ({
        ...item,
        displayName: t(`categories.${item.key}`, { defaultValue: item.name || item.key })
      }));
      setLevel1List(data);
    }).catch(console.error);
  }, [t]);

  useEffect(() => {
    if (formData.level1) {
      getLevel2(formData.level1).then(res => {
        const data = res.data.map(item => {
          const key = item.key || item.level2;
          return {
            ...item,
            displayName: t(`categoriesLevel2.${key}`, { defaultValue: item.name || key })
          };
        });
        setLevel2List(data);
      }).catch(console.error);
    } else {
      setLevel2List([]);
    }
  }, [formData.level1, t]);

  useEffect(() => {
    setAttrs({});
  }, [productType]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAttrChange = (e) => {
    setAttrs({ ...attrs, [e.target.name]: e.target.value });
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

  function validateAttrs() {
    if (productType === 'oziqovqat') {
      if (!attrs.amount) return t('addEquipment.errors.attrAmount');
    }
    if (productType === 'mebel') {
      if (!attrs.length || !attrs.width || !attrs.height) return t('addEquipment.errors.attrDimensions');
    }
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert(t('addEquipment.errors.loginRequired'));
      navigate('/login');
      return;
    }
    if (!formData.title || !formData.price) {
      alert(t('addEquipment.errors.namePriceRequired'));
      return;
    }
    if (!formData.category || !formData.level1) {
      alert(t('addEquipment.errors.selectDirectionCategory'));
      return;
    }
    if (!productType) {
      alert(t('addEquipment.errors.selectProductType'));
      return;
    }
    if (!formData.stockQuantity || parseInt(formData.stockQuantity, 10) < 1) {
      alert(t('addEquipment.errors.stockMin'));
      return;
    }
    const attrError = validateAttrs();
    if (attrError) {
      alert(attrError);
      return;
    }
    setLoading(true);
    setUploadProgress(0);
    try {
      const payload = {
        ...formData,       // bu yerda currency ham bor
        price: parseFloat(formData.price) || 0,
        stockQuantity: Math.max(1, parseInt(formData.stockQuantity, 10) || 1),
        userId: user.id,
        productType,
        attributes: attrs,
      };
      const res = await createEquipment(payload);
      const equipmentId = res.data._id;
      if (mediaFiles.length) {
        const formDataMedia = new FormData();
        mediaFiles.forEach(mf => formDataMedia.append('media', mf.file));
        await uploadEquipmentMedia(equipmentId, formDataMedia, (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        });
      }
      setSuccessInfo({ target: `/category/${formData.level1}` });
    } catch (err) {
      console.error(err);
      alert(t('addEquipment.errors.submitError', { error: err.response?.data?.error || err.message }));
    } finally {
      setLoading(false);
    }
  };

  const showCondition = productType === 'texnika' || productType === 'mebel';

  // Tarjima qilingan level nomlari
  const level1Display = t(`categories.${formData.level1}`, { defaultValue: formData.level1 });
  const level2Display = t(`categoriesLevel2.${formData.category}`, { defaultValue: formData.category });

  return (
    <div className="add-equipment-form-container">
      <button type="button" className="aef-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        {t('addEquipment.back')}
      </button>

      <form onSubmit={handleSubmit} className="add-equipment-form">
        <h2>{t('addEquipment.title')}</h2>

        <div className="form-group">
          <label>{t('addEquipment.fields.name')}</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={t('addEquipment.fields.namePlaceholder')}
            required
          />
        </div>

        <div className="form-group">
          <label>{t('addEquipment.fields.description')}</label>
          <textarea
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            placeholder={t('addEquipment.fields.descriptionPlaceholder')}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t('addEquipment.fields.direction')}</label>
            <select
              name="level1"
              value={formData.level1}
              onChange={handleChange}
              required
            >
              <option value="">{t('addEquipment.fields.directionPlaceholder')}</option>
              {level1List.map(l1 => (
                <option key={l1.key} value={l1.key}>{l1.displayName}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{t('addEquipment.fields.category')}</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              disabled={!formData.level1}
            >
              <option value="">{t('addEquipment.fields.categoryPlaceholder')}</option>
              {level2List.map(l2 => (
                <option key={l2.key || l2.level2} value={l2.key || l2.level2}>
                  {l2.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{t('addEquipment.fields.productType')}</label>
          <div className="aef-type-grid">
            {PRODUCT_TYPES.map(pt => {
              const Icon = pt.icon;
              const active = productType === pt.id;
              return (
                <button
                  key={pt.id}
                  type="button"
                  className={`aef-type-card ${active ? 'active' : ''}`}
                  onClick={() => setProductType(pt.id)}
                >
                  {active && <span className="aef-type-check"><Check size={12} /></span>}
                  <span className="aef-type-icon"><Icon size={20} /></span>
                  <span className="aef-type-title">{pt.label}</span>
                  <span className="aef-type-desc">{pt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {productType && (
          <div className="aef-dynamic-fields">
            {showCondition && (
              <div className="form-group">
                <label>{t('addEquipment.fields.condition')}</label>
                <select name="condition" value={formData.condition} onChange={handleChange}>
                  <option value="new">{t('addEquipment.fields.conditionNew')}</option>
                  <option value="used">{t('addEquipment.fields.conditionUsed')}</option>
                </select>
              </div>
            )}

            {productType === 'texnika' && (
              <>
                {formData.condition === 'used' && (
                  <div className="form-group">
                    <label>{t('addEquipment.fields.usageDuration')}</label>
                    <input
                      type="text"
                      name="usageDuration"
                      value={attrs.usageDuration || ''}
                      onChange={handleAttrChange}
                      placeholder={t('addEquipment.fields.usageDurationPlaceholder')}
                    />
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('addEquipment.fields.brand')}</label>
                    <input
                      type="text"
                      name="brand"
                      value={attrs.brand || ''}
                      onChange={handleAttrChange}
                      placeholder={t('addEquipment.fields.brandPlaceholder')}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('addEquipment.fields.powerConsumption')}</label>
                    <input
                      type="number"
                      name="powerConsumption"
                      value={attrs.powerConsumption || ''}
                      onChange={handleAttrChange}
                      placeholder={t('addEquipment.fields.powerConsumptionPlaceholder')}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('addEquipment.fields.warrantyMonths')}</label>
                  <input
                    type="number"
                    name="warrantyMonths"
                    value={attrs.warrantyMonths || ''}
                    onChange={handleAttrChange}
                    placeholder={t('addEquipment.fields.warrantyMonthsPlaceholder')}
                  />
                </div>
              </>
            )}

            {productType === 'oziqovqat' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('addEquipment.fields.amount')}</label>
                    <input
                      type="number"
                      name="amount"
                      value={attrs.amount || ''}
                      onChange={handleAttrChange}
                      placeholder={t('addEquipment.fields.amountPlaceholder')}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('addEquipment.fields.unit')}</label>
                    <select name="unit" value={attrs.unit || 'kg'} onChange={handleAttrChange}>
                      {UNIT_OPTIONS.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('addEquipment.fields.expiryDate')}</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={attrs.expiryDate || ''}
                      onChange={handleAttrChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('addEquipment.fields.manufacturer')}</label>
                    <input
                      type="text"
                      name="manufacturer"
                      value={attrs.manufacturer || ''}
                      onChange={handleAttrChange}
                      placeholder={t('addEquipment.fields.manufacturerPlaceholder')}
                    />
                  </div>
                </div>
              </>
            )}

            {productType === 'mebel' && (
              <>
                <div className="form-group">
                  <label>{t('addEquipment.fields.dimensions')}</label>
                  <div className="aef-dimensions-row">
                    <input
                      type="number"
                      name="length"
                      value={attrs.length || ''}
                      onChange={handleAttrChange}
                      placeholder={t('addEquipment.fields.dimensionLength')}
                    />
                    <span className="aef-dimensions-x">×</span>
                    <input
                      type="number"
                      name="width"
                      value={attrs.width || ''}
                      onChange={handleAttrChange}
                      placeholder={t('addEquipment.fields.dimensionWidth')}
                    />
                    <span className="aef-dimensions-x">×</span>
                    <input
                      type="number"
                      name="height"
                      value={attrs.height || ''}
                      onChange={handleAttrChange}
                      placeholder={t('addEquipment.fields.dimensionHeight')}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('addEquipment.fields.material')}</label>
                    <input
                      type="text"
                      name="material"
                      value={attrs.material || ''}
                      onChange={handleAttrChange}
                      placeholder={t('addEquipment.fields.materialPlaceholder')}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('addEquipment.fields.color')}</label>
                    <input
                      type="text"
                      name="color"
                      value={attrs.color || ''}
                      onChange={handleAttrChange}
                      placeholder={t('addEquipment.fields.colorPlaceholder')}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* NARX MAYDONI - VALYUTA TANLASH QO'SHILDI */}
        <div className="form-row">
          <div className="form-group">
            <label>{t('addEquipment.fields.price')}</label>
            <div className="price-currency-row">
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder={t('addEquipment.fields.pricePlaceholder')}
                required
                step="0.01"
              />
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="currency-select"
              >
                <option value="USD">USD ($)</option>
                <option value="UZS">UZS (so'm)</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>{t('addEquipment.fields.phone')}</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('addEquipment.fields.phonePlaceholder')}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>{t('addEquipment.fields.stockQuantity')}</label>
          <input
            type="number"
            name="stockQuantity"
            min="1"
            step="1"
            value={formData.stockQuantity}
            onChange={handleChange}
            placeholder={t('addEquipment.fields.stockQuantityPlaceholder')}
            required
          />
          <span className="aef-hint">{t('addEquipment.fields.stockHint')}</span>
        </div>

        <div className="form-group">
          <label>{t('addEquipment.fields.supplier')}</label>
          <input
            type="text"
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            placeholder={t('addEquipment.fields.supplierPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('addEquipment.fields.media')}</label>
          <div className="media-upload-area">
            <label className="upload-btn">
              <Upload size={20} /> {t('addEquipment.fields.uploadBtn')}
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            <div className="media-previews">
              {mediaFiles.map((mf, idx) => (
                <div key={idx} className="media-preview">
                  {mf.type === 'image' ? (
                    <img src={mf.preview} alt="preview" />
                  ) : (
                    <video src={mf.preview} controls />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="remove-media"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        )}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? t('addEquipment.submitting') : t('addEquipment.submit')}
        </button>
      </form>

      {successInfo && (
        <SuccessModal
          message={t('addEquipment.success')}
          onDone={() => navigate(successInfo.target)}
        />
      )}
    </div>
  );
}