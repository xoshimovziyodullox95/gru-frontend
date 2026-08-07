import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLevel1, getLevel2 } from '../services/categories';
import { createLocation, uploadLocationMedia } from '../services/locations';
import { createEquipment } from '../services/equipment'; // sizda bu funksiya mavjud
import { Upload, X, Image, Video, DollarSign, MapPin, Phone, User, Mail } from 'lucide-react';
import '../../styles/forms.css';

export default function AddListingForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preSelectedLevel1 = queryParams.get('level1') || '';
  const preSelectedLevel2 = queryParams.get('level2') || '';
  const preSelectedType = queryParams.get('type') || '';

  // Ma'lumotlar
  const [level1List, setLevel1List] = useState([]);
  const [level2List, setLevel2List] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: yo'nalish va kategoriya, 2: tur, 3: forma

  // Tanlovlar
  const [selectedLevel1, setSelectedLevel1] = useState(preSelectedLevel1);
  const [selectedLevel2, setSelectedLevel2] = useState(preSelectedLevel2);
  const [selectedType, setSelectedType] = useState(preSelectedType); // 'location' yoki 'equipment'

  // Forma maydonlari
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    price_currency: 'UZS', // yoki 'USD'
    phone: user?.phone || '',
    address: '',
    contactPerson: user?.full_name || '',
    email: user?.email || '',
  });

  // Media fayllar: { file, preview, type }
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Yuklash
  useEffect(() => {
    getLevel1().then(res => setLevel1List(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedLevel1) {
      getLevel2(selectedLevel1).then(res => setLevel2List(res.data)).catch(console.error);
    } else {
      setLevel2List([]);
    }
  }, [selectedLevel1]);

  const handleLevel1Change = (e) => {
    setSelectedLevel1(e.target.value);
    setSelectedLevel2('');
  };

  const handleLevel2Change = (e) => setSelectedLevel2(e.target.value);
  const handleTypeChange = (type) => setSelectedType(type);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Iltimos, avval tizimga kiring');
      navigate('/login');
      return;
    }
    if (!selectedLevel1 || !selectedLevel2 || !selectedType) {
      alert('Yo‘nalish, kategoriya va e’lon turini tanlang');
      return;
    }
    if (formData.title.length < 5) {
      alert('Nomi kamida 5 belgidan iborat bo‘lishi kerak');
      return;
    }
    if (formData.description.length < 20) {
      alert('Tavsif kamida 20 belgidan iborat bo‘lishi kerak');
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
          category: selectedLevel2,
          level1: selectedLevel1,
          level2: selectedLevel2,
          description: formData.description,
          price_range: `${formData.price} ${formData.price_currency}`,
          userId: user.id
        };
        const res = await createLocation(payload);
        createdItem = res.data;
      } else if (selectedType === 'equipment') {
        payload = {
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price) || 0,
          category: selectedLevel2,
          level1: selectedLevel1,
          level2: selectedLevel2,
          phone: formData.phone,
          userId: user.id
        };
        const res = await createEquipment(payload);
        createdItem = res.data;
      } else {
        throw new Error('Noma’lum tur');
      }

      // Medialarni yuklash
      if (mediaFiles.length > 0) {
        const formDataMedia = new FormData();
        mediaFiles.forEach(mf => formDataMedia.append('media', mf.file));
        if (selectedType === 'location') {
          await uploadLocationMedia(createdItem._id, formDataMedia, (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          });
        } else {
          // Texnika uchun media yuklash endpointi (agar mavjud bo‘lsa)
          // Agar yo‘q bo‘lsa, hozircha o‘tkazib yuboramiz
          console.log('Texnika media yuklash hali qo‘llanilmagan');
        }
      }
      alert('E’lon muvaffaqiyatli qo‘shildi!');
      navigate(`/${selectedType}/${createdItem._id}`);
    } catch (err) {
      console.error(err);
      alert('Xatolik yuz berdi: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Qadam 1: Yo'nalish va kategoriya
  if (step === 1) {
    return (
      <div className="add-listing-container">
        <div className="add-listing-card">
          <h2>Yangi e’lon qo‘shish</h2>
          <div className="form-group">
            <label>Yo‘nalish *</label>
            <select value={selectedLevel1} onChange={handleLevel1Change}>
              <option value="">-- Tanlang --</option>
              {level1List.map(item => <option key={item.key} value={item.key}>{item.name || item.key}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Kategoriya *</label>
            <select value={selectedLevel2} onChange={handleLevel2Change} disabled={!selectedLevel1}>
              <option value="">-- Tanlang --</option>
              {level2List.map(item => <option key={item.key || item.level2} value={item.key || item.level2}>{item.name || item.level2}</option>)}
            </select>
          </div>
          <button className="next-step-btn" onClick={() => setStep(2)} disabled={!selectedLevel2}>Keyingi →</button>
        </div>
      </div>
    );
  }

  // Qadam 2: Tur tanlash
  if (step === 2) {
    return (
      <div className="add-listing-container">
        <div className="add-listing-card">
          <h2>Nimani qo‘shmoqchisiz?</h2>
          <div className="type-buttons">
            <button className={selectedType === 'location' ? 'active' : ''} onClick={() => handleTypeChange('location')}>
              📍 Lokatsiya (joy)
            </button>
            <button className={selectedType === 'equipment' ? 'active' : ''} onClick={() => handleTypeChange('equipment')}>
              🔧 Texnika
            </button>
          </div>
          <div className="step-navigation">
            <button className="back-step-btn" onClick={() => setStep(1)}>← Orqaga</button>
            <button className="next-step-btn" onClick={() => setStep(3)} disabled={!selectedType}>Keyingi →</button>
          </div>
        </div>
      </div>
    );
  }

  // Qadam 3: To‘liq forma
  return (
    <div className="add-listing-container">
      <form onSubmit={handleSubmit} className="add-listing-form">
        <h2>E’lon ma’lumotlari</h2>
        
        <div className="form-group">
          <label>Nomi *</label>
          <input type="text" name="title" value={formData.title} onChange={handleInputChange} required minLength={5} />
        </div>

        <div className="form-group">
          <label>Tavsif *</label>
          <textarea name="description" rows={5} value={formData.description} onChange={handleInputChange} required minLength={20} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Narxi</label>
            <input type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="Masalan: 1500000" />
          </div>
          <div className="form-group">
            <label>Valyuta</label>
            <select name="price_currency" value={formData.price_currency} onChange={handleInputChange}>
              <option value="UZS">so‘m</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Manzil *</label>
          <input type="text" name="address" value={formData.address} onChange={handleInputChange} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Telefon *</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Kontakt shaxs *</label>
            <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} required />
          </div>
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
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

        <div className="step-navigation">
          <button type="button" className="back-step-btn" onClick={() => setStep(2)}>← Orqaga</button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Yuklanmoqda...' : 'E’lonni joylashtirish'}
          </button>
        </div>
      </form>
    </div>
  );
}