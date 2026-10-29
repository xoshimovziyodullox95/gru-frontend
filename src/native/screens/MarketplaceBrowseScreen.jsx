import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { absoluteMediaUrl, apiRequest, unwrapArray } from '../api';
import { colors, shadow } from '../theme';
import { BackButton } from '../ui';

const price = (value, currency = 'UZS') => Number(value) > 0 ? (currency === 'USD' ? `$${new Intl.NumberFormat('en-US').format(Number(value))}` : `${new Intl.NumberFormat('uz-UZ').format(Number(value))} so‘m`) : 'Kelishiladi';

export default function MarketplaceBrowseScreen({ initialType = 'equipment', initialCategory, initialSubcategory, initialQuery = '', onBack, onOpenEquipment, onOpenLocation }) {
  const [type, setType] = useState(initialType);
  const [query, setQuery] = useState(initialQuery);
  const [equipment, setEquipment] = useState([]);
  const [remoteSearch, setRemoteSearch] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const equipmentUrl = `/equipment?limit=500${initialCategory?.id ? `&level1=${encodeURIComponent(initialCategory.id)}` : ''}${initialSubcategory ? `&category=${encodeURIComponent(initialSubcategory)}` : ''}`;
  const load = useCallback(async () => {
    setLoading(true); setError('');
    const [equipmentResult, locationResult] = await Promise.allSettled([apiRequest(equipmentUrl), apiRequest('/locations?limit=500')]);
    if (equipmentResult.status === 'fulfilled') setEquipment(unwrapArray(equipmentResult.value));
    if (locationResult.status === 'fulfilled') setLocations(unwrapArray(locationResult.value));
    if (equipmentResult.status === 'rejected' && locationResult.status === 'rejected') setError('E’lonlarni yuklab bo‘lmadi.');
    setLoading(false);
  }, [equipmentUrl]);
  useEffect(() => {
    let active = true;
    Promise.allSettled([apiRequest(equipmentUrl), apiRequest('/locations?limit=500')]).then(([equipmentResult, locationResult]) => {
      if (!active) return;
      if (equipmentResult.status === 'fulfilled') setEquipment(unwrapArray(equipmentResult.value));
      if (locationResult.status === 'fulfilled') setLocations(unwrapArray(locationResult.value));
      if (equipmentResult.status === 'rejected' && locationResult.status === 'rejected') setError('E’lonlarni yuklab bo‘lmadi.');
      setLoading(false);
    });
    return () => { active = false; };
  }, [equipmentUrl]);
  useEffect(() => {
    const term = query.trim();
    if (!term || type !== 'equipment') return undefined;
    let active = true;
    const timer = setTimeout(() => {
      const categoryFilter = initialCategory?.id ? `&level1=${encodeURIComponent(initialCategory.id)}` : '';
      const subcategoryFilter = initialSubcategory ? `&category=${encodeURIComponent(initialSubcategory)}` : '';
      apiRequest(`/equipment?limit=100&search=${encodeURIComponent(term)}${categoryFilter}${subcategoryFilter}`)
        .then((response) => { if (active) setRemoteSearch(unwrapArray(response)); })
        .catch(() => { if (active) setRemoteSearch([]); });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [query, type, initialCategory, initialSubcategory]);
  const data = useMemo(() => {
    const searchItems = query.trim() ? remoteSearch : [];
    const source = type === 'equipment' ? [...searchItems, ...equipment.filter((item) => !searchItems.some((remote) => String(remote._id || remote.id) === String(item._id || item.id)))] : locations;
    const term = query.trim().toLocaleLowerCase();
    return source.filter((item) => {
      const categoryMatches = type !== 'equipment' || (!initialCategory?.id || String(item.level1 || '').toLowerCase() === String(initialCategory.id).toLowerCase()) && (!initialSubcategory || String(item.category || '').toLowerCase() === String(initialSubcategory).toLowerCase());
      return categoryMatches && (!term || `${item.title || ''} ${item.description || ''} ${item.category || ''} ${item.address || ''} ${item.region || ''}`.toLocaleLowerCase().includes(term));
    });
  }, [type, equipment, locations, remoteSearch, query, initialCategory, initialSubcategory]);
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><BackButton onPress={onBack} /><Text style={styles.headerTitle}>Marketplace</Text><View style={{ width: 38 }} /></View>
    <Text style={styles.title}>{initialSubcategory ? (initialCategory?.subs?.find((sub) => sub.id === initialSubcategory)?.name?.uz || 'Bo‘lim') : initialCategory ? (initialCategory.short?.uz || initialCategory.name?.uz || initialCategory.short || initialCategory.name || 'Kategoriya') : 'Tovar va joy e’lonlari'}</Text><Text style={styles.note}>Sotib oling, ijaraga oling yoki sotuvchi bilan bog‘laning.</Text>
    <View style={styles.switcher}>{[['equipment', 'Tovarlar'], ['locations', 'Joylar']].map(([key, label]) => <Pressable key={key} onPress={() => setType(key)} style={[styles.typeButton, type === key && styles.typeActive]}><Text style={[styles.typeText, type === key && styles.typeTextActive]}>{label}</Text></Pressable>)}</View>
    <TextInput value={query} onChangeText={setQuery} placeholder={type === 'equipment' ? 'Tovar qidirish...' : 'Joy yoki manzil qidirish...'} style={styles.search} placeholderTextColor="#91A2B2" returnKeyType="search" />
    {loading ? <ActivityIndicator color={colors.cyan} style={{ margin: 25 }} /> : null}{error ? <Pressable onPress={load} style={styles.error}><Text style={styles.errorText}>{error} · Qayta urinish</Text></Pressable> : null}
    {!loading && !error && !data.length ? <View style={styles.empty}><Text style={styles.emptyTitle}>E’lon topilmadi</Text><Text style={styles.note}>Qidiruv so‘zini o‘zgartirib ko‘ring.</Text></View> : null}
    <View style={styles.grid}>{data.map((item, index) => {
      const images = item.images || item.media?.map((medium) => medium.url || medium) || [];
      const image = absoluteMediaUrl(images[0] || item.image);
      const value = item.price || item.price_per_month || item.price_range;
      return <Pressable key={item._id || item.id || index} onPress={() => type === 'equipment' ? onOpenEquipment(item) : onOpenLocation(item)} style={styles.card}>
        {image ? <Image source={{ uri: image }} style={styles.image} /> : <View style={[styles.image, styles.imageEmpty]}><Text style={styles.fallback}>Z</Text></View>}
        <View style={styles.cardBody}><Text numberOfLines={2} style={styles.cardTitle}>{item.title || item.name || 'E’lon'}</Text><Text style={styles.price}>{type === 'locations' && item.dealType === 'rent' ? `${price(value, item.currency)} / oy` : price(value, item.currency)}</Text><Text numberOfLines={1} style={styles.note}>{type === 'locations' ? item.address || item.region || 'O‘zbekiston' : item.city || item.location || 'O‘zbekiston'}</Text></View>
      </Pressable>;
    })}</View>
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 17, paddingBottom: 28 }, header: { minHeight: 44, flexDirection: 'row', alignItems: 'center' }, back: { width: 40 }, backGlyph: { color: colors.ink, fontSize: 34 }, headerTitle: { flex: 1, color: colors.ink, fontSize: 17, fontWeight: '800' }, title: { color: colors.ink, fontSize: 24, fontWeight: '900', marginTop: 10 }, note: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 }, switcher: { flexDirection: 'row', gap: 7, marginTop: 14, padding: 4, borderRadius: 14, backgroundColor: '#E4EDF3' }, typeButton: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 11 }, typeActive: { backgroundColor: colors.cyan }, typeText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, typeTextActive: { color: colors.white }, search: { minHeight: 47, borderWidth: 1, borderColor: colors.line, borderRadius: 13, backgroundColor: colors.white, paddingHorizontal: 13, color: colors.ink, marginTop: 10 }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 11, marginTop: 13 }, card: { width: '48.5%', backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden', ...shadow }, image: { width: '100%', height: 130, backgroundColor: '#E4EDF3' }, imageEmpty: { alignItems: 'center', justifyContent: 'center' }, fallback: { color: colors.cyan, fontSize: 36, fontWeight: '900' }, cardBody: { padding: 10 }, cardTitle: { color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: '800', minHeight: 32 }, price: { color: colors.cyanDark, fontSize: 12, fontWeight: '900', marginTop: 6 }, error: { backgroundColor: '#FFF0F1', padding: 12, borderRadius: 12, marginTop: 14 }, errorText: { color: colors.red, fontSize: 12 }, empty: { backgroundColor: colors.white, borderRadius: 16, padding: 18, marginTop: 20 }, emptyTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' } });
