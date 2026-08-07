// src/components/pages/QRCodeGenerator.jsx
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QRCodeGenerator({ value, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link nusxalandi!');
    }).catch(() => {
      toast.error('Nusxalashda xatolik');
    });
  };

  // QR kod API (https://api.qrserver.com)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}`;

  return (
    <div className="qr-body">
      <div className="qr-image-wrap">
        <img src={qrUrl} alt="QR Code" className="qr-image" />
      </div>
      <div className="qr-link-wrap">
        <input type="text" value={value} readOnly className="qr-link-input" />
        <button className="qr-copy-btn" onClick={handleCopy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Nusxalandi' : 'Nusxalash'}
        </button>
      </div>
      <p className="qr-hint">QR kodni skaner qilib profilga o‘tish</p>
    </div>
  );
}