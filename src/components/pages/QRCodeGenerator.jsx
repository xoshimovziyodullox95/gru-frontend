// src/components/pages/QRCodeGenerator.jsx
// Profil havolasi: QR kod, nusxalash va telefonning o'z "Ulashish" menyusi
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/qrCode.css';

export default function QRCodeGenerator({ value }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t('qr.copied', 'Havola nusxalandi'));
    }).catch(() => {
      toast.error(t('qr.copyError', 'Nusxalab bo‘lmadi'));
    });
  };

  const handleShare = () => {
    navigator.share({ title: 'ZUMO', url: value }).catch(() => {});
  };

  // QR kod API (https://api.qrserver.com)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(value)}`;

  return (
    <div className="qrg">
      <div className="qrg__code">
        <img src={qrUrl} alt="QR" width="200" height="200" />
      </div>
      <p className="qrg__hint">{t('qr.hint', 'Kamerani QR kodga qarating — profil ochiladi')}</p>
      <div className="qrg__link">
        <span>{value.replace(/^https?:\/\//, '')}</span>
        <button type="button" onClick={handleCopy} aria-label={t('qr.copy', 'Nusxalash')}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
      {canShare && (
        <button type="button" className="qrg__share" onClick={handleShare}>
          <Share2 size={17} /> {t('qr.share', 'Ulashish')}
        </button>
      )}
    </div>
  );
}
