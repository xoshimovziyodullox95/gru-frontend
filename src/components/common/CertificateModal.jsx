import { X } from 'lucide-react';

export default function CertificateModal({ isOpen, onClose, title, url, isPdf = false }) {
  if (!isOpen) return null;

  return (
    <div className="cert-modal-overlay" onClick={onClose}>
      <div className="cert-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="cert-modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="cert-modal-close"><X size={20} /></button>
        </div>
        <div className="cert-modal-body">
          {isPdf ? (
            <iframe src={url} className="cert-pdf-viewer" title={title} />
          ) : (
            <div className="cert-text-content">
              <p>Hujjatni ko‘rish uchun quyidagi havolani bosing:</p>
              <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}