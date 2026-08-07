// src/components/hooks/useFavorites.js
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'favorites';

function readFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeFavorites(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('favoritesUpdated'));
}

/**
 * item shakli: { id, type, title, image, price, link }
 * type: 'location' | 'equipment' | 'service'
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites);

  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    window.addEventListener('favoritesUpdated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('favoritesUpdated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const isFavorite = useCallback(
    (id, type) => favorites.some((f) => f.id === id && f.type === type),
    [favorites]
  );

  const toggleFavorite = useCallback((item) => {
    const current = readFavorites();
    const exists = current.some((f) => f.id === item.id && f.type === item.type);
    const next = exists
      ? current.filter((f) => !(f.id === item.id && f.type === item.type))
      : [...current, { ...item, addedAt: new Date().toISOString() }];
    writeFavorites(next);
    setFavorites(next);
    return !exists;
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}