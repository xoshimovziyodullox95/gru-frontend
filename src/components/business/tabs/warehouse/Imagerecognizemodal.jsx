// src/components/business/tabs/warehouse/ImageRecognizeModal.jsx
import { useState, useRef } from 'react';
import { X, Camera, Upload, Trash2, Check, Sparkles } from 'lucide-react';
import api from '../../../services/api';
import { createProduct } from '../../../services/business';
import '../../../../styles/imagerecognizemodal.css'

export default function ImageRecognizeModal({ businessId, onClose, onCreated }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedProducts, setDetectedProducts] = useState(null); // null = hali tahlil qilinmagan
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [createError, setCreateError] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setDetectedProducts(null);
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const res = await api.post(`/business/${businessId}/products/recognize-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const products = (res.data.products || []).map((p) => ({
        name: p.name,
        quantity: 1,
        sellPrice: '',
        include: true,
      }));
      setDetectedProducts(products);
    } catch (err) {
      alert('Xatolik: ' + (err.response?.data?.error || err.message));
    } finally {
      setAnalyzing(false);
    }
  };

  const updateProduct = (idx, field, value) => {
    setDetectedProducts((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const removeProduct = (idx) => {
    setDetectedProducts((prev) => prev.filter((_, i) => i !== idx));
  };

 const handleCreateAll = async () => {
  const validProducts = detectedProducts.filter((p) => p.include && p.name && p.sellPrice);
  if (validProducts.length === 0) {
    setCreateError("Kamida bitta mahsulotning nomi va narxini kiriting");
    return;
  }
  setCreating(true);
  setCreateError('');
  try {
    const created = [];
    for (const p of validProducts) {
      const res = await createProduct(businessId, {
        name: p.name,
        sellPrice: Number(p.sellPrice),
        unit: 'dona',
      });
      created.push(res.data);
    }
    onCreated(created);
    onClose();
  } catch (err) {
    setCreateError(err.response?.data?.error || err.message);
  } finally {
    setCreating(false);
  }
};

  return (
    <div className="pt-modal-overlay" onClick={onClose}>
      <div className="pt-modal irm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="pt-modal-header">
          <h3><Sparkles size={18} /> Rasm orqali mahsulot qo'shish</h3>
          <button type="button" className="pt-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {!imagePreview && (
          <div className="irm-upload-zone">
            <p className="pt-muted" style={{ marginBottom: 14 }}>
              Javon yoki qutidagi mahsulotlarni suratga oling — AI ularni avtomatik taniydi
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button type="button" className="pt-btn-primary" onClick={() => cameraInputRef.current?.click()}>
                <Camera size={16} /> Suratga olish
              </button>
              <button type="button" className="pt-btn-secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} /> Galereyadan tanlash
              </button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>
        )}

        {imagePreview && !detectedProducts && (
          <div className="irm-preview-zone">
            <img src={imagePreview} alt="Tanlangan rasm" className="irm-preview-img" />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" className="pt-btn-secondary" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                Boshqa rasm
              </button>
              <button type="button" className="pt-btn-primary" onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? 'AI tahlil qilmoqda...' : <><Sparkles size={16} /> AI bilan taniish</>}
              </button>
            </div>
            {analyzing && (
              <div className="irm-analyzing-hint">
                <div className="irm-orb-wrap">
                  <span className="irm-orb irm-orb-1" />
                  <span className="irm-orb irm-orb-2" />
                  <span className="irm-orb irm-orb-3" />
                </div>
                <span>Mahsulotlar aniqlanmoqda, biroz kuting...</span>
              </div>
            )}
          </div>
        )}

        {detectedProducts && (
          <div className="irm-results-zone">
            {detectedProducts.length === 0 ? (
              <p className="pt-empty">Rasmda mahsulot aniqlanmadi. Boshqa rasm bilan urinib ko'ring.</p>
            ) : (
              <>
                <p className="pt-muted" style={{ marginBottom: 10 }}>
                  {detectedProducts.length} ta mahsulot aniqlandi — narxlarini kiriting:
                </p>
                <div className="irm-products-list">
                  {detectedProducts.map((p, idx) => (
                    <div key={idx} className={`irm-product-row ${!p.include ? 'irm-excluded' : ''}`}>
                      <input
                        type="checkbox"
                        checked={p.include}
                        onChange={(e) => updateProduct(idx, 'include', e.target.checked)}
                      />
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updateProduct(idx, 'name', e.target.value)}
                        style={{ flex: 2 }}
                        placeholder="Nomi"
                      />
                      <input
                        type="number"
                        value={p.quantity}
                        onChange={(e) => updateProduct(idx, 'quantity', e.target.value)}
                        style={{ flex: 1 }}
                        placeholder="Soni"
                      />
                      <input
                        type="number"
                        value={p.sellPrice}
                        onChange={(e) => updateProduct(idx, 'sellPrice', e.target.value)}
                        style={{ flex: 1 }}
                        placeholder="Narxi"
                      />
                      <button type="button" className="pt-icon-btn pt-icon-danger" onClick={() => removeProduct(idx)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
{createError && <div className="pt-error">{createError}</div>}
        <div className="pt-modal-actions">
          <button type="button" onClick={onClose} className="pt-btn-secondary">Bekor qilish</button>
          {detectedProducts && detectedProducts.length > 0 && (
            <button type="button" onClick={handleCreateAll} disabled={creating} className="pt-btn-primary">
              {creating ? 'Qo\'shilmoqda...' : <><Check size={16} /> Barchasini qo'shish</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}