const MAX_RECENT_ITEMS = 12;

const storageKey = (userId) => `zumo_recently_viewed_${userId}`;

export function getRecentlyViewed(userId) {
  if (!userId || typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(userId)) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(userId, listing) {
  if (!userId || !listing?.id || typeof window === 'undefined') return;
  const item = { ...listing, viewedAt: Date.now() };
  const next = [item, ...getRecentlyViewed(userId).filter((saved) => !(saved.id === item.id && saved.type === item.type))]
    .slice(0, MAX_RECENT_ITEMS);
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // Private browsing or a full storage quota should not break listing pages.
  }
}
