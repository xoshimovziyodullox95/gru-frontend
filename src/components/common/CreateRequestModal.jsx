import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Modal from '../ui/Modal';
import LocationMapPicker from '../forms/LocationMapPicker';
import { getServiceTaxonomy } from '../services/serviceProviders';
import { createServiceRequest } from '../services/serviceRequests';

import '../../styles/serviceRequests.css';

const formatSlug = (slug = '') =>
  slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

export default function CreateRequestModal({
  isOpen,
  onClose,
  onCreated,
  defaultCategory = '',
}) {
  const navigate = useNavigate();

  const [taxonomy, setTaxonomy] = useState({});
  const [category, setCategory] = useState(defaultCategory);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null); // { lat, lng, address }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setCategory(defaultCategory);
    setDescription('');
    setLocation(null);
    setError('');

    getServiceTaxonomy()
      .then((res) => setTaxonomy(res.data?.taxonomy || {}))
      .catch(() => setError('Kategoriyalarni yuklab bo‘lmadi'));
  }, [isOpen, defaultCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!category) {
      setError('Kategoriyani tanlang');
      return;
    }

    if (description.trim().length < 10) {
      setError('Muammoni kamida 10 ta belgi bilan yozing');
      return;
    }

    if (!location) {
      setError('Xaritadan joylashuvni belgilang');
      return;
    }

    setSubmitting(true);

    try {
      const res = await createServiceRequest({
        category,
        description,
        location: {
          address: location.address || '',
          lat: location.lat,
          lng: location.lng,
        },
      });

      toast.success(
        `So‘rov yuborildi! ${res.data?.notifiedCount || 0} ta ustaga bildirishnoma ketdi`
      );

      onCreated?.(res.data?.request);
      onClose();

      if (res.data?.request?._id) {
        navigate(`/requests/${res.data.request._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Usta kerak"
      size="lg"
      footer={
        <>
          <button
            type="button"
            className="sr-btn sr-btn-secondary"
            onClick={onClose}
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            form="create-request-form"
            className="sr-btn sr-btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Yuborilmoqda...' : 'So‘rov yuborish'}
          </button>
        </>
      }
    >
      <form
        id="create-request-form"
        className="sr-form"
        onSubmit={handleSubmit}
      >
        <label className="sr-label">
          Kategoriya
          <select
            className="sr-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Tanlang...</option>
            {Object.entries(taxonomy).map(([direction, items]) => (
              <optgroup key={direction} label={formatSlug(direction)}>
                {items.map((slug) => (
                  <option key={slug} value={slug}>
                    {formatSlug(slug)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="sr-label">
          Nima kerak?
          <textarea
            className="sr-input"
            rows={4}
            maxLength={3000}
            placeholder="Masalan: oshxonadagi kran oqyapti, bugun kelish kerak"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label className="sr-label">Joylashuv</label>
        <LocationMapPicker
          lat={location?.lat}
          lng={location?.lng}
          onSelect={setLocation}
        />

        {location?.address && (
          <p className="sr-muted">📍 {location.address}</p>
        )}

        {error && <p className="sr-error">{error}</p>}
      </form>
    </Modal>
  );
}