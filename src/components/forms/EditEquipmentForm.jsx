// src/components/forms/EditEquipmentForm.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEquipmentById, updateEquipment, uploadEquipmentMedia } from '../services/equipment';
import { getLevel1, getLevel2 } from '../services/categories';
import { Upload, X } from 'lucide-react';
import '../../styles/forms.css';

export default function EditEquipmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [level1List, setLevel1List] = useState([]);
  const [level2List, setLevel2List] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'USD',        // <--- YANGI
    level1: '',
    category: '',
    condition: 'new',
    phone: '',
    supplier: ''
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    Promise.all([
      getLevel1(),
      getEquipmentById(id)
    ]).then(([level1Res, eqRes]) => {
      setLevel1List(level1Res.data);
      const data = eqRes.data;
      setFormData({
        title: data.title || '',
        description: data.description || '',
        price: data.price || '',
        currency: data.currency || 'USD',   // <--- YANGI
        level1: data.level1 || '',
        category: data.category || '',
        condition: data.condition || 'new',
        phone: data.phone || '',
        supplier: data.supplier || ''
      });
      if (data.level1) {
        getLevel2(data.level1).then(res => setLevel2List(res.data));
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      alert('Maʼlumot yuklashda xatolik');
      navigate(-1);
    });
  }, [id]);

  useEffect(() => {
    if (formData.level1) {
      getLevel2(formData.level1).then(res => setLevel2List(res.data)).catch(console.error);
    } else {
      setLevel2List([]);
    }
  }, [formData.level1]);

  const handleChange = (e) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Iltimos, avval tizimga kiring');
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
      alert('Texnika muvaffaqiyatli yangilandi!');
      navigate(`/equipment/${id}`);
    } catch (err) {
      console.error(err);
      alert('Xatolik: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-spinner">Yuklanmoqda...</div>;

  return (
    <div className="add-equipment-form-container">
      <form onSubmit={handleSubmit} className="add-equipment-form">
        <h2>Texnikani tahrirlash</h2>
        
        <div className="form-group">
          <label>Nomi *</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>Tavsif *</label>
          <textarea name="description" rows="3" value={formData.description} onChange={handleChange} required />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Yo‘nalish (level1) *</label>
            <select name="level1" value={formData.level1} onChange={handleChange} required>
              <option value="">Tanlang</option>
              {level1List.map(l1 => <option key={l1.key} value={l1.key}>{l1.name || l1.key}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Kategoriya (level2) *</label>
            <select name="category" value={formData.category} onChange={handleChange} required disabled={!formData.level1}>
              <option value="">Tanlang</option>
              {level2List.map(l2 => <option key={l2.key || l2.level2} value={l2.key || l2.level2}>{l2.name || l2.level2}</option>)}
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
                <option value="UZS">UZS (so'm)</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Holati</label>
            <select name="condition" value={formData.condition} onChange={handleChange}>
              <option value="new">Yangi</option>
              <option value="used">Ishlatilgan</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Telefon raqam *</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>Yetkazib beruvchi (ixtiyoriy)</label>
          <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} />
        </div>
        
        <div className="form-group">
          <label>Rasmlar va videolar</label>
          <div className="media-upload-area">
            <label className="upload-btn">
              <Upload size={20} /> Fayl yuklash
              <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
            <div className="media-previews">
              {mediaFiles.map((mf, idx) => (
                <div key={idx} className="media-preview">
                  {mf.type === 'image' ? <img src={mf.preview} alt="preview" /> : <video src={mf.preview} controls />}
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
          {submitting ? 'Yangilanmoqda...' : 'Saqlash'}
        </button>
      </form>
    </div>
  );
}