import { useState } from 'react';
import { ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';
import './ImageGallery.css';

export default function ImageGallery({ images, locationTitle }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openModal = (index) => {
    setCurrentIndex(index);
    setModalOpen(true);
  };

  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  if (!images.length) return null;

  return (
    <>
      <div className="HeroMediaFrame">
        <img
          src={images[0]}
          alt={locationTitle}
          className="FeaturedImage"
          onClick={() => openModal(0)}
          style={{ cursor: 'pointer' }}
        />
        {images.length > 1 && (
          <button className="image-gallery-btn" onClick={() => openModal(0)}>
            <ZoomIn size={16} /> {images.length} rasm
          </button>
        )}
      </div>

      {modalOpen && (
        <div className="image-modal" onClick={() => setModalOpen(false)}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}><X size={18} /></button>
            <button className="modal-prev" onClick={prevImage}><ChevronLeft size={28} /></button>
            <img src={images[currentIndex]} alt="Gallery" className="modal-image" />
            <button className="modal-next" onClick={nextImage}><ChevronRight size={28} /></button>
            <div className="modal-counter">{currentIndex + 1} / {images.length}</div>
          </div>
        </div>
      )}
    </>
  );
}