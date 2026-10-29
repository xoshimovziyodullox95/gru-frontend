export function listingChatUrl(userId, listing) {
  const title = String(listing?.title || '').trim();
  const draft = title
    ? `Salom, “${title}” e’loni bo‘yicha ma’lumot bersangiz.`
    : 'Salom, e’loningiz bo‘yicha ma’lumot bersangiz.';
  const params = new URLSearchParams({
    userId: String(userId),
    draft,
    listingType: String(listing?.type || ''),
    listingId: String(listing?.id || ''),
    listingTitle: title,
    listingThumbnail: String(listing?.thumbnail || ''),
    listingPrice: String(listing?.price || ''),
  });
  return `/chat?${params.toString()}`;
}
