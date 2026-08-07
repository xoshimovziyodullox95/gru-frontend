import { useEffect, useRef, useState, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <-- qo'shildi
import { getLevel1, getLevel2 } from '../services/categories';
import {
  Layers, Package, MapPin, Boxes, Briefcase,
  ArrowRight, ArrowLeft, Check, ChevronDown, Search, Sparkles,
} from 'lucide-react';
import '../../styles/addListingChoice.css';

const LISTING_TYPES = [
  { id: 'location', labelKey: 'addListingChoice.type.location', descKey: 'addListingChoice.type.locationDesc', icon: MapPin },
  { id: 'equipment', labelKey: 'addListingChoice.type.equipment', descKey: 'addListingChoice.type.equipmentDesc', icon: Boxes },
  { id: 'service', labelKey: 'addListingChoice.type.service', descKey: 'addListingChoice.type.serviceDesc', icon: Briefcase },
];

const STEP_META = [
  { key: 'level1', labelKey: 'addListingChoice.step.level1', icon: Layers },
  { key: 'level2', labelKey: 'addListingChoice.step.level2', icon: Package },
  { key: 'type', labelKey: 'addListingChoice.step.type', icon: Sparkles },
];

/* PickerField – qidiruvli tanlov maydoni */
function PickerField({ placeholder, options, value, onChange, disabled, t }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState(null);
  const rootRef = useRef(null);
  const dropdownRef = useRef(null);

  function openDropdown() {
    const rect = rootRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onOutside(e) {
      const inTrigger = rootRef.current && rootRef.current.contains(e.target);
      const inDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!inTrigger && !inDropdown) setOpen(false);
    }
    function onScrollOrResize(e) {
      if (dropdownRef.current && e.target && dropdownRef.current.contains(e.target)) return;
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    }
    document.addEventListener('mousedown', onOutside);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  useEffect(() => { if (!open) setQuery(''); }, [open]);

  const selected = options.find(o => o.value === value);
  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className={`picker-field ${disabled ? 'is-disabled' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`picker-trigger ${open ? 'is-open' : ''} ${selected ? 'has-value' : ''}`}
        onClick={() => !disabled && (open ? setOpen(false) : openDropdown())}
        disabled={disabled}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={17} className="picker-chevron" />
      </button>

      {open && coords && createPortal(
        <div
          className="picker-dropdown"
          ref={dropdownRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width }}
        >
          <div className="picker-search">
            <Search size={14} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('addListingChoice.picker.search')}
            />
          </div>
          <div className="picker-list">
            {filtered.length === 0 && <div className="picker-empty">{t('addListingChoice.picker.empty')}</div>}
            {filtered.map(opt => (
              <button
                type="button"
                key={opt.value}
                className={`picker-option ${opt.value === value ? 'is-selected' : ''}`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function AddListingChoice() {
  const { t } = useTranslation(); // <-- qo'shildi
  const navigate = useNavigate();
  const [level1List, setLevel1List] = useState([]);
  const [selectedLevel1, setSelectedLevel1] = useState('');
  const [level2List, setLevel2List] = useState([]);
  const [selectedLevel2, setSelectedLevel2] = useState('');
  const [listingType, setListingType] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  // Level1 yuklash
  useEffect(() => {
    getLevel1().then(res => {
      const data = res.data.map(item => ({
        ...item,
        displayName: t(`categories.${item.key}`, { defaultValue: item.name || item.key })
      }));
      setLevel1List(data);
    }).catch(console.error);
  }, [t]);

  // Level2 yuklash
  useEffect(() => {
    if (selectedLevel1) {
      getLevel2(selectedLevel1).then(res => {
        const data = res.data.map(item => {
          const key = item.key || item.level2;
          return {
            ...item,
            displayName: t(`categoriesLevel2.${key}`, { defaultValue: item.name || key })
          };
        });
        setLevel2List(data);
      }).catch(console.error);
    } else {
      setLevel2List([]);
    }
  }, [selectedLevel1, t]);

  const level1Options = level1List.map(i => ({ value: i.key, label: i.displayName }));
  const level2Options = level2List.map(i => ({ value: i.key || i.level2, label: i.displayName }));

  // Type optionlarni t() orqali olish
  const typeOptions = LISTING_TYPES.map(lt => ({
    id: lt.id,
    label: t(lt.labelKey),
    desc: t(lt.descKey),
    icon: lt.icon,
  }));

  const isStepDone = (i) => {
    if (i === 0) return !!selectedLevel1;
    if (i === 1) return !!selectedLevel2;
    return !!listingType;
  };
  const isComplete = selectedLevel1 && selectedLevel2 && listingType;

  function goTo(step) {
    if (step <= currentStep || isStepDone(step - 1)) setCurrentStep(step);
  }

  function handlePickLevel1(val) {
    setSelectedLevel1(val);
    setSelectedLevel2('');
    setTimeout(() => setCurrentStep(1), 380);
  }
  function handlePickLevel2(val) {
    setSelectedLevel2(val);
    setTimeout(() => setCurrentStep(2), 380);
  }

  function handleNext() {
    if (!isComplete) return;
    const basePath = `/add-${listingType}`;
    navigate(`${basePath}?level1=${encodeURIComponent(selectedLevel1)}&level2=${encodeURIComponent(selectedLevel2)}`);
  }

  // Step meta ma'lumotlarini t() bilan olish
  const stepMeta = STEP_META.map(step => ({
    ...step,
    label: t(step.labelKey),
  }));

  return (
    <div className="add-listing-choice-container">
      <button type="button" className="alc-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        {t('addListingChoice.back')}
      </button>

      <div className="wizard-bg-glow" aria-hidden="true">
        <span className="blob blob-a" />
        <span className="blob blob-b" />
      </div>

      <div className="choice-card">
        <div className="choice-head">
          <h2>{t('addListingChoice.title')}</h2>
          <p className="choice-subtitle">{t('addListingChoice.subtitle')}</p>
        </div>

        <div className="wizard-progress">
          {stepMeta.map((step, i) => {
            const Icon = step.icon;
            const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'upcoming';
            const valueLabel = i === 0
              ? level1Options.find(o => o.value === selectedLevel1)?.label
              : i === 1
                ? level2Options.find(o => o.value === selectedLevel2)?.label
                : typeOptions.find(t => t.id === listingType)?.label;

            return (
              <Fragment key={step.key}>
                {i > 0 && (
                  <span className="progress-connector">
                    <span
                      className="progress-connector-fill"
                      style={{ width: isStepDone(i - 1) ? '100%' : '0%' }}
                    />
                  </span>
                )}
                <div className="progress-node-wrap">
                  <button type="button" className={`progress-node state-${state}`} onClick={() => goTo(i)}>
                    <span className="progress-node-icon">
                      {isStepDone(i) ? <Check size={14} /> : <Icon size={14} />}
                    </span>
                  </button>
                  <div className="progress-node-text">
                    <span className="progress-node-label">{step.label}</span>
                    <span className="progress-node-value">{valueLabel || '—'}</span>
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>

        <div className="wizard-body">
          <div
            className="wizard-track"
            style={{ transform: `translateX(-${(currentStep * 100) / stepMeta.length}%)` }}
          >
            <div className="wizard-panel">
              <div className="panel-heading">
                <Layers size={18} />
                <div>
                  <h3>{t('addListingChoice.level1.title')}</h3>
                  <p>{t('addListingChoice.level1.desc')}</p>
                </div>
              </div>
              <PickerField
                placeholder={t('addListingChoice.level1.placeholder')}
                options={level1Options}
                value={selectedLevel1}
                onChange={handlePickLevel1}
                t={t}
              />
            </div>

            <div className="wizard-panel">
              <div className="panel-heading">
                <Package size={18} />
                <div>
                  <h3>{t('addListingChoice.level2.title')}</h3>
                  <p>{t('addListingChoice.level2.desc')}</p>
                </div>
              </div>
              <PickerField
                placeholder={t('addListingChoice.level2.placeholder')}
                options={level2Options}
                value={selectedLevel2}
                onChange={handlePickLevel2}
                disabled={!selectedLevel1}
                t={t}
              />
            </div>

            <div className="wizard-panel">
              <div className="panel-heading">
                <Sparkles size={18} />
                <div>
                  <h3>{t('addListingChoice.type.title')}</h3>
                  <p>{t('addListingChoice.type.desc')}</p>
                </div>
              </div>
              <div className="type-grid">
                {typeOptions.map(lt => {
                  const Icon = lt.icon;
                  const active = listingType === lt.id;
                  return (
                    <button
                      key={lt.id}
                      type="button"
                      className={`type-card ${active ? 'active' : ''}`}
                      onClick={() => setListingType(lt.id)}
                    >
                      {active && <span className="type-check-badge"><Check size={12} /></span>}
                      <span className="type-icon-circle"><Icon size={22} /></span>
                      <span className="type-btn-title">{lt.label}</span>
                      <span className="type-btn-desc">{lt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="wizard-footer">
          <button
            type="button"
            className="btn-back"
            onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
            disabled={currentStep === 0}
          >
            <ArrowLeft size={16} /> {t('addListingChoice.buttons.back')}
          </button>

          {currentStep < 2 ? (
            <button
              type="button"
              className="btn-next"
              onClick={() => setCurrentStep(s => Math.min(2, s + 1))}
              disabled={!isStepDone(currentStep)}
            >
              {t('addListingChoice.buttons.next')} <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className={`btn-next btn-finish ${isComplete ? 'is-ready' : ''}`}
              onClick={handleNext}
              disabled={!isComplete}
            >
              {t('addListingChoice.buttons.continue')} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}