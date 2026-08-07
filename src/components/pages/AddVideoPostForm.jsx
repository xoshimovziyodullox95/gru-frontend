import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { createVideoPost } from '../services/videos';
import '../../styles/addVideoForm.css';

export default function AddVideoPostForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError("Faqat video fayl yuklash mumkin");
      return;
    }
    setError('');
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setError("Iltimos, video tanlang");
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('title', title);
      formData.append('description', description);

      await createVideoPost(formData);
      navigate('/home');
    } catch (err) {
      console.error(err);
      setError("Video yuklashda xatolik yuz berdi");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="avf-page">
      <button className="avf-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> {t('common.back', 'Orqaga')}
      </button>

      <h1 className="avf-title">Video qo'shish</h1>

      <form className="avf-form" onSubmit={handleSubmit}>
        {!videoPreview ? (
          <label className="avf-upload-box">
            <Upload size={32} />
            <span>Video tanlash uchun bosing</span>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              hidden
            />
          </label>
        ) : (
          <div className="avf-preview-wrap">
            <video src={videoPreview} className="avf-preview-video" controls />
            <button type="button" className="avf-remove-btn" onClick={handleRemoveVideo}>
              <X size={18} />
            </button>
          </div>
        )}

        <div className="avf-field">
          <label>Sarlavha</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Videongiz haqida qisqacha"
          />
        </div>

        <div className="avf-field">
          <label>Tavsif</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Batafsil tavsif (ixtiyoriy)"
            rows={4}
          />
        </div>

        {error && <p className="avf-error">{error}</p>}

        <button type="submit" className="avf-submit-btn" disabled={uploading}>
          {uploading ? 'Yuklanmoqda...' : 'Joylashtirish'}
        </button>
      </form>
    </div>
  );
}