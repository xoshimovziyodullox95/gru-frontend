import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { absoluteMediaUrl, apiRequest, unwrapArray } from '../api';
import { colors, shadow } from '../theme';
import { Bell, X } from '../icons';
import { BackButton, Chevron } from '../ui';

const titleOf = (item) => item?.title || item?.itemId?.title || item?.name || 'E’lon';
const imageOf = (item) => absoluteMediaUrl(item?.image || item?.images?.[0] || item?.itemId?.images?.[0]);
const priceOf = (item) => {
  const raw = item?.price ?? item?.price_per_month ?? item?.price_range ?? item?.itemId?.price;
  if (typeof raw === 'string' && /so‘m|so'm|\$/i.test(raw)) return raw;
  const amount = Number(String(raw ?? '').replace(/[^\d.,-]/g, '').replace(',', '.'));
  const currency = item?.currency || item?.itemId?.currency || 'UZS';
  return amount > 0 ? (currency === 'USD' ? `$${new Intl.NumberFormat('en-US').format(amount)}` : `${new Intl.NumberFormat('uz-UZ').format(amount)} so‘m`) : 'Narxi ko‘rsatilmagan';
};

export default function AccountListScreen({ type, token, favorites = [], onBack, onOpenListing, onOpenLocation, onOpenNotification, onEditListing, onEditLocation, onRemoveFavorite }) {
  const [items, setItems] = useState([]);
  const [prefs, setPrefs] = useState(null);
  const [savingPref, setSavingPref] = useState('');
  const [loading, setLoading] = useState(['orders', 'received-orders', 'listings', 'locations', 'notifications', 'settings'].includes(type));
  const [updatingOrder, setUpdatingOrder] = useState('');
  const [error, setError] = useState('');
  const config = {
    saved: ['Saqlanganlar', favorites],
    listings: ['Mening e’lonlarim', items],
    locations: ['Joy e’lonlarim', items],
    orders: ['Buyurtmalarim', items],
    'received-orders': ['Kelgan buyurtmalar', items],
    notifications: ['Bildirishnomalar', items],
    settings: ['Sozlamalar', []],
  }[type] || ['Profil', []];

  const load = useCallback(async () => {
    if (!token || !['orders', 'received-orders', 'listings', 'locations', 'notifications', 'settings'].includes(type)) return;
    setLoading(true); setError('');
    try {
      const response = await apiRequest(type === 'orders' ? '/orders?role=buyer' : type === 'received-orders' ? '/orders/received' : type === 'listings' ? '/user/my-equipment' : type === 'locations' ? '/user/my-locations' : type === 'settings' ? '/user/settings' : '/notifications?limit=50', { token });
      if (type === 'settings') setPrefs(response?.notificationPrefs || {});
      else setItems(type === 'orders' ? unwrapArray(response?.orders || response) : unwrapArray(response?.equipment || response?.notifications || response?.data || response));
    } catch (err) { setError(err.message || 'Ma’lumot yuklanmadi.'); }
    finally { setLoading(false); }
  }, [token, type]);

  useEffect(() => {
    if (!token || !['orders', 'received-orders', 'listings', 'locations', 'notifications', 'settings'].includes(type)) return undefined;
    let active = true;
    const path = type === 'orders' ? '/orders?role=buyer' : type === 'received-orders' ? '/orders/received' : type === 'listings' ? '/user/my-equipment' : type === 'locations' ? '/user/my-locations' : type === 'settings' ? '/user/settings' : '/notifications?limit=50';
    apiRequest(path, { token })
      .then((response) => {
        if (!active) return;
        if (type === 'settings') setPrefs(response?.notificationPrefs || {});
        else setItems(type === 'orders' ? unwrapArray(response?.orders || response) : unwrapArray(response?.equipment || response?.notifications || response?.data || response));
      })
      .catch((err) => { if (active) setError(err.message || 'Ma’lumot yuklanmadi.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, type]);

  const openItem = (item) => {
    if (item?.type === 'location') { onOpenLocation?.(item); return; }
    if (type === 'locations') { onOpenLocation?.(item); return; }
    const product = item?.itemId && typeof item.itemId === 'object' ? item.itemId : item;
    if (product?._id || product?.id) onOpenListing?.(product);
  };

  const updatePreference = async (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next); setSavingPref(key); setError('');
    try { const response = await apiRequest('/user/settings', { token, method: 'PUT', body: { notificationPrefs: next } }); setPrefs(response?.notificationPrefs || next); }
    catch (err) { setPrefs(prefs); setError(err.message || 'Sozlamani saqlab bo‘lmadi.'); }
    finally { setSavingPref(''); }
  };

  const updateOrder = async (order, status) => {
    const id = order._id || order.id;
    setUpdatingOrder(id); setError('');
    try {
      const response = await apiRequest(`/orders/${encodeURIComponent(id)}/status`, { token, method: 'PUT', body: { status } });
      const updated = response?.order || response?.data?.order;
      setItems((current) => current.map((entry) => (entry._id || entry.id) === id ? { ...entry, ...(updated || {}), status } : entry));
    } catch (err) { Alert.alert('Holat o‘zgarmadi', err.message || 'Sahifani yangilab qayta urinib ko‘ring.'); }
    finally { setUpdatingOrder(''); }
  };

  const openNotification = async (item) => {
    const id = item?._id || item?.id;
    if (!item.read && id) {
      try {
        await apiRequest(`/notifications/${encodeURIComponent(id)}/read`, { token, method: 'PUT', body: {} });
        setItems((current) => current.map((entry) => String(entry._id || entry.id) === String(id) ? { ...entry, read: true } : entry));
      } catch { /* Keep navigation available if marking as read fails. */ }
    }
    onOpenNotification?.(item);
  };

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <View style={styles.header}><BackButton onPress={onBack} /><Text style={styles.title}>{config[0]}</Text><View style={{ width: 42 }} /></View>
    {loading ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 28 }} /> : null}
    {error ? <Pressable onPress={load} style={styles.error}><Text style={styles.errorText}>{error} · Qayta yuklash</Text></Pressable> : null}
    {type === 'settings' && prefs ? <View style={styles.settingsCard}>{[['messages', 'Xabarlar'], ['orders', 'Buyurtmalar'], ['comments', 'Izohlar'], ['likes', 'Yoqtirishlar'], ['ads', 'E’lonlar']].map(([key, label]) => <View key={key} style={styles.settingRow}><Text style={styles.settingLabel}>{label}</Text><Switch value={prefs[key] !== false} onValueChange={(value) => updatePreference(key, value)} disabled={Boolean(savingPref)} trackColor={{ false: '#D8E1E8', true: '#65D4DF' }} thumbColor={prefs[key] !== false ? colors.cyanDark : '#FFFFFF'} /></View>)}</View> : null}
    {!loading && !error && type !== 'settings' && !config[1].length ? <View style={styles.empty}><Text style={styles.emptyTitle}>{type === 'saved' ? 'Hozircha saqlangan e’lon yo‘q' : 'Hozircha ma’lumot yo‘q'}</Text><Text style={styles.note}>{type === 'saved' ? 'E’lon tafsilotida “Saqlash” tugmasini bosganlaringiz shu yerda ko‘rinadi.' : 'Yangi ma’lumot paydo bo‘lganda shu yerda ko‘rasiz.'}</Text></View> : null}
    {config[1].map((item, index) => {
      const image = imageOf(item);
      const rowTitle = titleOf(item);
      const notification = type === 'notifications';
      const order = type === 'orders' || type === 'received-orders';
      const orderStatus = { yangi: 'Yangi', qabul_qilindi: 'Qabul qilindi', yetkazilmoqda: 'Yetkazilmoqda', yetkazildi: 'Yetkazildi', rad_etildi: 'Rad etildi', bekor_qilindi: 'Bekor qilindi' }[item.status] || item.status || 'Yangi';
      const Row = order ? View : Pressable;
      return <Row key={item._id || item.id || index} onPress={() => notification ? openNotification(item) : openItem(item)} style={[styles.row, notification && !item.read && { borderWidth: 1, borderColor: '#A8E8EF' }]}>
        {image ? <Image source={{ uri: image }} style={styles.image} /> : <View style={[styles.image, styles.fallback]}>{notification ? <Bell color={colors.cyan} size={22} strokeWidth={2} /> : <Text style={styles.fallbackText}>Z</Text>}</View>}
        <View style={styles.rowBody}><Text numberOfLines={2} style={styles.rowTitle}>{notification ? item.title || item.message || 'Bildirishnoma' : rowTitle}</Text><Text style={styles.note}>{order ? `${orderStatus} · ${priceOf(item)}` : notification ? item.body || item.message || '' : priceOf(item)}</Text></View>
        {type === 'saved' ? <Pressable onPress={() => onRemoveFavorite?.(item)} style={styles.remove}><X color={colors.muted} size={16} strokeWidth={2.4} /></Pressable> : type === 'listings' ? <Pressable onPress={() => onEditListing?.(item)} style={styles.editButton}><Text style={styles.editText}>Tahrirlash</Text></Pressable> : type === 'locations' ? <Pressable onPress={() => onEditLocation?.(item)} style={styles.editButton}><Text style={styles.editText}>Tahrirlash</Text></Pressable> : <Chevron />}
        {order && type === 'received-orders' && item.status === 'yangi' ? <View style={styles.orderActions}><Pressable disabled={Boolean(updatingOrder)} onPress={() => updateOrder(item, 'qabul_qilindi')} style={styles.accept}><Text style={styles.acceptText}>Qabul</Text></Pressable><Pressable disabled={Boolean(updatingOrder)} onPress={() => updateOrder(item, 'rad_etildi')} style={styles.reject}><Text style={styles.rejectText}>Rad</Text></Pressable></View> : null}
        {order && type === 'received-orders' && item.status === 'qabul_qilindi' ? <Pressable disabled={Boolean(updatingOrder)} onPress={() => updateOrder(item, 'yetkazilmoqda')} style={styles.accept}><Text style={styles.acceptText}>Jo‘natildi</Text></Pressable> : null}
        {order && type === 'received-orders' && item.status === 'yetkazilmoqda' ? <Pressable disabled={Boolean(updatingOrder)} onPress={() => updateOrder(item, 'yetkazildi')} style={styles.accept}><Text style={styles.acceptText}>Yetkazildi</Text></Pressable> : null}
      </Row>;
    })}
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 17, paddingBottom: 30 }, header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', marginBottom: 9 }, back: { width: 42, height: 42, justifyContent: 'center' }, backGlyph: { color: colors.ink, fontSize: 34, marginTop: -3 }, title: { flex: 1, color: colors.ink, fontSize: 20, fontWeight: '800' }, row: { minHeight: 83, flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: colors.white, borderRadius: 15, marginTop: 9, ...shadow }, image: { width: 62, height: 62, borderRadius: 11, backgroundColor: '#E8F0F5' }, fallback: { alignItems: 'center', justifyContent: 'center' }, fallbackText: { color: colors.cyan, fontWeight: '900', fontSize: 25 }, rowBody: { flex: 1, paddingHorizontal: 11 }, rowTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, note: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }, arrow: { color: colors.muted, fontSize: 22 }, editButton: { minHeight: 32, paddingHorizontal: 9, borderRadius: 9, backgroundColor: '#E3F8FA', alignItems: 'center', justifyContent: 'center' }, editText: { color: colors.cyanDark, fontSize: 10, fontWeight: '800' }, remove: { width: 33, height: 33, borderRadius: 10, backgroundColor: '#FFF0F1', alignItems: 'center', justifyContent: 'center' }, removeText: { color: colors.red, fontSize: 23, lineHeight: 25 }, orderActions: { flexDirection: 'column', gap: 5 }, accept: { minHeight: 31, paddingHorizontal: 9, borderRadius: 9, backgroundColor: '#E3F8F3', alignItems: 'center', justifyContent: 'center' }, acceptText: { color: '#16815C', fontSize: 10, fontWeight: '800' }, reject: { minHeight: 28, paddingHorizontal: 9, borderRadius: 9, backgroundColor: '#FFF0F1', alignItems: 'center', justifyContent: 'center' }, rejectText: { color: colors.red, fontSize: 10, fontWeight: '800' }, empty: { backgroundColor: colors.white, borderRadius: 17, padding: 19, marginTop: 24 }, emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' }, settingsCard: { backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: 14, marginTop: 10, ...shadow }, settingRow: { minHeight: 54, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line }, settingLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' }, error: { backgroundColor: '#FFF0F1', padding: 13, borderRadius: 12, marginTop: 15 }, errorText: { color: colors.red, fontSize: 12 },
});
