import { useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { absoluteMediaUrl, apiRequest, apiUpload } from '../api';
import { colors, shadow } from '../theme';
import { X } from '../icons';
import { BackButton } from '../ui';

const labelOf = (value) => value?.uz || value?.name?.uz || value?.name || value || '';

export default function AddEquipmentScreen({ categories, token, user, initialItem, onLogin, onBack, onPublished }) {
  const [title, setTitle] = useState(initialItem?.title || '');
  const [description, setDescription] = useState(initialItem?.description || '');
  const [price, setPrice] = useState(initialItem?.price != null ? String(initialItem.price) : '');
  const [city, setCity] = useState(initialItem?.attributes?.region || initialItem?.city || initialItem?.location || '');
  const [phone, setPhone] = useState(initialItem?.phone || user?.phone || '');
  const [condition, setCondition] = useState(initialItem?.condition || 'used');
  const [stock, setStock] = useState(String(initialItem?.stockQuantity || '1'));
  const [saleMode, setSaleMode] = useState(initialItem?.saleMode || 'classified');
  const [level1, setLevel1] = useState(initialItem?.level1 || '');
  const [subcategory, setSubcategory] = useState(initialItem?.category || '');
  const [images, setImages] = useState([]);
  const existingImages = initialItem?.images || [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selectedCategory = categories.find((entry) => entry.id === level1);
  const subcategories = useMemo(() => selectedCategory?.subs || [], [selectedCategory]);

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: Math.max(1, 8 - images.length - existingImages.length), quality: 0.84 });
      if (!result.canceled) setImages((current) => [...current, ...result.assets].slice(0, 8));
    } catch { setError('Rasm tanlab bo‘lmadi. Ruxsatlarni tekshiring.'); }
  };

  const publish = async () => {
    if (!token) { onLogin(); return; }
    if ((!initialItem && !images.length) || title.trim().length < 3 || !level1 || !subcategory || price === '' || !city.trim() || phone.replace(/\D/g, '').length < 9) {
      setError(`${initialItem ? '' : 'Kamida bitta rasm qo‘shing; '}sarlavha, kategoriya, bo‘lim, narx, viloyat va telefonni to‘ldiring.`); return;
    }
    const parsedPrice = Number(price.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) { setError('Narxni 0 dan katta qilib kiriting.'); return; }
    const parsedStock = Number.parseInt(stock, 10);
    if (saleMode === 'store' && (!Number.isInteger(parsedStock) || parsedStock < 1)) { setError('Do‘kon uchun qoldiq kamida 1 dona bo‘lishi kerak.'); return; }
    setBusy(true); setError('');
    try {
      const body = {
        title: title.trim(), description: description.trim(), price: parsedPrice,
        phone: phone.trim(), condition: selectedCategory?.id === 'oziqovqat' ? 'new' : condition,
        level1, category: subcategory, currency: 'UZS', attributes: { region: city.trim(), negotiable: false },
        saleMode, ...(saleMode === 'store' ? { stockQuantity: parsedStock } : {}),
      };
      const created = initialItem
        ? await apiRequest(`/equipment/${encodeURIComponent(initialItem._id || initialItem.id)}`, { token, method: 'PUT', body })
        : await apiRequest('/equipment', { token, method: 'POST', body });
      let uploadWarning = '';
      const createdId = created?._id || created?.id || created?.data?._id || initialItem?._id || initialItem?.id;
      if (images.length && createdId) {
        try {
          const formData = new FormData();
          images.forEach((image, index) => {
            const name = image.fileName || `zumo-${Date.now()}-${index}.jpg`;
            if (Platform.OS === 'web' && image.file) formData.append('media', image.file, name);
            else formData.append('media', { uri: image.uri, name, type: image.mimeType || 'image/jpeg' });
          });
          await apiUpload(`/equipment/${encodeURIComponent(createdId)}/upload-media`, { token, formData });
        } catch (uploadError) { uploadWarning = ` E’lon joylandi, ammo rasmlar yuklanmadi: ${uploadError.message}`; }
      }
      Alert.alert(uploadWarning ? (initialItem ? 'E’lon yangilandi' : 'E’lon joylandi') : (initialItem ? 'O‘zgarishlar saqlandi' : 'E’loningiz joylandi'), uploadWarning || (initialItem ? 'E’lon ma’lumotlari yangilandi.' : 'E’lon marketplace’da ko‘rinadi.'), [{ text: 'Tushunarli', onPress: onPublished }]);
    } catch (err) { setError(err.message || 'E’lonni joylab bo‘lmadi.'); }
    finally { setBusy(false); }
  };

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.header}><BackButton onPress={onBack} /><Text style={styles.headerTitle}>{initialItem ? 'E’lonni tahrirlash' : 'Tovar e’loni'}</Text><View style={{ width: 42 }} /></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.kicker}>{initialItem ? 'E’LON MA’LUMOTI' : 'MARKETPLACE’GA JOYLASH'}</Text><Text style={styles.title}>{initialItem ? 'E’lonni yangilang' : 'Tovaringiz haqida'}</Text><Text style={styles.note}>Ma’lumotni to‘liq kiriting, xaridorlar e’loningizni oson topadi.</Text>
      <Text style={styles.label}>Rasmlar</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
        <Pressable onPress={pickImages} style={styles.addPhoto}><Text style={styles.addPhotoGlyph}>＋</Text><Text style={styles.addPhotoText}>Rasm qo‘shish</Text></Pressable>
        {existingImages.map((image, index) => <View key={`existing-${index}`} style={styles.photoBox}><Image source={{ uri: absoluteMediaUrl(image?.url || image) }} style={styles.photo} /></View>)}
        {images.map((image, index) => <View key={`${image.uri}-${index}`} style={styles.photoBox}><Image source={{ uri: image.uri }} style={styles.photo} /><Pressable onPress={() => setImages((current) => current.filter((_, i) => i !== index))} style={styles.removePhoto}><X color={colors.white} size={14} strokeWidth={2.6} /></Pressable></View>)}
      </ScrollView><Text style={styles.hint}>8 tagacha rasm tanlashingiz mumkin.</Text>
      <Text style={styles.label}>E’lon sarlavhasi</Text><TextInput value={title} onChangeText={setTitle} placeholder="Masalan: Samsung konditsioner" style={styles.field} placeholderTextColor="#91A2B2" maxLength={120} />
      <Text style={styles.label}>Kategoriya</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{categories.map((entry) => <Pressable key={entry.id} onPress={() => { setLevel1(entry.id); setSubcategory(''); }} style={[styles.chip, level1 === entry.id && styles.chipSelected]}><Text style={[styles.chipText, level1 === entry.id && styles.chipTextSelected]}>{labelOf(entry.short || entry.name)}</Text></Pressable>)}</ScrollView>
      {selectedCategory ? <><Text style={[styles.label, { marginTop: 12 }]}>Ichki bo‘lim</Text><View style={styles.subGrid}>{subcategories.map((entry) => <Pressable key={entry.id} onPress={() => setSubcategory(entry.id)} style={[styles.subChip, subcategory === entry.id && styles.chipSelected]}><Text style={[styles.subText, subcategory === entry.id && styles.chipTextSelected]}>{labelOf(entry.name)}</Text></Pressable>)}</View></> : null}
      <Text style={styles.label}>Sotuv turi</Text><View style={styles.modeRow}><Pressable onPress={() => setSaleMode('classified')} style={[styles.modeCard, saleMode === 'classified' && styles.modeActive]}><Text style={[styles.modeTitle, saleMode === 'classified' && styles.modeTitleActive]}>Oddiy e’lon</Text><Text style={styles.modeHint}>Xaridor siz bilan bog‘lanadi</Text></Pressable><Pressable onPress={() => setSaleMode('store')} style={[styles.modeCard, saleMode === 'store' && styles.modeActive]}><Text style={[styles.modeTitle, saleMode === 'store' && styles.modeTitleActive]}>Do‘kon mahsuloti</Text><Text style={styles.modeHint}>Savat va buyurtma bilan</Text></Pressable></View>
      {selectedCategory?.id !== 'oziqovqat' ? <><Text style={styles.label}>Holati</Text><View style={styles.modeRow}><Pressable onPress={() => setCondition('used')} style={[styles.conditionCard, condition === 'used' && styles.modeActive]}><Text style={[styles.modeTitle, condition === 'used' && styles.modeTitleActive]}>Ishlatilgan</Text></Pressable><Pressable onPress={() => setCondition('new')} style={[styles.conditionCard, condition === 'new' && styles.modeActive]}><Text style={[styles.modeTitle, condition === 'new' && styles.modeTitleActive]}>Yangi</Text></Pressable></View></> : null}
      {saleMode === 'store' ? <><Text style={styles.label}>Ombordagi soni</Text><TextInput value={stock} onChangeText={(value) => setStock(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" placeholder="1" style={styles.field} /></> : null}
      <Text style={styles.label}>Narxi (so‘m)</Text><TextInput value={price} onChangeText={(value) => setPrice(value.replace(/[^\d.,]/g, ''))} keyboardType="decimal-pad" placeholder="Masalan: 1 500 000" style={styles.field} placeholderTextColor="#91A2B2" />
      <Text style={styles.label}>Viloyat yoki shahar</Text><TextInput value={city} onChangeText={setCity} placeholder="Toshkent" style={styles.field} placeholderTextColor="#91A2B2" />
      <Text style={styles.label}>Telefon raqami</Text><TextInput value={phone} onChangeText={(value) => setPhone(value.slice(0, 20))} placeholder="+998 90 123 45 67" keyboardType="phone-pad" style={styles.field} placeholderTextColor="#91A2B2" />
      <Text style={styles.label}>Tavsif</Text><TextInput value={description} onChangeText={setDescription} placeholder="Holati, xususiyatlari va boshqa muhim ma’lumotlar" style={[styles.field, styles.multiline]} multiline textAlignVertical="top" placeholderTextColor="#91A2B2" maxLength={4000} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable disabled={busy} onPress={publish} style={[styles.submit, busy && { opacity: 0.6 }]}>{busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>{initialItem ? 'O‘zgarishlarni saqlash' : 'E’lonni joylash'}</Text>}</Pressable>
      <View style={{ height: 18 }} />
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, header: { height: 55, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.line }, back: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center' }, backGlyph: { color: colors.ink, fontSize: 35, marginTop: -4 }, headerTitle: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '800' }, content: { padding: 19, paddingBottom: 30 }, kicker: { color: colors.cyanDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginTop: 7 }, title: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 6 }, note: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }, label: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 17, marginBottom: 8 }, hint: { color: colors.muted, fontSize: 10, marginTop: 7 }, photoRow: { gap: 9, paddingRight: 8 }, addPhoto: { width: 82, height: 82, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9DCBD4', backgroundColor: '#E8F8FA', alignItems: 'center', justifyContent: 'center' }, addPhotoGlyph: { color: colors.cyanDark, fontSize: 27, lineHeight: 29 }, addPhotoText: { color: colors.cyanDark, fontSize: 9, fontWeight: '800', marginTop: 2 }, photoBox: { width: 82, height: 82, borderRadius: 15, overflow: 'hidden', position: 'relative' }, photo: { width: '100%', height: '100%' }, removePhoto: { position: 'absolute', top: 4, right: 4, width: 23, height: 23, borderRadius: 12, backgroundColor: 'rgba(12,28,44,.8)', alignItems: 'center', justifyContent: 'center' }, removePhotoText: { color: colors.white, fontSize: 18, lineHeight: 20 }, field: { minHeight: 49, borderRadius: 13, borderWidth: 1, borderColor: '#DDE7EE', backgroundColor: colors.white, paddingHorizontal: 13, color: colors.ink, fontSize: 13 }, chipRow: { gap: 8, paddingRight: 10 }, chip: { minHeight: 37, borderRadius: 13, backgroundColor: colors.white, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line }, chipSelected: { backgroundColor: colors.cyan, borderColor: colors.cyan }, chipText: { color: colors.ink, fontSize: 11, fontWeight: '700' }, chipTextSelected: { color: colors.white, fontWeight: '800' }, subGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, subChip: { maxWidth: '49%', minHeight: 36, borderRadius: 12, backgroundColor: colors.white, paddingHorizontal: 11, justifyContent: 'center', borderWidth: 1, borderColor: colors.line }, subText: { color: colors.ink, fontSize: 10, fontWeight: '700' }, modeRow: { flexDirection: 'row', gap: 8 }, modeCard: { flex: 1, minHeight: 68, borderRadius: 14, padding: 11, justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }, conditionCard: { flex: 1, minHeight: 48, borderRadius: 14, padding: 11, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }, modeActive: { backgroundColor: '#E4F8FA', borderColor: colors.cyan }, modeTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' }, modeTitleActive: { color: colors.cyanDark }, modeHint: { color: colors.muted, fontSize: 9, marginTop: 4 }, multiline: { minHeight: 95, paddingTop: 12 }, error: { color: colors.red, fontSize: 12, lineHeight: 17, marginTop: 12 }, submit: { minHeight: 52, borderRadius: 15, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center', marginTop: 18, ...shadow }, submitText: { color: colors.white, fontWeight: '900', fontSize: 14 },
});
