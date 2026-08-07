// src/components/forms/EditServiceForm.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getServiceProviderById, updateServiceProvider, uploadServiceMedia } from '../services/serviceProviders';
import { getLevel1, getLevel2 } from '../services/categories';
import { Upload, X } from 'lucide-react';
import '../../styles/forms.css';

export default function EditServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [level1List, setLevel1List] = useState([]);
  const [level2List, setLevel2List] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    price_range: '',
    service_category: '',
    level1: '',
    company: '',
    email: '',
    website: '',
    image: ''
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    Promise.all([
      getLevel1(),
      getServiceProviderById(id)
    ]).then(([level1Res, providerRes]) => {
      setLevel1List(level1Res.data);
      const data = providerRes.data;
      setFormData({
        name: data.name || '',
        description: data.description || '',
        phone: data.phone || '',
        price_range: data.price_range || '',
        service_category: data.service_category || '',
        level1: data.level1 || '',
        company: data.company || '',
        email: data.email || '',
        website: data.website || '',
        image: data.image || ''
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
      const res = await updateServiceProvider(id, payload);
      if (mediaFiles.length) {
        const formDataMedia = new FormData();
        mediaFiles.forEach(mf => formDataMedia.append('media', mf.file));
        await uploadServiceMedia(id, formDataMedia, (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        });
      }
      alert('Xizmat muvaffaqiyatli yangilandi!');
      navigate(`/services/${formData.service_category}`);
    } catch (err) {
      console.error(err);
      alert('Xatolik: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-spinner">Yuklanmoqda...</div>;

  return (
    <div className="add-service-form-container">
      <form onSubmit={handleSubmit} className="add-service-form">
        <h2>Xizmatni tahrirlash</h2>
        
        <div className="form-group">
          <label>Xizmat nomi *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        
        <div className="form-group">
          <label>Tavsif *</label>
          <textarea name="description" rows="4" value={formData.description} onChange={handleChange} required />
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
            <select name="service_category" value={formData.service_category} onChange={handleChange} required disabled={!formData.level1}>
              <option value="">Tanlang</option>
              {level2List.map(l2 => <option key={l2.key || l2.level2} value={l2.key || l2.level2}>{l2.name || l2.level2}</option>)}
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Kompaniya nomi (ixtiyoriy)</label>
            <input type="text" name="company" value={formData.company} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Narx oralig‘i *</label>
            <input type="text" name="price_range" value={formData.price_range} onChange={handleChange} placeholder="masalan: 500 USD/oy" required />
          </div>
        </div>
        
        <div className="form-group">
          <label>Telefon raqam *</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Veb-sayt</label>
            <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://..." />
          </div>
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