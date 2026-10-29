import { useEffect, useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiRequest, apiUpload } from '../api';
import { getServiceTaxonomyLabel } from '../../components/utils/serviceTaxonomyLabels';
import { colors } from '../theme';
import { BackButton } from '../ui';

export default function CreateServiceScreen({ token, user, onLogin, onBack, onCreated }) {
  const [taxonomy, setTaxonomy] = useState({});
  const [direction, setDirection] = useState('');
  const [category, setCategory] = useState('');
  const [entityType, setEntityType] = useState('individual');
  const [company, setCompany] = useState('');
  const [name, setName] = useState(user?.fullName || user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { apiRequest('/service-providers/taxonomy').then((response) => setTaxonomy(response?.taxonomy || response?.data?.taxonomy || {})).catch((err) => setError(err.message || 'Xizmat yo‘nalishlari yuklanmadi.')).finally(() => setLoading(false)); }, []);
  const directions = useMemo(() => Object.entries(taxonomy).filter(([, values]) => Array.isArray(values) && values.length), [taxonomy]);
  const categories = taxonomy[direction] || [];
  const chooseImages = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { setError('Rasm tanlash uchun galereyaga ruxsat bering.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: Math.max(1, 10 - images.length), quality: .82 });
      if (!result.canceled) setImages((current) => [...current, ...(result.assets || [])].slice(0, 10));
    } catch (err) { setError(err.message || 'Rasmlarni tanlab bo‘lmadi.'); }
  };
  const submit = async () => {
    if (!token) return onLogin?.();
    if (!direction || !category || !name.trim() || phone.replace(/\D/g, '').length < 9 || description.trim().length < 10 || (entityType === 'company' && !company.trim())) {
      setError('Yo‘nalish, xizmat turi, ism, telefon va kamida 10 belgili tavsifni kiriting. Firma bo‘lsa, nomini ham yozing.'); return;
    }
    setBusy(true); setError('');
    try {
      const created = await apiRequest('/service-providers', { token, method: 'POST', body: { entityType, company: entityType === 'company' ? company.trim() : '', name: name.trim(), phone: phone.trim(), description: description.trim(), price_range: price.trim(), level1: direction, service_category: category } });
      const id = created?._id || created?.id || created?.data?._id;
      let mediaWarning = '';
      if (images.length && id) {
        const formData = new FormData();
        images.forEach((image, index) => { const fileName = image.fileName || `zumo-service-${Date.now()}-${index}.jpg`; if (Platform.OS === 'web' && image.file) formData.append('media', image.file, fileName); else formData.append('media', { uri: image.uri, name: fileName, type: image.mimeType || 'image/jpeg' }); });
        try { await apiUpload(`/service-providers/${encodeURIComponent(id)}/upload-media`, { token, formData }); }
        catch (err) { mediaWarning = `Profil yaratildi, lekin rasmlar yuklanmadi: ${err.message}`; }
      }
      Alert.alert('Xizmat profilingiz yaratildi', mediaWarning || 'Endi mijozlar yo‘nalishingiz bo‘yicha profilingizni topa oladi.', [{ text: 'Yaxshi', onPress: onCreated }]);
    } catch (err) { setError(err.message || 'Xizmat profilini yaratib bo‘lmadi.'); }
    finally { setBusy(false); }
  };
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><BackButton onPress={onBack} /><Text style={styles.headerTitle}>Xizmat taklif qilish</Text></View>
    <Text style={styles.title}>Xizmat profilingiz</Text><Text style={styles.note}>Mijozlar sizni yo‘nalish va xizmat turiga qarab topadi.</Text>
    <Text style={styles.label}>Profil turi</Text><View style={styles.row}>{[['individual', 'Mutaxassis'], ['company', 'Firma']].map(([key, label]) => <Pressable key={key} onPress={() => setEntityType(key)} style={[styles.mode, entityType === key && styles.selected]}><Text style={[styles.modeText, entityType === key && styles.selectedText]}>{label}</Text></Pressable>)}</View>
    {entityType === 'company' ? <><Text style={styles.label}>Firma nomi</Text><TextInput value={company} onChangeText={setCompany} placeholder="Masalan, Usta Servis" style={styles.field} placeholderTextColor="#90A1B1" /></> : null}
    <Text style={styles.label}>{entityType === 'company' ? 'Mas’ul shaxs' : 'Ism-familiya'}</Text><TextInput value={name} onChangeText={setName} placeholder="Ismingiz" style={styles.field} placeholderTextColor="#90A1B1" />
    <Text style={styles.label}>Telefon</Text><TextInput value={phone} onChangeText={setPhone} placeholder="+998 90 123 45 67" keyboardType="phone-pad" style={styles.field} placeholderTextColor="#90A1B1" />
    <Text style={styles.label}>Yo‘nalish</Text>{loading ? <ActivityIndicator color={colors.cyan} /> : <View style={styles.grid}>{directions.map(([key]) => <Pressable key={key} onPress={() => { setDirection(key); setCategory(''); }} style={[styles.chip, direction === key && styles.selected]}><Text style={[styles.chipText, direction === key && styles.selectedText]}>{getServiceTaxonomyLabel(key)}</Text></Pressable>)}</View>}
    {direction ? <><Text style={styles.label}>Xizmat turi</Text><View style={styles.grid}>{categories.map((key) => <Pressable key={key} onPress={() => setCategory(key)} style={[styles.chip, category === key && styles.selected]}><Text style={[styles.chipText, category === key && styles.selectedText]}>{getServiceTaxonomyLabel(key)}</Text></Pressable>)}</View></> : null}
    <Text style={styles.label}>Xizmat narxi (ixtiyoriy)</Text><TextInput value={price} onChangeText={setPrice} placeholder="Masalan: 100 000 so‘mdan" style={styles.field} placeholderTextColor="#90A1B1" />
    <Text style={styles.label}>Ish namunalari (10 tagacha rasm)</Text><View style={styles.row}><Pressable onPress={chooseImages} style={styles.addPhoto}><Text style={styles.chipText}>＋ Rasm qo‘shish</Text></Pressable><ScrollView horizontal contentContainerStyle={{ gap: 8 }}>{images.map((image, index) => <Pressable key={`${image.uri}-${index}`} onPress={() => setImages((current) => current.filter((_, i) => i !== index))}><Image source={{ uri: image.uri }} style={styles.preview} /></Pressable>)}</ScrollView></View>
    <Text style={styles.label}>Tajriba va xizmat haqida</Text><TextInput value={description} onChangeText={setDescription} placeholder="Qanday ishlarni bajarasiz? Tajribangiz va xizmat hududingizni yozing." multiline textAlignVertical="top" style={[styles.field, styles.multiline]} placeholderTextColor="#90A1B1" />
    {error ? <Text style={styles.error}>{error}</Text> : null}<Pressable onPress={submit} disabled={busy || loading} style={[styles.submit, (busy || loading) && { opacity: .6 }]}>{busy ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>Xizmat profilini yaratish</Text>}</Pressable>
  </ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 18, paddingBottom: 32 }, header: { minHeight: 45, flexDirection: 'row', alignItems: 'center' }, back: { width: 42 }, backText: { color: colors.ink, fontSize: 34 }, headerTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' }, title: { color: colors.ink, fontSize: 24, fontWeight: '900', marginTop: 9 }, note: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }, label: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 16, marginBottom: 7 }, field: { minHeight: 49, borderWidth: 1, borderColor: colors.line, borderRadius: 13, backgroundColor: colors.white, color: colors.ink, paddingHorizontal: 13 }, multiline: { minHeight: 105, paddingTop: 12 }, row: { flexDirection: 'row', gap: 8, alignItems: 'center' }, mode: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 13 }, modeText: { color: colors.ink, fontWeight: '700', fontSize: 12 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { maxWidth: '100%', minHeight: 36, paddingHorizontal: 11, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }, chipText: { color: colors.ink, fontSize: 11, fontWeight: '600' }, preview: { width: 70, height: 70, borderRadius: 12 }, addPhoto: { minHeight: 52, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.cyan, borderRadius: 12, backgroundColor: '#E7F7F9' }, selected: { backgroundColor: colors.cyan, borderColor: colors.cyan }, selectedText: { color: colors.white }, error: { color: colors.red, fontSize: 12, lineHeight: 17, marginTop: 12 }, submit: { minHeight: 52, borderRadius: 15, backgroundColor: colors.cyan, justifyContent: 'center', alignItems: 'center', marginTop: 20 }, submitText: { color: colors.white, fontWeight: '900' } });
