import { safeGoBack } from '../utils/navigation.js';
// src/components/forms/EditEquipmentForm.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEquipmentById, updateEquipment, uploadEquipmentMedia } from '../services/equipment';
import { useProductCategories } from '../utils/productCategories';
import { Upload, X } from 'lucide-react';
import '../../styles/forms.css';

import { T } from '../utils/T';
export default function EditEquipmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // Marketplace tovar kategoriyalari; ichki bo'limlar tanlangan kategoriyadan
  const { categories } = useProductCategories();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'USD',        // <--- YANGI
    level1: '',
    category: '',
    condition: 'new',
    saleMode: 'store',
    stockQuantity: '1',
    phone: '',
    supplier: ''
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    getEquipmentById(id).then((eqRes) => {
      const data = eqRes.data;
      setFormData({
        title: data.title || '',
        description: data.description || '',
        price: data.price || '',
        currency: data.currency || 'USD',   // <--- YANGI
        level1: data.level1 || '',
        category: data.category || '',
        condition: data.condition || 'new',
        saleMode: data.saleMode || 'store',
        stockQuantity: String(data.stockQuantity ?? 1),
        phone: data.phone || '',
        supplier: data.supplier || ''
      });
      setLoading(false);
    }).catch(err => {
      console.error(err);
      alert(T('Maʼlumot yuklashda xatolik'));
      safeGoBack(navigate);
    });
  }, [id]);

  const subs = categories.find((c) => c.id === formData.level1)?.subs || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Kategoriya almashsa, eski ichki bo'lim endi mos emas
    setFormData({ ...formData, [name]: value, ...(name === 'level1' ? { category: '' } : {}) });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert(T('Iltimos, avval tizimga kiring'));
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setUploadProgress(0);
    try {
      const payload = { ...formData };
      await updateEquipment(id, payload);
      if (mediaFiles.length) {
        const formDataMedia = new FormData();
        mediaFiles.forEach(mf => formDataMedia.append('media', mf.file));
        await uploadEquipmentMedia(id, formDataMedia, (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        });
      }
      alert(T('Texnika muvaffaqiyatli yangilandi!'));
      navigate(`/equipment/${id}`);
    } catch (err) {
      console.error(err);
      alert('Xatolik: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-spinner">{T('Yuklanmoqda...')}</div>;

  return (
    <div className="add-equipment-form-container">
      <form onSubmit={handleSubmit} className="add-equipment-form">
        <h2>{T('Texnikani tahrirlash')}</h2>
        
        <div className="form-group">
          <label>Nomi *</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required />
        </div>
        {formData.saleMode === 'store' && (
          <div className="form-group">
            <label>{T('Soni (dona)')}</label>
            <input type="number" name="stockQuantity" inputMode="numeric" min="1" value={formData.stockQuantity} onChange={handleChange} required />
          </div>
        )}

        <div className="form-group">
          <label>{T('Sotuv turi')}</label>
          <select name="saleMode" value={formData.saleMode} onChange={handleChange}>
            <option value="classified">{T('Oddiy e’lon')}</option>
            <option value="store">{T('Do‘kon mahsuloti')}</option>
          </select>
          <small>{formData.saleMode === 'store'
            ? T('Xaridor savatga qo‘shib buyurtma beradi; narx va qoldiq ko‘rinadi.')
            : T('Narx e’londa ko‘rinadi. Xaridor sotuvchi bilan chat yoki telefon orqali kelishadi.')}</small>
        </div>
        
        <div className="form-group">
          <label>Tavsif *</label>
          <textarea name="description" rows="3" value={formData.description} onChange={handleChange} required />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>{T('Kategoriya *')}</label>
            <select name="level1" value={categories.some((c) => c.id === formData.level1) ? formData.level1 : ''} onChange={handleChange} required>
              <option value="">{T('Tanlang')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>{T('Ichki bo‘lim *')}</label>
            <select name="category" value={subs.some((sub) => sub.id === formData.category) ? formData.category : ''} onChange={handleChange} required disabled={!subs.length}>
              <option value="">{T('Tanlang')}</option>
              {subs.map((sub) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Narxi *</label>
            <div className="price-currency-row">
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="masalan: 500"
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
                <option value="UZS">{T('UZS (so\'m)')}</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>{T('Holati')}</label>
            <select name="condition" value={formData.condition} onChange={handleChange}>
              <option value="new">{T('Yangi')}</option>
              <option value="used">{T('Ishlatilgan')}</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>{T('Telefon raqam *')}</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>{T('Yetkazib beruvchi (ixtiyoriy)')}</label>
          <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} />
        </div>
        
        <div className="form-group">
          <label>{T('Rasmlar va videolar')}</label>
          <div className="media-upload-area">
            <label className="upload-btn">
              <Upload size={20} /> {T('Fayl yuklash')}
              <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
            <div className="media-previews">
              {mediaFiles.map((mf, idx) => (
                <div key={idx} className="media-preview">
                  {mf.type === 'image' ? <img src={mf.preview} alt="" /> : <video src={mf.preview} controls />}
                  <button type="button" onClick={() => removeMedia(idx)} className="remove-media"><X size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div></div>
        )}
        
        <button type="submit" disabled={submitting} className="submit-btn">
          {submitting ? T('Yangilanmoqda...') : T('Saqlash')}
        </button>
      </form>
    </div>
  );
}
