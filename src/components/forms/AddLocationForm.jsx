import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { createLocation, uploadLocationMedia } from '../services/locations';
import { useCategories } from '../hooks/useCategories';
import MediaUploader from '../MediaUploader';
import LocationMapPicker from './LocationMapPicker';
import SuccessModal from '../common/SuccessModal.jsx';
import AITextEnhanceButton from "../common/AITextEnhanceButton.jsx";
import {
  Plus,
  Trash2,
  Plug,
  Wind,
  BookOpen,
  GraduationCap,
  Coffee,
  Pill,
  Building2,
  ShoppingBag,
  Landmark,
  MapPin,
  ArrowLeft,
} from 'lucide-react';
import '../../styles/addLocationForm.css';
import '../../styles/aienhance.css'; // <-- AI uslubi

// NEARBY_TYPES
const getNearbyTypes = (t) => [
  { value: 'school', label: t('addLocation.nearby.types.school'), Icon: BookOpen, emoji: '\ud83c\udfeb' },
  { value: 'university', label: t('addLocation.nearby.types.university'), Icon: GraduationCap, emoji: '\ud83c\udf93' },
  { value: 'cafe', label: t('addLocation.nearby.types.cafe'), Icon: Coffee, emoji: '\u2615' },
  { value: 'pharmacy', label: t('addLocation.nearby.types.pharmacy'), Icon: Pill, emoji: '\ud83d\udc8a' },
  { value: 'hospital', label: t('addLocation.nearby.types.hospital'), Icon: Building2, emoji: '\ud83c\udfe5' },
  { value: 'mall', label: t('addLocation.nearby.types.mall'), Icon: ShoppingBag, emoji: '\ud83c\udfec' },
  { value: 'bank', label: t('addLocation.nearby.types.bank'), Icon: Landmark, emoji: '\ud83c\udfe6' },
  { value: 'other', label: t('addLocation.nearby.types.other'), Icon: MapPin, emoji: '\ud83d\udccd' },
];

const TRAFFIC_HOURS = Array.from({ length: 13 }, (_, i) => {
  const hour = 9 + i;
  return `${String(hour).padStart(2, '0')}:00`;
});

// O'zbekiston viloyatlari (12 ta)
const REGIONS = [
  { value: 'toshkent', label: 'Toshkent' },
  { value: 'toshkentViloyati', label: 'Toshkent-vioyati' },
  { value: 'samarqand', label: 'Samarqand' },
  { value: 'buxoro', label: 'Buxoro' },
  { value: 'andijon', label: 'Andijon' },
  { value: 'fargona', label: "Farg'ona" },
  { value: 'namangan', label: 'Namangan' },
  { value: 'qashqadaryo', label: 'Qashqadaryo' },
  { value: 'surxondaryo', label: 'Surxondaryo' },
  { value: 'jizzax', label: 'Jizzax' },
  { value: 'sirdaryo', label: 'Sirdaryo' },
  { value: 'navoiy', label: 'Navoiy' },
  { value: 'xorazm', label: 'Xorazm' },
];

