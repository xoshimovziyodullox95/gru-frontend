// src/components/forms/EditLocationForm.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLocationById, updateLocation, uploadLocationMedia } from '../services/locations';
import { getLevel1, getLevel2 } from '../services/categories';
import { Upload, X } from 'lucide-react';
import '../../styles/forms.css';

export default function EditLocationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [level1List, setLevel1List] = useState([]);
  const [level2List, setLevel2List] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    phone: '',
    level1: '',
    level2: '',
    sqm: '',
    price_range: '',
    currency: 'USD',        // <--- YANGI
    competitors_info: '',
    uvp: '',
    description: ''
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    Promise.all([
      getLevel1(),
      getLocationById(id)
    ]).then(([level1Res, locRes]) => {
      setLevel1List(level1Res.data);
      const data = locRes.data;
      setFormData({
        title: data.title || '',
        address: data.address || '',
        phone: data.phone || '',
        level1: data.level1 || '',
        level2: data.category || data.level2 || '',
        sqm: data.sqm || '',
        price_range: data.price_range || '',
        currency: data.currency || 'USD',   // <--- YANGI
        competitors_info: data.competitors_info || '',
        uvp: data.uvp || '',
        description: data.description || ''
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
      const payload = { ...formData, category: formData.level2 };
      await updateLocation(id, payload);
      if (mediaFiles.length) {
        const formDataMedia = new FormData();
        mediaFiles.forEach(mf => formDataMedia.append('media', mf.file));
        await uploadLocationMedia(id, formDataMedia, (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        });
      }
      alert('Joy muvaffaqiyatli yangilandi!');
      navigate(`/location/${id}`);
    } catch (err) {
      console.error(err);
      alert('Xatolik: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-spinner">Yuklanmoqda...</div>;

  return (
    <div className="add-location-form-container">
      <form onSubmit={handleSubmit} className="add-location-form">
        <h2>Joyni tahrirlash</h2>
        
        <div className="form-group">
          <label>Nomi *</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>Manzil *</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>Telefon *</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
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
            <select name="level2" value={formData.level2} onChange={handleChange} required disabled={!formData.level1}>
              <option value="">Tanlang</option>
              {level2List.map(l2 => <option key={l2.key || l2.level2} value={l2.key || l2.level2}>{l2.name || l2.level2}</option>)}
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Maydoni (kv.m)</label>
            <input type="number" name="sqm" value={formData.sqm} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Narx oralig‘i</label>
            <div className="price-currency-row">
              <input
                type="text"
                name="price_range"
                value={formData.price_range}
                onChange={handleChange}
                placeholder="masalan: 1500"
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
        </div>
        
        <div className="form-group">
          <label>Raqobat haqida</label>
          <textarea name="competitors_info" rows="2" value={formData.competitors_info} onChange={handleChange}></textarea>
        </div>
        
        <div className="form-group">
          <label>UVP (Asosiy ustunlik)</label>
          <textarea name="uvp" rows="2" value={formData.uvp} onChange={handleChange}></textarea>
        </div>
        
        <div className="form-group">
          <label>Tavsif</label>
          <textarea name="description" rows="3" value={formData.description} onChange={handleChange}></textarea>
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