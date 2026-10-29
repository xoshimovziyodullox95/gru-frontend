import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiRequest, unwrapArray } from '../api';
import { getServiceTaxonomyLabel } from '../../components/utils/serviceTaxonomyLabels';
import { colors, shadow } from '../theme';
import { BackButton, Chevron, PinText } from '../ui';

const money = (value) => `${new Intl.NumberFormat('uz-UZ').format(Number(value) || 0)} so‘m`;

export default function ServiceRequestsScreen({ token, mode = 'mine', onLogin, onBack }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(Boolean(token));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const providerMode = mode === 'provider';
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    try { const response = await apiRequest(providerMode ? '/service-requests/for-provider?status=open&limit=50' : '/service-requests/mine?limit=50', { token }); setItems(unwrapArray(response?.requests || response)); }
    catch (err) { setError(err.message || 'Xizmat so‘rovlari yuklanmadi.'); }
    finally { setLoading(false); }
  }, [token, providerMode]);
  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    apiRequest(providerMode ? '/service-requests/for-provider?status=open&limit=50' : '/service-requests/mine?limit=50', { token })
      .then((response) => { if (active) setItems(unwrapArray(response?.requests || response)); })
      .catch((err) => { if (active) setError(err.message || 'Xizmat so‘rovlari yuklanmadi.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, providerMode]);
  const openRequest = async (item) => {
    setSelected(item); setDetail(null); setError('');
    try { const result = await apiRequest(`/service-requests/${encodeURIComponent(item._id || item.id)}`, { token }); setDetail(result?.request || result?.data || result); }
    catch (err) { setError(err.message || 'So‘rov tafsiloti yuklanmadi.'); }
  };
  const sendOffer = async () => {
    const amount = Number(price.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) { setError('Taklif narxini kiriting.'); return; }
    setBusy(true); setError('');
    try { await apiRequest(`/service-requests/${encodeURIComponent(selected._id || selected.id)}/offer`, { token, method: 'POST', body: { price: amount, message: message.trim(), arrivalMinutes: 60 } }); Alert.alert('Taklif yuborildi', 'Mijoz taklifingizni ko‘rib chiqadi.'); setSelected(null); setDetail(null); load(); }
    catch (err) { setError(err.message || 'Taklif yuborilmadi.'); }
    finally { setBusy(false); }
  };
  const acceptOffer = async (offer) => {
    setBusy(true); setError('');
    try { await apiRequest(`/service-requests/${encodeURIComponent(selected._id || selected.id)}/accept/${encodeURIComponent(offer._id || offer.id)}`, { token, method: 'POST', body: {} }); Alert.alert('Taklif qabul qilindi', 'Usta siz bilan bog‘lanadi.'); setSelected(null); setDetail(null); load(); }
    catch (err) { setError(err.message || 'Taklifni qabul qilib bo‘lmadi.'); }
    finally { setBusy(false); }
  };
  if (!token) return <View style={styles.center}><Text style={styles.title}>Kirish kerak</Text><Text style={styles.note}>Xizmat so‘rovlarini ko‘rish uchun telefon orqali kiring.</Text><Pressable onPress={onLogin} style={styles.primary}><Text style={styles.primaryText}>Telefon orqali kirish</Text></Pressable></View>;
  if (selected) {
    const request = detail || selected;
    return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><View style={styles.header}><BackButton onPress={() => { setSelected(null); setDetail(null); }} /><Text style={styles.headerTitle}>So‘rov tafsiloti</Text></View>
      {!detail ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 22 }} /> : <><Text style={styles.title}>{getServiceTaxonomyLabel(request.category)}</Text><Text style={styles.note}>{request.description}</Text><PinText style={styles.location}>{request.location?.address || request.location?.region || 'Manzil ko‘rsatilmagan'}</PinText>
        {providerMode && request.status === 'open' ? <View style={styles.offerCard}><Text style={styles.cardTitle}>Narx taklif qiling</Text><TextInput value={price} onChangeText={(value) => setPrice(value.replace(/[^\d.,]/g, ''))} keyboardType="decimal-pad" placeholder="Xizmat narxi (so‘m)" style={styles.field} placeholderTextColor="#91A2B2" /><TextInput value={message} onChangeText={setMessage} placeholder="Mijozga izoh (ixtiyoriy)" multiline style={[styles.field, styles.multiline]} placeholderTextColor="#91A2B2" /><Pressable onPress={sendOffer} disabled={busy} style={styles.primary}>{busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Taklif yuborish</Text>}</Pressable></View> : null}
        {!providerMode && Array.isArray(request.offers) ? <View style={{ marginTop: 20 }}><Text style={styles.cardTitle}>Kelgan takliflar ({request.offers.length})</Text>{request.offers.map((offer, index) => <View key={offer._id || offer.id || index} style={styles.offerCard}><Text style={styles.cardTitle}>{offer.providerId?.name || offer.provider?.name || 'Xizmat ko‘rsatuvchi'}</Text><Text style={styles.price}>{money(offer.price)}</Text>{offer.message ? <Text style={styles.note}>{offer.message}</Text> : null}{offer.status === 'pending' && request.status === 'open' ? <Pressable disabled={busy} onPress={() => acceptOffer(offer)} style={styles.primary}>{busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Qabul qilish</Text>}</Pressable> : <Text style={styles.note}>Holati: {offer.status || 'yuborildi'}</Text>}</View>)}</View> : null}
      </>}{error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScrollView>;
  }
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><View style={styles.header}><BackButton onPress={onBack} /><Text style={styles.headerTitle}>{providerMode ? 'Ustaga kelgan so‘rovlar' : 'Mening xizmat so‘rovlarim'}</Text></View>
    {loading ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 25 }} /> : null}{error ? <Pressable style={styles.errorCard} onPress={load}><Text style={styles.errorText}>{error} · Qayta urinish</Text></Pressable> : null}
    {!loading && !error && !items.length ? <View style={styles.empty}><Text style={styles.cardTitle}>Hozircha so‘rov yo‘q</Text><Text style={styles.note}>{providerMode ? 'Sizga mos yangi so‘rovlar shu yerda ko‘rinadi.' : 'Usta kerak bo‘lganda yuborgan so‘rovlaringiz shu yerda chiqadi.'}</Text></View> : null}
    {items.map((item, index) => <Pressable key={item._id || item.id || index} onPress={() => openRequest(item)} style={styles.row}><View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.cardTitle}>{getServiceTaxonomyLabel(item.category)}</Text><Text numberOfLines={2} style={styles.note}>{item.description}</Text><Text style={styles.location}>{providerMode ? item.location?.address || 'Manzil ko‘rsatilmagan' : `${item.offersCount || 0} ta taklif`} · {item.status || 'open'}</Text></View><Chevron /></Pressable>)}
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 17, paddingBottom: 30 }, center: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.canvas }, header: { minHeight: 46, flexDirection: 'row', alignItems: 'center', marginBottom: 8 }, back: { width: 40 }, backGlyph: { color: colors.ink, fontSize: 34 }, headerTitle: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '800' }, title: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 10 }, note: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }, location: { color: colors.muted, fontSize: 11, marginTop: 7 }, row: { minHeight: 82, flexDirection: 'row', alignItems: 'center', padding: 13, backgroundColor: colors.white, borderRadius: 15, marginTop: 9, ...shadow }, cardTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, arrow: { color: colors.muted, fontSize: 23 }, empty: { backgroundColor: colors.white, padding: 18, borderRadius: 16, marginTop: 20 }, offerCard: { backgroundColor: colors.white, borderRadius: 16, padding: 14, marginTop: 12, ...shadow }, price: { color: colors.cyanDark, fontWeight: '900', marginTop: 6 }, field: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.canvas, color: colors.ink, paddingHorizontal: 12, marginTop: 10 }, multiline: { minHeight: 75, paddingTop: 10 }, primary: { minHeight: 46, borderRadius: 13, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, primaryText: { color: colors.white, fontWeight: '800', fontSize: 12 }, errorCard: { backgroundColor: '#FFF0F1', padding: 12, borderRadius: 12, marginTop: 13 }, errorText: { color: colors.red, fontSize: 12, marginTop: 8 } });
