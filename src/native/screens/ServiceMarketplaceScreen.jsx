import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { absoluteMediaUrl, apiRequest, unwrapArray } from '../api';
import { getServiceTaxonomyLabel } from '../../components/utils/serviceTaxonomyLabels';
import { colors, shadow } from '../theme';
import { BackButton, Chevron } from '../ui';

const nameOf = (provider) => provider?.name || provider?.company || 'Xizmat ko‘rsatuvchi';
const serviceLabel = (provider) => getServiceTaxonomyLabel(provider?.service_category || provider?.category || provider?.level1);

export default function ServiceMarketplaceScreen({ token, onLogin, onBack, initialProviderId, onProviderOpened }) {
  const [providers, setProviders] = useState([]);
  const [taxonomy, setTaxonomy] = useState({});
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [providersResponse, taxonomyResponse] = await Promise.all([apiRequest('/service-providers?limit=100'), apiRequest('/service-providers/taxonomy')]);
      setProviders(unwrapArray(providersResponse?.providers || providersResponse));
      setTaxonomy(taxonomyResponse?.taxonomy || taxonomyResponse?.data?.taxonomy || {});
    } catch (err) { setError(err.message || 'Xizmatlar yuklanmadi.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([apiRequest('/service-providers?limit=100'), apiRequest('/service-providers/taxonomy')])
      .then(([providersResponse, taxonomyResponse]) => {
        if (!active) return;
        setProviders(unwrapArray(providersResponse?.providers || providersResponse));
        setTaxonomy(taxonomyResponse?.taxonomy || taxonomyResponse?.data?.taxonomy || {});
      })
      .catch((err) => { if (active) setError(err.message || 'Xizmatlar yuklanmadi.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const activeSelected = selected || providers.find((item) => initialProviderId && String(item._id || item.id) === String(initialProviderId)) || null;
  const directions = useMemo(() => Object.entries(taxonomy).filter(([, entries]) => Array.isArray(entries) && entries.length), [taxonomy]);
  const filtered = useMemo(() => providers.filter((provider) => {
    const text = `${nameOf(provider)} ${provider.description || ''} ${serviceLabel(provider)}`.toLocaleLowerCase();
    return (direction === 'all' || provider.level1 === direction) && (!query.trim() || text.includes(query.trim().toLocaleLowerCase()));
  }), [providers, direction, query]);
  const apply = async () => {
    if (!token) return onLogin?.();
    setBusy(true);
    try {
      await apiRequest(`/service-providers/${encodeURIComponent(activeSelected._id || activeSelected.id)}/apply`, { token, method: 'POST', body: { message: 'ZUMO mobil ilovasidan xizmat bo‘yicha murojaat.' } });
      Alert.alert('Murojaat yuborildi', 'Xizmat ko‘rsatuvchi murojaatingizni ko‘radi va siz bilan bog‘lanadi.');
    } catch (err) { Alert.alert('Yuborilmadi', err.message || 'Qayta urinib ko‘ring.'); }
    finally { setBusy(false); }
  };
  if (activeSelected) {
    const image = absoluteMediaUrl(activeSelected.avatar || activeSelected.images?.[0] || activeSelected.media?.[0]?.url);
    return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><View style={styles.header}><BackButton onPress={() => { setSelected(null); onProviderOpened?.(); }} /><Text style={styles.headerTitle}>Mutaxassis profili</Text></View>
      {image ? <Image source={{ uri: image }} style={styles.cover} /> : <View style={[styles.cover, styles.coverEmpty]}><Text style={styles.initial}>{nameOf(activeSelected).slice(0, 1).toUpperCase()}</Text></View>}
      <Text style={styles.detailName}>{nameOf(activeSelected)}</Text><Text style={styles.detailCategory}>{serviceLabel(activeSelected)} · {getServiceTaxonomyLabel(activeSelected.level1)}</Text>
      {activeSelected.price_range ? <Text style={styles.price}>{activeSelected.price_range}</Text> : null}<Text style={styles.description}>{activeSelected.description || 'Xizmat haqida qo‘shimcha ma’lumot berilmagan.'}</Text>
      {activeSelected.phone ? <Text style={styles.phone}>Telefon: {activeSelected.phone}</Text> : null}
      <Pressable disabled={busy} onPress={apply} style={styles.primary}>{busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Xizmatga murojaat qilish</Text>}</Pressable>
    </ScrollView>;
  }
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.header}><BackButton onPress={onBack} /><Text style={styles.headerTitle}>Xizmatlar</Text></View>
    <Text style={styles.title}>Usta va mutaxassislar</Text><Text style={styles.note}>Yo‘nalishni tanlang yoki xizmat nomidan qidiring.</Text>
    <TextInput value={query} onChangeText={setQuery} placeholder="Masalan: santexnik, elektrik" style={styles.search} placeholderTextColor="#90A1B1" />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.directions}>{[['all', 'Barchasi'], ...directions.map(([key]) => [key, getServiceTaxonomyLabel(key)])].map(([key, label]) => <Pressable key={key} onPress={() => setDirection(key)} style={[styles.direction, direction === key && styles.directionActive]}><Text style={[styles.directionText, direction === key && styles.directionTextActive]}>{label}</Text></Pressable>)}</ScrollView>
    {loading ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 25 }} /> : null}{error ? <Pressable onPress={load} style={styles.error}><Text style={styles.errorText}>{error} · Qayta urinish</Text></Pressable> : null}{initialProviderId && !loading && !activeSelected ? <Text style={styles.errorText}>Ulashilgan xizmat profili topilmadi.</Text> : null}
    {!loading && !error && !filtered.length ? <View style={styles.empty}><Text style={styles.emptyTitle}>Hozircha mutaxassis topilmadi</Text><Text style={styles.note}>Qidiruvni o‘zgartiring yoki qayta urinib ko‘ring.</Text></View> : null}
    {filtered.map((provider, index) => <Pressable key={provider._id || provider.id || index} onPress={() => setSelected(provider)} style={styles.card}><View style={styles.avatar}><Text style={styles.initial}>{nameOf(provider).slice(0, 1).toUpperCase()}</Text></View><View style={styles.cardBody}><Text numberOfLines={1} style={styles.name}>{nameOf(provider)}</Text><Text numberOfLines={1} style={styles.category}>{serviceLabel(provider)}</Text><Text numberOfLines={2} style={styles.description}>{provider.description || 'Xizmat profili'}</Text>{provider.price_range ? <Text style={styles.price}>{provider.price_range}</Text> : null}</View><Chevron /></Pressable>)}
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 18, paddingBottom: 30 }, header: { minHeight: 43, flexDirection: 'row', alignItems: 'center' }, back: { width: 42 }, backGlyph: { color: colors.ink, fontSize: 34 }, headerTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' }, title: { color: colors.ink, fontSize: 24, fontWeight: '900', marginTop: 10 }, note: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }, search: { minHeight: 48, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 13, color: colors.ink, marginTop: 14 }, directions: { gap: 7, paddingVertical: 11 }, direction: { minHeight: 34, justifyContent: 'center', borderRadius: 18, paddingHorizontal: 12, backgroundColor: '#E7EFF5' }, directionActive: { backgroundColor: colors.cyan }, directionText: { color: colors.muted, fontSize: 10, fontWeight: '700' }, directionTextActive: { color: colors.white }, card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, padding: 12, marginTop: 9, ...shadow }, avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#DDF5F8', justifyContent: 'center', alignItems: 'center' }, initial: { color: colors.cyanDark, fontSize: 20, fontWeight: '900' }, cardBody: { flex: 1, paddingHorizontal: 11 }, name: { color: colors.ink, fontSize: 13, fontWeight: '800' }, category: { color: colors.cyanDark, fontSize: 10, fontWeight: '700', marginTop: 3 }, description: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 }, price: { color: colors.ink, fontSize: 11, fontWeight: '800', marginTop: 5 }, arrow: { color: colors.muted, fontSize: 23 }, empty: { marginTop: 22, backgroundColor: colors.white, borderRadius: 16, padding: 18 }, emptyTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' }, error: { backgroundColor: '#FFF0F1', padding: 12, borderRadius: 12, marginTop: 14 }, errorText: { color: colors.red, fontSize: 12 }, cover: { width: '100%', height: 210, borderRadius: 20, marginTop: 14, backgroundColor: '#E2F2F5' }, coverEmpty: { alignItems: 'center', justifyContent: 'center' }, detailName: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 17 }, detailCategory: { color: colors.cyanDark, fontSize: 12, fontWeight: '700', marginTop: 6 }, phone: { color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 12 }, primary: { minHeight: 51, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyan, borderRadius: 15, marginTop: 21 }, primaryText: { color: colors.white, fontSize: 13, fontWeight: '900' } });
