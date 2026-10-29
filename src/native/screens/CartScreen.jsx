import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { absoluteMediaUrl, apiRequest, unwrapArray } from '../api';
import { colors, shadow } from '../theme';
import { ShoppingCart, X } from '../icons';
import { IconTile } from '../ui';

const amount = (value, currency = 'UZS') => currency === 'USD' ? `$${new Intl.NumberFormat('en-US').format(Number(value) || 0)}` : `${new Intl.NumberFormat('uz-UZ').format(Number(value) || 0)} so‘m`;

export default function CartScreen({ token, onLogin, onOpenListing, onMessageSeller }) {
  const [items, setItems] = useState([]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(Boolean(token));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    if (!token) return;
    setLoading(true); setError('');
    apiRequest('/cart', { token }).then((response) => setItems(unwrapArray(response?.items || response?.data?.items || response)))
      .catch((err) => setError(err.message || 'Savat yuklanmadi.'))
      .finally(() => setLoading(false));
  }, [token]);
  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    apiRequest('/cart', { token })
      .then((response) => { if (active) setItems(unwrapArray(response?.items || response?.data?.items || response)); })
      .catch((err) => { if (active) setError(err.message || 'Savat yuklanmadi.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const remove = async (cartItem) => {
    try {
      await apiRequest(`/cart/${encodeURIComponent(cartItem._id)}`, { token, method: 'DELETE' });
      setItems((current) => current.filter((entry) => entry._id !== cartItem._id));
    } catch (err) { setError(err.message || 'Tovarni olib tashlab bo‘lmadi.'); }
  };

  const order = async () => {
    if (!token) return onLogin();
    if (!address.trim()) { setError('Yetkazib berish manzilini kiriting.'); return; }
    const orderable = items.filter((entry) => entry.itemType === 'equipment' && entry.itemId?.saleMode === 'store');
    if (!orderable.length) { setError('Savatda buyurtma beriladigan tovar yo‘q. Oddiy e’lon egasiga chatdan yozing.'); return; }
    setBusy(true); setError('');
    try {
      const result = await apiRequest('/orders', { token, method: 'POST', body: {
        items: orderable.map((entry) => ({ itemId: entry.itemId?._id || entry.itemId, itemType: entry.itemType, quantity: entry.quantity || 1 })),
        buyerLocation: { address: address.trim() },
      } });
      await Promise.all(orderable.map((entry) => apiRequest(`/cart/${encodeURIComponent(entry._id)}`, { token, method: 'DELETE' }).catch(() => null)));
      setItems((current) => current.filter((entry) => !orderable.includes(entry)));
      Alert.alert('Buyurtma yuborildi', `${result.orders?.length || 1} ta buyurtmangiz sotuvchiga yuborildi.`);
    } catch (err) { setError(err.message || 'Buyurtmani yuborib bo‘lmadi.'); }
    finally { setBusy(false); }
  };

  if (!token) return <View style={styles.center}><IconTile icon={ShoppingCart} size={64} iconSize={30} style={{ marginBottom: 6 }} /><Text style={styles.title}>Savatingiz sizni kutmoqda</Text><Text style={styles.note}>Tovarlarni saqlash va buyurtma berish uchun tizimga kiring.</Text><Pressable onPress={onLogin} style={styles.primary}><Text style={styles.primaryText}>Telefon orqali kirish</Text></Pressable></View>;

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Text style={styles.title}>Savat</Text><Text style={styles.note}>Buyurtma berish mumkin bo‘lgan tovarlaringiz</Text>
    {loading ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 28 }} /> : null}
    {error ? <Pressable onPress={load} style={styles.error}><Text style={styles.errorText}>{error}</Text></Pressable> : null}
    {!loading && !items.length ? <View style={styles.empty}><IconTile icon={ShoppingCart} size={64} iconSize={30} style={{ marginBottom: 6 }} /><Text style={styles.emptyTitle}>Savat hozircha bo‘sh</Text><Text style={styles.note}>Katalogdan yoqqan mahsulotingizni savatga qo‘shing.</Text></View> : null}
    {items.map((entry, index) => {
      const product = typeof entry.itemId === 'object' ? entry.itemId : {};
      const imageUrl = absoluteMediaUrl(product.images?.[0] || product.image);
      const classified = product.saleMode === 'classified';
      return <View key={entry._id || index} style={styles.item}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : <View style={[styles.image, styles.imageEmpty]}><Text style={styles.fallback}>Z</Text></View>}
        <View style={styles.itemBody}><Pressable onPress={() => onOpenListing(product)}><Text numberOfLines={2} style={styles.itemTitle}>{product.title || entry.title || 'Tovar'}</Text><Text style={styles.price}>{amount(product.price || entry.price, product.currency)}</Text><Text style={[styles.mode, classified && styles.classified]}>{classified ? 'Oddiy e’lon · buyurtma berilmaydi' : `Soni: ${entry.quantity || 1}`}</Text></Pressable>{classified ? <Pressable onPress={() => onMessageSeller?.(product, token)} style={styles.contact}><Text style={styles.contactText}>Sotuvchiga yozish</Text></Pressable> : null}</View>
        <Pressable onPress={() => remove(entry)} style={styles.remove}><X color={colors.muted} size={16} strokeWidth={2.4} /></Pressable>
      </View>;
    })}
    {items.some((entry) => entry.itemType === 'equipment' && entry.itemId?.saleMode === 'store') ? <>
      <Text style={styles.fieldLabel}>Yetkazib berish manzili</Text><TextInput value={address} onChangeText={setAddress} placeholder="Tuman, mahalla, ko‘cha, uy" style={styles.field} placeholderTextColor="#91A2B2" />
      <Pressable disabled={busy} onPress={order} style={[styles.primary, busy && { opacity: 0.6 }]}>{busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Buyurtma berish</Text>}</Pressable>
    </> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 20, paddingBottom: 28 }, center: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }, title: { color: colors.ink, fontSize: 24, fontWeight: '900' }, note: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }, icon: { color: colors.cyan, fontSize: 38, marginBottom: 10 }, empty: { alignItems: 'center', padding: 25, backgroundColor: colors.white, borderRadius: 19, marginTop: 25 }, emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' }, primary: { minHeight: 50, backgroundColor: colors.cyan, borderRadius: 14, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, marginTop: 17 }, primaryText: { color: colors.white, fontWeight: '900', fontSize: 13 }, item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, padding: 10, marginTop: 11, ...shadow }, image: { width: 78, height: 78, borderRadius: 12, backgroundColor: '#E8F0F5' }, imageEmpty: { alignItems: 'center', justifyContent: 'center' }, fallback: { color: colors.cyan, fontWeight: '900', fontSize: 27 }, itemBody: { flex: 1, paddingHorizontal: 11 }, itemTitle: { color: colors.ink, fontWeight: '800', fontSize: 12, lineHeight: 16 }, price: { color: colors.cyanDark, fontWeight: '900', fontSize: 12, marginTop: 7 }, mode: { color: colors.muted, fontSize: 10, marginTop: 4 }, classified: { color: '#C17A28' }, contact: { alignSelf: 'flex-start', marginTop: 7, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#E3F8FA', borderRadius: 9 }, contactText: { color: colors.cyanDark, fontWeight: '800', fontSize: 10 }, remove: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0F1' }, removeText: { color: colors.red, fontSize: 23, lineHeight: 25 }, fieldLabel: { color: colors.ink, fontSize: 12, fontWeight: '800', marginTop: 19, marginBottom: 7 }, field: { height: 50, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 13, color: colors.ink }, error: { backgroundColor: '#FFF0F1', borderRadius: 12, padding: 12, marginTop: 15 }, errorText: { color: colors.red, fontSize: 12 },
});
