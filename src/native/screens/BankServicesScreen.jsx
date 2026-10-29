import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiRequest, unwrapArray } from '../api';
import { colors, shadow } from '../theme';
import bankLogo from '../../../public/images/logo/universalbank.jpg';
import { BackButton, Chevron } from '../ui';

const idOf = (item) => String(item?._id || item?.id || '');
export default function BankServicesScreen({ token, onBack, onLogin }) {
  const [services, setServices] = useState([]); const [selected, setSelected] = useState(null);
  const [phone, setPhone] = useState(''); const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const load = () => { setLoading(true); setError(''); apiRequest('/services?category=bank_service').then((value) => setServices(unwrapArray(value))).catch((err) => setError(err.message || 'Bank xizmatlarini yuklab bo‘lmadi.')).finally(() => setLoading(false)); };
  useEffect(() => {
    let active = true;
    apiRequest('/services?category=bank_service').then((value) => { if (active) setServices(unwrapArray(value)); }).catch((err) => { if (active) setError(err.message || 'Bank xizmatlarini yuklab bo‘lmadi.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const apply = async () => {
    if (!token) return onLogin?.();
    if (!phone.trim() || busy || !selected) return;
    setBusy(true); setError(''); setSuccess('');
    try { const result = await apiRequest('/bank-applications', { token, method: 'POST', body: { serviceId: idOf(selected), phone: phone.trim(), comment: comment.trim() } }); setSuccess(result?.duplicate ? 'Siz bu xizmatga avval ariza yuborgansiz.' : 'Arizangiz yuborildi. Bank vakili siz bilan bog‘lanadi.'); setComment(''); }
    catch (err) { setError(err.message || 'Ariza yuborilmadi.'); }
    finally { setBusy(false); }
  };
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><BackButton onPress={selected ? () => { setSelected(null); setSuccess(''); } : onBack} /><View><Text style={styles.title}>{selected ? selected.serviceName : 'Bank xizmatlari'}</Text><Text style={styles.subtitle}>{selected ? selected.provider : 'Xizmatni tanlang va shartlari bilan tanishing'}</Text></View></View>
    {error ? <Pressable style={styles.error} onPress={load}><Text style={styles.errorText}>{error} · Qayta yuklash</Text></Pressable> : null}
    {loading ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 32 }} /> : selected ? <View style={styles.card}><Image source={bankLogo} style={styles.detailLogo} resizeMode="contain" /><Text style={styles.heading}>{selected.serviceName}</Text><Text style={styles.description}>{selected.description || 'Xizmat shartlari bo‘yicha bank bilan bog‘laning.'}</Text>{selected.commission ? <Text style={styles.info}>Komissiya: {selected.commission}</Text> : null}<Text style={styles.label}>Telefon raqamingiz</Text><TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+998 90 123 45 67" style={styles.input} placeholderTextColor={colors.muted} /><TextInput value={comment} onChangeText={setComment} placeholder="Izoh yoki savol (ixtiyoriy)" multiline style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholderTextColor={colors.muted} />{success ? <Text style={styles.success}>{success}</Text> : null}<Pressable disabled={!phone.trim() || busy} onPress={apply} style={[styles.primary, (!phone.trim() || busy) && { opacity: 0.5 }]}><Text style={styles.primaryText}>{busy ? 'Yuborilmoqda…' : 'Ariza yuborish'}</Text></Pressable><Text style={styles.disclaimer}>Ariza yuborish kredit yoki boshqa bank xizmatini avtomatik rasmiylashtirmaydi. Bank sizga shartlarni tushuntiradi.</Text></View> : services.length ? services.map((item) => <Pressable key={idOf(item)} onPress={() => setSelected(item)} style={styles.row}><Image source={bankLogo} style={styles.bankIcon} resizeMode="cover" /><View style={{ flex: 1 }}><Text style={styles.heading}>{item.serviceName || item.title}</Text><Text numberOfLines={2} style={styles.description}>{item.provider || ''}{item.description ? ` · ${item.description}` : ''}</Text></View><Chevron /></Pressable>) : <View style={styles.card}><Text style={styles.heading}>Hozircha xizmat yo‘q</Text><Text style={styles.description}>Bank xizmatlari keyinroq qo‘shiladi.</Text></View>}
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 18, paddingBottom: 36 }, header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }, back: { width: 38, height: 42, justifyContent: 'center' }, backText: { color: colors.ink, fontSize: 32 }, title: { color: colors.ink, fontSize: 21, fontWeight: '900' }, subtitle: { color: colors.muted, fontSize: 11, marginTop: 3 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.white, borderRadius: 15, marginTop: 9, ...shadow }, bankIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#E1F7F9' }, detailLogo: { width: 118, height: 60, marginBottom: 12, alignSelf: 'center' }, heading: { color: colors.ink, fontSize: 14, fontWeight: '800' }, description: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 }, chevron: { color: colors.muted, fontSize: 25 }, card: { padding: 17, borderRadius: 17, backgroundColor: colors.white, ...shadow }, info: { color: colors.cyanDark, fontSize: 12, fontWeight: '700', marginTop: 10 }, label: { color: colors.ink, fontWeight: '700', fontSize: 12, marginTop: 18 }, input: { minHeight: 46, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, marginTop: 9, color: colors.ink, backgroundColor: '#FAFCFD' }, primary: { minHeight: 48, borderRadius: 13, backgroundColor: colors.cyan, justifyContent: 'center', alignItems: 'center', marginTop: 12 }, primaryText: { color: colors.white, fontWeight: '800' }, disclaimer: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 12 }, error: { backgroundColor: '#FFF0F1', padding: 12, borderRadius: 12 }, errorText: { color: colors.red, fontSize: 12 }, success: { color: '#11834A', fontSize: 12, lineHeight: 17, marginTop: 12 } });