export default function AddLocationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const { level1List, level2List, level1, level2, setLevel1, setLevel2 } = useCategories(
    queryParams.get('level1') || ''
  );

  const [formData, setFormData] = useState({
    title: '',
    address: '',
    phone: '',
    price_range: '',
    currency: 'USD',
    competitors_info: '',
    uvp: '',
    description: '',
    region: '',
  });

  const [coords, setCoords] = useState({ lat: null, lng: null });

  const [details, setDetails] = useState({
    sqm: '',
    floor: '',
    rooms: '',
    power: '',
  });

  const [ventilation, setVentilation] = useState({ has: '', count: '' });
  const [nearby, setNearby] = useState([]);
  const [creativeReason, setCreativeReason] = useState('');

  const [traffic, setTraffic] = useState(
    TRAFFIC_HOURS.map((hour) => ({ hour, count: '' }))
  );

  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successInfo, setSuccessInfo] = useState(null);

  const nearbyTypes = getNearbyTypes(t);
  const NEARBY_BY_VALUE = nearbyTypes.reduce((acc, item) => {
    acc[item.value] = item;
    return acc;
  }, {});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleMapSelect = ({ lat, lng, address }) => {
    setCoords({ lat, lng });
    if (address) {
      setFormData((prev) => ({ ...prev, address }));
    }
  };

  const addNearbyRow = () => {
    setNearby((prev) => [...prev, { name: '', type: 'other', distance: '' }]);
  };

  const updateNearbyRow = (index, field, value) => {
    setNearby((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const removeNearbyRow = (index) => {
    setNearby((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTrafficRow = (index, value) => {
    setTraffic((prev) =>
      prev.map((row, i) => (i === index ? { ...row, count: value } : row))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert(t('addLocation.errors.loginRequired'));
      navigate('/login');
      return;
    }
    if (!level1 || !level2) {
      alert(t('addLocation.errors.selectDirectionCategory'));
      return;
    }
    if (!coords.lat || !coords.lng) {
      alert(t('addLocation.errors.selectLocation'));
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const cleanDetails = {
        sqm: details.sqm ? Number(details.sqm) : 0,
        floor: details.floor ? Number(details.floor) : 0,
        rooms: details.rooms ? Number(details.rooms) : 0,
        power: details.power ? Number(details.power) : 0,
        ventilation:
          ventilation.has === 'yes'
            ? `Bor (${ventilation.count || '?'} ta chiqish joyi)`
            : ventilation.has === 'no'
            ? "Yo'q"
            : '',
      };

      const cleanNearby = nearby
        .filter((row) => row.name.trim() !== '' && row.distance !== '')
        .map((row) => ({
          name: row.name.trim(),
          type: row.type || 'other',
          distance: Number(row.distance),
          icon: NEARBY_BY_VALUE[row.type]?.emoji || '\ud83d\udccd',
        }));

      const cleanTraffic = traffic
        .filter((row) => row.count !== '' && row.count !== null)
        .map((row) => ({ hour: row.hour, count: Number(row.count) }));

      const payload = {
        ...formData,
        level1,
        category: level2,
        level2,
        lat: coords.lat,
        lng: coords.lng,
        details: cleanDetails,
        nearby: cleanNearby,
        creativeReason: creativeReason.trim(),
        traffic: cleanTraffic,
      };

      const locRes = await createLocation(payload);
      const locationId = locRes.data._id;

      if (mediaFiles.length > 0) {
        const formDataMedia = new FormData();
        mediaFiles.forEach((mf) => formDataMedia.append('media', mf.file));

        await uploadLocationMedia(locationId, formDataMedia, (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        });
      }

      setSuccessInfo({ target: `/location/${locationId}` });
    } catch (err) {
      console.error(err);
      alert(t('addLocation.errors.submitError', { error: err.response?.data?.error || err.message }));
    } finally {
      setLoading(false);
    }
  };

  const currentNearbyIcon = (type) => NEARBY_BY_VALUE[type]?.Icon || MapPin;

  return (
    <div className="add-location-form-container">
      <button type="button" className="alf-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        {t('addLocation.back')}
      </button>

      <form onSubmit={handleSubmit} className="add-location-form">
        <h2>{t('addLocation.title')}</h2>

        <div className="form-group">
          <label>{t('addLocation.fields.name')}</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder={t('addLocation.fields.namePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label>{t('addLocation.fields.phone')}</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>{t('addLocation.fields.region')}</label>
          <select
            name="region"
            value={formData.region}
            onChange={handleChange}
            required
          >
            <option value="">{t('addLocation.fields.regionPlaceholder')}</option>
            {REGIONS.map((region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t('addLocation.fields.direction')}</label>
            <select value={level1} onChange={(e) => setLevel1(e.target.value)} required>
              <option value="">{t('addLocation.fields.directionPlaceholder')}</option>
              {level1List.map((l1) => (
                <option key={l1.key} value={l1.key}>
                  {t(`categories.${l1.key}`, { defaultValue: l1.name || l1.key })}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t('addLocation.fields.category')}</label>
            <select
              value={level2}
              onChange={(e) => setLevel2(e.target.value)}
              required
              disabled={!level1}
            >
              <option value="">{t('addLocation.fields.categoryPlaceholder')}</option>
              {level2List.map((l2) => {
                const key = l2.key || l2.level2;
                return (
                  <option key={key} value={key}>
                    {t(`categoriesLevel2.${key}`, { defaultValue: l2.name || key })}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>{t('addLocation.fields.priceRange')}</label>
          <div className="price-currency-row">
            <input
              type="text"
              name="price_range"
              value={formData.price_range}
              onChange={handleChange}
              placeholder={t('addLocation.fields.priceRangePlaceholder')}
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

        <div className="form-group">
          <label>{t('addLocation.fields.competitors')}</label>
          <textarea
            name="competitors_info"
            rows="2"
            value={formData.competitors_info}
            onChange={handleChange}
            placeholder={t('addLocation.fields.competitorsPlaceholder')}
          />
        </div>

        {/* ===== AI TUGMA BILAN TAVSIF ===== */}
        <div className="form-group">
          <label>{t('addLocation.fields.description')}</label>
          <AITextEnhanceButton
            value={formData.description}
            onChange={(newText) => setFormData(prev => ({ ...prev, description: newText }))}
          />
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            placeholder={t('addLocation.fields.descriptionPlaceholder')}
          />
        </div>

        <div className="section-block">
          <h3 className="section-title">{t('addLocation.fields.addressLabel')}</h3>
          <p className="section-hint">{t('addLocation.sectionHints.address')}</p>
          <LocationMapPicker lat={coords.lat} lng={coords.lng} onSelect={handleMapSelect} />
          <div className="form-group" style={{ marginTop: '0.8rem' }}>
            <label>{t('addLocation.fields.address')}</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder={t('addLocation.fields.addressPlaceholder')}
              required
            />
          </div>
        </div>

        <div className="section-block">
          <h3 className="section-title">{t('addLocation.sections.locationDetails')}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>{t('addLocation.details.sqm')}</label>
              <input
                type="number"
                name="sqm"
                value={details.sqm}
                onChange={handleDetailsChange}
                placeholder={t('addLocation.details.sqmPlaceholder')}
              />
            </div>
            <div className="form-group">
              <label>{t('addLocation.details.floor')}</label>
              <input
                type="number"
                name="floor"
                value={details.floor}
                onChange={handleDetailsChange}
                placeholder={t('addLocation.details.floorPlaceholder')}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('addLocation.details.rooms')}</label>
              <input
                type="number"
                name="rooms"
                value={details.rooms}
                onChange={handleDetailsChange}
                placeholder={t('addLocation.details.roomsPlaceholder')}
              />
            </div>
            <div className="form-group">
              <label><Plug size={14} className="inline-icon" /> {t('addLocation.details.power')}</label>
              <input
                type="number"
                name="power"
                value={details.power}
                onChange={handleDetailsChange}
                placeholder={t('addLocation.details.powerPlaceholder')}
              />
            </div>
          </div>

          <div className="form-group">
            <label><Wind size={14} className="inline-icon" /> {t('addLocation.details.ventilation')}</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${ventilation.has === 'yes' ? 'active' : ''}`}
                onClick={() => setVentilation((v) => ({ ...v, has: 'yes' }))}
              >
                {t('addLocation.details.ventilationHas')}
              </button>
              <button
                type="button"
                className={`toggle-btn ${ventilation.has === 'no' ? 'active' : ''}`}
                onClick={() => setVentilation({ has: 'no', count: '' })}
              >
                {t('addLocation.details.ventilationHasNot')}
              </button>
            </div>

            {ventilation.has === 'yes' && (
              <div className="collapse-field">
                <label>{t('addLocation.details.ventilationCount')}</label>
                <input
                  type="number"
                  min="1"
                  value={ventilation.count}
                  onChange={(e) => setVentilation((v) => ({ ...v, count: e.target.value }))}
                  placeholder={t('addLocation.details.ventilationCountPlaceholder')}
                />
              </div>
            )}
          </div>
        </div>

        <div className="section-block">
          <h3 className="section-title">{t('addLocation.sections.nearbyObjects')}</h3>
          <p className="section-hint">{t('addLocation.sectionHints.nearby')}</p>

          {nearby.map((row, index) => {
            const Icon = currentNearbyIcon(row.type);
            return (
              <div className="nearby-row" key={index}>
                <div className="nearby-icon-preview">
                  <Icon size={18} />
                </div>
                <select
                  value={row.type}
                  onChange={(e) => updateNearbyRow(index, 'type', e.target.value)}
                  className="nearby-type"
                >
                  {nearbyTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder={t('addLocation.nearby.namePlaceholder')}
                  value={row.name}
                  onChange={(e) => updateNearbyRow(index, 'name', e.target.value)}
                  className="nearby-name"
                />
                <input
                  type="number"
                  placeholder={t('addLocation.nearby.distancePlaceholder')}
                  value={row.distance}
                  onChange={(e) => updateNearbyRow(index, 'distance', e.target.value)}
                  className="nearby-distance"
                />
                <button
                  type="button"
                  className="icon-btn remove"
                  onClick={() => removeNearbyRow(index)}
                  aria-label={t('addLocation.nearby.removeLabel')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}

          <button type="button" className="add-row-btn" onClick={addNearbyRow}>
            <Plus size={16} /> {t('addLocation.nearby.addButton')}
          </button>
        </div>

        <div className="section-block">
          <h3 className="section-title">{t('addLocation.sections.whyHere')}</h3>
          <p className="section-hint">{t('addLocation.sectionHints.whyHere')}</p>
          <textarea
            rows="4"
            value={creativeReason}
            onChange={(e) => setCreativeReason(e.target.value)}
            placeholder={t('addLocation.creativeReason.placeholder')}
          />
        </div>

        <div className="section-block">
          <h3 className="section-title">{t('addLocation.sections.footTraffic')}</h3>
          <p className="section-hint">{t('addLocation.sectionHints.traffic')}</p>
          <div className="traffic-grid">
            {traffic.map((row, index) => (
              <div className="traffic-cell" key={row.hour}>
                <label>{t('addLocation.traffic.hourLabel', { hour: row.hour.replace(':00', '') })}</label>
                <input
                  type="number"
                  min="0"
                  value={row.count}
                  onChange={(e) => updateTrafficRow(index, e.target.value)}
                  placeholder={t('addLocation.traffic.placeholder')}
                />
              </div>
            ))}
          </div>
        </div>

        <MediaUploader
          mediaFiles={mediaFiles}
          setMediaFiles={setMediaFiles}
          label={t('addLocation.fields.media')}
        />

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? t('addLocation.submitting') : t('addLocation.submit')}
        </button>
      </form>

      {successInfo && (
        <SuccessModal
          message={t('addLocation.success')}
          onDone={() => navigate(successInfo.target)}
        />
      )}
    </div>
  );
}