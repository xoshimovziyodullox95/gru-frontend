import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { absoluteMediaUrl, apiRequest, apiUpload } from '../api';
import { colors } from '../theme';
import { BackButton } from '../ui';

const placeTypes = [['dokon', 'Do‘kon / savdo joyi'], ['ofis', 'Ofis'], ['ombor', 'Ombor / sex'], ['xonadon', 'Uy / xonadon'], ['yer', 'Yer uchastkasi']];

export default function CreateLocationScreen({ token, user, initialLocation, onLogin, onBack, onCreated }) {
  const [dealType, setDealType] = useState(initialLocation?.dealType || 'rent');
  const [placeType, setPlaceType] = useState(initialLocation?.category || '');
  const [title, setTitle] = useState(initialLocation?.title || '');
  const [price, setPrice] = useState(String(initialLocation?.price_per_month || initialLocation?.price || initialLocation?.price_range || ''));
  const [region, setRegion] = useState(initialLocation?.region || '');
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [phone, setPhone] = useState(initialLocation?.phone || user?.phone || '');
  const [description, setDescription] = useState(initialLocation?.description || '');
  const [rooms, setRooms] = useState(String(initialLocation?.details?.rooms || ''));
  const [sqm, setSqm] = useState(String(initialLocation?.details?.sqm || ''));
  const [images, setImages] = useState([]);
  const [coords, setCoords] = useState(initialLocation?.lat != null && initialLocation?.lng != null ? { lat: initialLocation.lat, lng: initialLocation.lng } : null);
  const existingImages = initialLocation?.images || initialLocation?.media?.map((entry) => entry.url || entry) || [];
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const chooseImages = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { setError('Rasmlar tanlash uchun galereyaga ruxsat bering.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: Math.max(1, 10 - images.length - existingImages.length), quality: .82 });
      if (!result.canceled) setImages((current) => [...current, ...(result.assets || [])].slice(0, 10));
    } catch (err) { setError(err.message || 'Rasmlarni tanlab bo‘lmadi.'); }
  };

  const locate = async () => {
    setLocating(true); setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Joylashuv ruxsati berilmadi. Manzilni kiritib, ruxsatni yoqing.');
      const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: result.coords.latitude, lng: result.coords.longitude });
    } catch (err) { setError(err.message || 'Telefon joylashuvini aniqlab bo‘lmadi.'); }
    finally { setLocating(false); }
  };

  const submit = async () => {
    if (!token) return onLogin?.();
    if ((!initialLocation && !images.length) || !placeType || title.trim().length < 3 || !(Number(price) > 0) || !region.trim() || address.trim().length < 3 || !coords || phone.replace(/\D/g, '').length < 9) {
      setError('Rasm, sarlavha, narx, viloyat, manzil, telefon va joylashuv koordinatasini to‘ldiring.'); return;
    }
    setBusy(true); setError('');
    try {
      const body = { title: title.trim(), description: description.trim(), address: address.trim(), region: region.trim(), phone: phone.trim(), dealType, price_range: String(Number(price)), price_per_month: dealType === 'rent' ? Number(price) : 0, currency: 'UZS', level1: 'marketplace', category: placeType, lat: coords.lat, lng: coords.lng, details: { sqm: Number(sqm) || 0, rooms: Number(rooms) || 0, floor: 0 } };
      const result = initialLocation
        ? await apiRequest(`/locations/${encodeURIComponent(initialLocation._id || initialLocation.id)}`, { token, method: 'PUT', body })
        : await apiRequest('/locations', { token, method: 'POST', body });
      const id = result?._id || result?.id || result?.data?._id;
      if (!id) throw new Error('E’lon yaratildi, lekin identifikatori olinmadi. Qayta tekshiring.');
      const formData = new FormData();
      images.forEach((image, index) => { const name = image.fileName || `zumo-place-${Date.now()}-${index}.jpg`; if (Platform.OS === 'web' && image.file) formData.append('media', image.file, name); else formData.append('media', { uri: image.uri, name, type: image.mimeType || 'image/jpeg' }); });
      let mediaWarning = '';
      try { if (images.length) await apiUpload(`/locations/${encodeURIComponent(id)}/upload-media`, { token, formData }); }
      catch (err) { mediaWarning = `E’lon joylandi, lekin rasmlar yuklanmadi: ${err.message}`; }
      Alert.alert(initialLocation ? 'Joy e’loni yangilandi' : 'Joy e’loni joylandi', mediaWarning || (initialLocation ? 'O‘zgarishlar saqlandi.' : 'E’loningiz marketplace’da ko‘rinadi.'), [{ text: 'Tushunarli', onPress: onCreated }]);
    } catch (err) { setError(err.message || 'Joy e’lonini yaratib bo‘lmadi.'); }
    finally { setBusy(false); }
  };

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><BackButton onPress={onBack} /><Text style={styles.headerTitle}>{initialLocation ? 'Joy e’lonini tahrirlash' : 'Joy e’loni'}</Text></View>
    <Text style={styles.title}>{initialLocation ? 'Joy ma’lumotlarini yangilang' : 'Joyni ijaraga bering yoki soting'}</Text><Text style={styles.note}>Manzil va xaritadagi joyini belgilang. Joylashuv faqat e’lon uchun ZUMO serveriga yuboriladi.</Text>
    <Text style={styles.label}>E’lon turi</Text><View style={styles.row}>{[['rent', 'Ijaraga beraman'], ['sale', 'Sotaman']].map(([key, label]) => <Pressable key={key} onPress={() => setDealType(key)} style={[styles.option, dealType === key && styles.active]}><Text style={[styles.optionText, dealType === key && styles.activeText]}>{label}</Text></Pressable>)}</View>
    <Text style={styles.label}>Joy turi</Text><View style={styles.grid}>{placeTypes.map(([key, label]) => <Pressable key={key} onPress={() => setPlaceType(key)} style={[styles.chip, placeType === key && styles.active]}><Text style={[styles.chipText, placeType === key && styles.activeText]}>{label}</Text></Pressable>)}</View>
    <Text style={styles.label}>Rasmlar (10 tagacha)</Text><View style={styles.row}><Pressable onPress={chooseImages} style={styles.addPhoto}><Text style={styles.addText}>＋ Rasm tanlash</Text></Pressable><ScrollView horizontal contentContainerStyle={{ gap: 8 }}>{existingImages.map((image, index) => <Image key={`existing-${index}`} source={{ uri: absoluteMediaUrl(image?.url || image) }} style={styles.photo} />)}{images.map((image, index) => <Pressable key={`${image.uri}-${index}`} onPress={() => setImages((current) => current.filter((_, i) => i !== index))}><Image source={{ uri: image.uri }} style={styles.photo} /></Pressable>)}</ScrollView></View>
    <Text style={styles.label}>Sarlavha</Text><TextInput value={title} onChangeText={setTitle} placeholder="Masalan: Chilonzorda do‘kon ijarasi" style={styles.field} placeholderTextColor="#90A1B1" />
    <Text style={styles.label}>Narxi (so‘m)</Text><TextInput value={price} onChangeText={(value) => setPrice(value.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="Oyiga yoki sotuv narxi" style={styles.field} placeholderTextColor="#90A1B1" />
    <Text style={styles.label}>Viloyat yoki shahar</Text><TextInput value={region} onChangeText={setRegion} placeholder="Toshkent" style={styles.field} placeholderTextColor="#90A1B1" />
    <Text style={styles.label}>Aniq manzil</Text><TextInput value={address} onChangeText={setAddress} placeholder="Tuman, ko‘cha, uy" style={styles.field} placeholderTextColor="#90A1B1" />
    <Pressable onPress={locate} disabled={locating} style={styles.locate}>{locating ? <ActivityIndicator color="white" /> : <Text style={styles.locateText}>{coords ? 'Joylashuv yangilash' : 'Telefon joylashuvini belgilash'}</Text>}</Pressable>
    {coords ? <Text style={styles.mapSuccess}>Koordinata belgilandi ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})</Text> : <Text style={styles.hint}>Telefon GPS ruxsati kerak bo‘ladi.</Text>}
    {(placeType === 'xonadon' || placeType === 'ofis') ? <View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.label}>Maydon (m²)</Text><TextInput value={sqm} onChangeText={(v) => setSqm(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.field} placeholder="0" /></View><View style={{ flex: 1 }}><Text style={styles.label}>Xonalar</Text><TextInput value={rooms} onChangeText={(v) => setRooms(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.field} placeholder="0" /></View></View> : null}
    <Text style={styles.label}>Telefon</Text><TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+998 90 123 45 67" style={styles.field} placeholderTextColor="#90A1B1" />
    <Text style={styles.label}>Tavsif</Text><TextInput value={description} onChangeText={setDescription} multiline textAlignVertical="top" placeholder="Joy haqida qo‘shimcha ma’lumot" style={[styles.field, styles.multiline]} placeholderTextColor="#90A1B1" />
    {error ? <Text style={styles.error}>{error}</Text> : null}<Pressable onPress={submit} disabled={busy} style={[styles.submit, busy && { opacity: .6 }]}>{busy ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>{initialLocation ? 'O‘zgarishlarni saqlash' : 'Joy e’lonini joylash'}</Text>}</Pressable>
  </ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 18, paddingBottom: 34 }, header: { minHeight: 45, flexDirection: 'row', alignItems: 'center' }, back: { width: 42 }, backText: { color: colors.ink, fontSize: 34 }, headerTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' }, title: { color: colors.ink, fontSize: 23, lineHeight: 29, fontWeight: '900', marginTop: 9 }, note: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }, label: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 15, marginBottom: 7 }, row: { flexDirection: 'row', gap: 8, alignItems: 'center' }, option: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 13 }, optionText: { color: colors.ink, fontSize: 12, fontWeight: '700' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { minHeight: 38, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 12 }, chipText: { color: colors.ink, fontSize: 11, fontWeight: '700' }, active: { backgroundColor: colors.cyan, borderColor: colors.cyan }, activeText: { color: colors.white }, addPhoto: { height: 70, paddingHorizontal: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.cyan, borderRadius: 13, backgroundColor: '#E8F8FA' }, addText: { color: colors.cyanDark, fontSize: 11, fontWeight: '800' }, photo: { width: 70, height: 70, borderRadius: 12 }, field: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 13, backgroundColor: colors.white, color: colors.ink, paddingHorizontal: 12 }, locate: { minHeight: 44, paddingHorizontal: 13, borderRadius: 12, backgroundColor: colors.cyanDark, justifyContent: 'center', alignItems: 'center', marginTop: 9 }, locateText: { color: colors.white, fontSize: 11, fontWeight: '800' }, mapSuccess: { color: '#16815C', fontSize: 11, fontWeight: '700', marginTop: 6 }, hint: { color: colors.muted, fontSize: 10, marginTop: 6 }, multiline: { minHeight: 90, paddingTop: 11 }, error: { color: colors.red, fontSize: 12, lineHeight: 17, marginTop: 12 }, submit: { minHeight: 52, borderRadius: 15, backgroundColor: colors.cyan, justifyContent: 'center', alignItems: 'center', marginTop: 20 }, submitText: { color: colors.white, fontWeight: '900' } });
