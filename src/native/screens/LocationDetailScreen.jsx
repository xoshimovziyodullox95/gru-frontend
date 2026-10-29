import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { absoluteMediaUrl, apiRequest } from '../api';
import { colors } from '../theme';
import { BackButton, HeartIcon, PinText } from '../ui';

const formatPrice = (value, currency = 'UZS') => Number(value) > 0 ? (currency === 'USD' ? `$${new Intl.NumberFormat('en-US').format(Number(value))}` : `${new Intl.NumberFormat('uz-UZ').format(Number(value))} so‘m`) : 'Kelishiladi';

export default function LocationDetailScreen({ location, token, onBack, onContact, onOpenLocation, isFavorite, onToggleFavorite }) {
  const id = location?._id || location?.id;
  const [detail, setDetail] = useState(location);
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  useEffect(() => {
    if (!id) return undefined;
    let active = true;
    Promise.allSettled([apiRequest(`/locations/${encodeURIComponent(id)}`, { token }), apiRequest('/locations?limit=40')]).then(([detailResult, nearbyResult]) => {
      if (!active) return;
      if (detailResult.status === 'fulfilled') setDetail(detailResult.value?.location || detailResult.value?.data || detailResult.value);
      else setError(detailResult.reason?.message || 'Joy ma’lumoti yuklanmadi.');
      if (nearbyResult.status === 'fulfilled') {
        const rows = nearbyResult.value?.locations || nearbyResult.value?.data || nearbyResult.value;
        const list = Array.isArray(rows) ? rows : Array.isArray(rows?.items) ? rows.items : [];
        setNearby(list.filter((entry) => String(entry?._id || entry?.id) !== String(id)).slice(0, 12));
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, token]);
  const media = detail?.images || detail?.media?.map((item) => item.url || item) || [];
  const image = absoluteMediaUrl(media[0] || detail?.image);
  const price = detail?.price_per_month || detail?.price_range || detail?.price;
  const ownerName = detail?.userId?.fullName || detail?.userId?.full_name || 'E’lon egasi';
  return <View style={styles.screen}><View style={styles.header}><BackButton onPress={onBack} /><Text style={styles.headerTitle}>Joy tafsiloti</Text><View style={{ width: 40 }} /></View>
    {loading ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 30 }} /> : <><ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {image ? <Image source={{ uri: image }} style={styles.image} /> : <View style={[styles.image, styles.noImage]}><Text style={styles.noImageText}>Z</Text></View>}
      {media.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>{media.map((source, index) => <Image key={`${source}-${index}`} source={{ uri: absoluteMediaUrl(source) }} style={styles.galleryImage} />)}</ScrollView> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.card}><Text style={styles.deal}>{detail?.dealType === 'sale' ? 'SOTILADI' : 'IJARAGA'}</Text><Text style={styles.price}>{`${formatPrice(price, detail?.currency)}${detail?.dealType === 'rent' ? ' / oy' : ''}`}</Text><View style={styles.titleRow}><Text style={styles.title}>{detail?.title || 'Joy e’loni'}</Text><Pressable onPress={() => onToggleFavorite?.(detail)} style={[styles.favorite, isFavorite && styles.favoriteActive]}><HeartIcon active={isFavorite} /></Pressable></View><PinText style={styles.address}>{detail?.address || detail?.region || 'Manzil ko‘rsatilmagan'}</PinText>
        <View style={styles.rule} /><Text style={styles.section}>Tavsif</Text><Text style={styles.description}>{detail?.description || 'E’lon egasidan qo‘shimcha ma’lumot oling.'}</Text>
        {detail?.details?.sqm ? <View style={styles.metaRow}><Text style={styles.meta}>Maydon</Text><Text style={styles.metaValue}>{detail.details.sqm} m²</Text></View> : null}{detail?.details?.rooms ? <View style={styles.metaRow}><Text style={styles.meta}>Xonalar</Text><Text style={styles.metaValue}>{detail.details.rooms}</Text></View> : null}
        <View style={styles.owner}><View style={styles.avatar}><Text style={styles.initial}>{ownerName.slice(0, 1).toUpperCase()}</Text></View><View><Text style={styles.meta}>E’lon egasi</Text><Text style={styles.ownerName}>{ownerName}</Text></View></View>
      </View>
      {nearby.length ? <View style={styles.nearbyWrap}><Text style={styles.section}>Yaqin joylar</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyRow}>{nearby.map((entry) => { const photos = entry.images || entry.media?.map((item) => item.url || item) || []; const uri = absoluteMediaUrl(photos[0] || entry.image); return <Pressable key={entry._id || entry.id} onPress={() => onOpenLocation?.(entry)} style={styles.nearbyCard}>{uri ? <Image source={{ uri }} style={styles.nearbyImage} /> : <View style={[styles.nearbyImage, styles.noImage]}><Text style={styles.fallback}>Z</Text></View>}<Text numberOfLines={2} style={styles.nearbyTitle}>{entry.title || entry.name || 'Joy e’loni'}</Text><Text style={styles.nearbyPrice}>{formatPrice(entry.price_per_month || entry.price, entry.currency)}</Text></Pressable>; })}</ScrollView></View> : null}
      </ScrollView>
      <View style={styles.bottom}><Pressable onPress={() => onContact?.(detail)} style={styles.contact}><Text style={styles.contactText}>E’lon egasiga yozish</Text></Pressable></View></>}
  </View>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, header: { height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, borderBottomWidth: 1, borderBottomColor: colors.line }, back: { width: 40 }, backGlyph: { color: colors.ink, fontSize: 34 }, headerTitle: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '800' }, scroll: { flex: 1 }, content: { paddingBottom: 15 }, image: { width: '100%', height: 265, backgroundColor: '#E4EDF3' }, gallery: { gap: 8, paddingHorizontal: 14, paddingVertical: 10 }, galleryImage: { width: 92, height: 70, borderRadius: 10, backgroundColor: '#E4EDF3' }, noImage: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0F5F8' }, noImageText: { color: colors.cyan, fontSize: 70, fontWeight: '900' }, card: { marginHorizontal: 14, marginTop: -13, padding: 17, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.white }, deal: { color: colors.cyanDark, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, price: { color: colors.ink, fontSize: 20, fontWeight: '900', marginTop: 7 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }, title: { flex: 1, color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '800' }, favorite: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F5F8' }, favoriteActive: { backgroundColor: '#FFE8EC' }, favoriteGlyph: { color: colors.ink, fontSize: 22 }, favoriteGlyphActive: { color: colors.red }, address: { color: colors.muted, fontSize: 12, marginTop: 9 }, rule: { height: 1, backgroundColor: colors.line, marginVertical: 16 }, section: { color: colors.ink, fontSize: 14, fontWeight: '800' }, description: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 }, metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }, meta: { color: colors.muted, fontSize: 11 }, metaValue: { color: colors.ink, fontSize: 11, fontWeight: '800' }, owner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: colors.canvas, marginTop: 18 }, avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DDF5F8', alignItems: 'center', justifyContent: 'center', marginRight: 10 }, initial: { color: colors.cyanDark, fontWeight: '900' }, ownerName: { color: colors.ink, fontSize: 12, fontWeight: '800', marginTop: 3 }, nearbyWrap: { paddingLeft: 14, paddingTop: 15 }, nearbyRow: { gap: 9, paddingVertical: 10, paddingRight: 14 }, nearbyCard: { width: 140, backgroundColor: colors.white, padding: 8, borderRadius: 13 }, nearbyImage: { width: '100%', height: 86, borderRadius: 9, backgroundColor: '#E4EDF3' }, fallback: { color: colors.cyan, fontSize: 28, fontWeight: '900' }, nearbyTitle: { color: colors.ink, fontSize: 11, fontWeight: '700', minHeight: 30, marginTop: 6 }, nearbyPrice: { color: colors.cyanDark, fontWeight: '800', fontSize: 10, marginTop: 4 }, bottom: { padding: 13, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line }, contact: { minHeight: 49, backgroundColor: colors.cyan, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }, contactText: { color: colors.white, fontSize: 13, fontWeight: '900' }, error: { color: colors.red, fontSize: 12, padding: 15 },
});
