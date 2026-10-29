import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Heart,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  UserRound,
  Video,
} from 'lucide-react';
import '../../styles/zumoQuickMenu.css';
import { openZumoGuide } from './zumoGuideEvents.js';

import { T } from '../utils/T';
const ACTIONS = [
  { label: T('Qidiruv va barcha e’lonlar'), icon: Search, path: '/marketplace/all?openSearch=1' },
  { label: T('E’lon joylash'), icon: Plus, path: '/add-listing' },
  { label: T('Video post qo‘shish'), icon: Video, path: '/add-video' },
  { label: T('ZUMO AI yordamchisi'), icon: Sparkles, path: '/ai-assistant' },
  { label: T('Saqlangan e’lonlar'), icon: Heart, path: '/saved' },
  { label: T('Bildirishnomalar'), icon: Bell, path: '/notifications' },
  { label: T('Profil'), icon: UserRound, path: '/profile' },
  { label: T('Sozlamalar'), icon: Settings, path: '/settings' },
  { label: T('ZUMO bilan tanishuv'), icon: Sparkles, guide: true },
];

export default function ZumoQuickMenu({ isOpen, onToggle }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) onToggle(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onToggle(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen, onToggle]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <header className="zumo-topbar" ref={rootRef}>
      <button
        type="button"
        className="zumo-topbar__menu"
        onClick={() => onToggle(!isOpen)}
        aria-label={T('Tezkor amallar menyusi')}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Menu size={22} strokeWidth={2.2} />
      </button>

      <div className="zumo-topbar__brand" aria-label="ZUMO">
        <img src="/ZUMO.png" alt="" className="zumo-topbar__z" loading="eager" />
        <span className="zumo-topbar__umo">UMO</span>
      </div>
      <div className="zumo-topbar__actions" aria-hidden="true" />

      {isOpen && (
        <>
          <button
            type="button"
            className="zumo-quick-menu__scrim"
            aria-label={T('Menyuni yopish')}
            onClick={() => onToggle(false)}
          />
          <nav className="zumo-quick-menu" role="menu" aria-label={T('Tezkor amallar')}>
            <div className="zumo-quick-menu__heading">
              <strong>{T('Tezkor amallar')}</strong>
              <span>{T('Kerakli bo‘limni tanlang')}</span>
            </div>
            {ACTIONS.map(({ label, icon: Icon, path, guide }) => (
              <button
                key={label}
                type="button"
                role="menuitem"
                className="zumo-quick-menu__item"
                onClick={() => {
                  onToggle(false);
                  if (guide) openZumoGuide('welcome');
                  else navigate(path);
                }}
              >
                <span className="zumo-quick-menu__icon"><Icon size={18} strokeWidth={2} /></span>
                <span>{label}</span>
                <ArrowRight size={15} className="zumo-quick-menu__arrow" />
              </button>
            ))}
          </nav>
        </>
      )}
    </header>,
    document.body
  );
}
