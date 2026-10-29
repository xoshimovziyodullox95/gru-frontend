import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { requestPhoneCode, verifyPhoneCode, apiRequest, SESSION_KEY } from '../api';
import { colors, shadow } from '../theme';
import { Bell, Boxes, ClipboardList, Heart, Inbox, MapPin, Package, Settings, ShieldCheck, ShoppingBag, Sparkles, Wrench } from '../icons';
import { Chevron, IconTile } from '../ui';

export default function ProfileScreen({ token, user, onLogin, onLogout, onNavigateAccount }) {
  const [digits, setDigits] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    apiRequest('/user/profile', { token }).then((profile) => onLogin(token, profile?.data || profile?.user || profile)).catch(() => {});
  }, [token, onLogin]);

  const sendCode = async () => {
    if (digits.length !== 9 || loading) return;
    setLoading(true); setError('');
    try {
      await requestPhoneCode(`+998${digits}`);
      setStep('code');
    } catch (err) { setError(err.message || 'SMS yuborilmadi. Raqamni tekshiring.'); }
    finally { setLoading(false); }
  };

  const confirmCode = async () => {
    if (code.length !== 6 || loading) return;
    setLoading(true); setError('');
    try {
      const session = await verifyPhoneCode(`+998${digits}`, code);
      if (!session.access_token) throw new Error('Kirish sessiyasi olinmadi. Qayta urinib ko‘ring.');
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      const profile = await apiRequest('/user/profile', { token: session.access_token }).catch(() => null);
      onLogin(session.access_token, profile?.data || profile?.user || profile || session.user);
    } catch (err) { setError(err.message || 'Kod tasdiqlanmadi.'); }
    finally { setLoading(false); }
  };

  if (token) {
    const name = user?.fullName || user?.full_name || user?.name || user?.email || 'ZUMO foydalanuvchisi';
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>SHAXSIY KABINET</Text><Text style={styles.title}>Profil</Text>
        <View style={styles.userCard}><View style={styles.avatar}><Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.userText}><Text style={styles.name}>{name}</Text><Text style={styles.role}>{user?.role || 'Foydalanuvchi'}</Text></View></View>
        {[
          [Package, 'Mening e’lonlarim', 'E’lonlarni boshqarish'],
          [MapPin, 'Joy e’lonlarim', 'Ijara va sotuvdagi joylarni boshqarish'],
          [ShoppingBag, 'Buyurtmalarim', 'Buyurtma holatini kuzatish'],
          [Inbox, 'Kelgan buyurtmalar', 'Yangi buyurtmalarni qabul qilish'],
          [Heart, 'Saqlanganlar', 'Tanlangan e’lonlar'],
          [Bell, 'Bildirishnomalar', 'Muhim yangiliklar va xabarlar'],
          [Wrench, 'Mening xizmat so‘rovlarim', 'Usta chaqirish va kelgan takliflar'],
          [ClipboardList, 'Ustaga kelgan so‘rovlar', 'Mijozlarga narx taklif qiling'],
          [Settings, 'Sozlamalar', 'Bildirishnoma sozlamalarini boshqarish'],
          [Boxes, 'ZUMO Biznes', 'Do‘kon, qoldiq va sotuv hisobini yuritish'],
          [Sparkles, 'ZUMO AI yordamchisi', 'Savol bering va maslahat oling'],
        ].map(([icon, label, hint], index) => <Pressable key={label} onPress={() => onNavigateAccount?.(['listings', 'locations', 'orders', 'received-orders', 'saved', 'notifications', 'my-service-requests', 'provider-requests', 'settings', 'business', 'ai'][index])} style={styles.menuRow}><IconTile icon={icon} size={40} iconSize={19} style={{ marginRight: 12 }} /><View style={styles.menuText}><Text style={styles.menuTitle}>{label}</Text><Text style={styles.menuHint}>{hint}</Text></View><Chevron /></Pressable>)}
        {user?.role === 'admin' ? <Pressable onPress={() => onNavigateAccount?.('admin')} style={styles.menuRow}><IconTile icon={ShieldCheck} size={40} iconSize={19} style={{ marginRight: 12 }} /><View style={styles.menuText}><Text style={styles.menuTitle}>Admin panel</Text><Text style={styles.menuHint}>Platforma statistikasi va foydalanuvchilar</Text></View><Chevron /></Pressable> : null}
        <Pressable style={styles.logout} onPress={onLogout}><Text style={styles.logoutText}>Tizimdan chiqish</Text></Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
      <View style={styles.authIcon}><Text style={styles.authIconText}>Z</Text></View>
      <Text style={styles.title}>ZUMO’ga xush kelibsiz</Text>
      <Text style={styles.subtitle}>Telefon raqamingiz orqali kirib, e’lonlar va xizmatlardan foydalaning.</Text>
      <View style={styles.form}>
        {step === 'phone' ? <>
          <Text style={styles.label}>Telefon raqami</Text>
          <View style={styles.phoneField}><Text style={styles.country}>🇺🇿 +998</Text><TextInput value={digits} onChangeText={(value) => setDigits(value.replace(/\D/g, '').slice(0, 9))} placeholder="90 123 45 67" keyboardType="phone-pad" style={styles.input} placeholderTextColor="#9BAAB8" /></View>
          <Text style={styles.privacy}>Sizga 6 xonali tasdiqlash kodi SMS orqali yuboriladi.</Text>
          <Pressable disabled={digits.length !== 9 || loading} onPress={sendCode} style={[styles.primary, (digits.length !== 9 || loading) && styles.disabled]}>{loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>SMS kod yuborish</Text>}</Pressable>
        </> : <>
          <Text style={styles.label}>Tasdiqlash kodi</Text><Text style={styles.subtitle}>+998 {digits} raqamiga yuborilgan kodni kiriting.</Text>
          <TextInput value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" keyboardType="number-pad" style={[styles.input, styles.codeInput]} placeholderTextColor="#9BAAB8" maxLength={6} />
          <Pressable disabled={code.length !== 6 || loading} onPress={confirmCode} style={[styles.primary, (code.length !== 6 || loading) && styles.disabled]}>{loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Tasdiqlash va kirish</Text>}</Pressable>
          <Pressable onPress={() => { setStep('phone'); setCode(''); setError(''); }} style={styles.editPhone}><Text style={styles.editPhoneText}>Telefon raqamini o‘zgartirish</Text></Pressable>
        </>}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 20, paddingBottom: 32 }, authContent: { flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'stretch' }, kicker: { color: colors.cyanDark, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginTop: 8 }, title: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 8 }, subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8 }, userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 17, borderRadius: 19, marginTop: 20, marginBottom: 10, ...shadow }, avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#DDF5F8', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.cyanDark, fontWeight: '900', fontSize: 22 }, userText: { marginLeft: 13 }, name: { color: colors.ink, fontWeight: '800', fontSize: 15 }, role: { color: colors.muted, fontSize: 11, marginTop: 4 }, menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 15, paddingHorizontal: 14, paddingVertical: 13, marginTop: 8 }, menuIcon: { width: 28, color: colors.cyanDark, fontSize: 21 }, menuText: { flex: 1 }, menuTitle: { color: colors.ink, fontWeight: '700', fontSize: 13 }, menuHint: { color: colors.muted, fontSize: 10, marginTop: 3 }, arrow: { color: colors.muted, fontSize: 24 }, logout: { alignItems: 'center', padding: 15, marginTop: 18, borderRadius: 14, backgroundColor: '#FFF0F1' }, logoutText: { color: colors.red, fontWeight: '800' }, authIcon: { alignSelf: 'center', width: 68, height: 68, borderRadius: 23, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginBottom: 22 }, authIconText: { color: colors.cyan, fontSize: 39, fontWeight: '900' }, form: { marginTop: 25, padding: 18, backgroundColor: colors.white, borderRadius: 20, ...shadow }, label: { color: colors.ink, fontSize: 13, fontWeight: '800', marginBottom: 9 }, phoneField: { height: 52, flexDirection: 'row', alignItems: 'center', borderRadius: 13, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12 }, country: { color: colors.ink, fontWeight: '700', fontSize: 13, marginRight: 10 }, input: { flex: 1, color: colors.ink, fontSize: 16, padding: 0 }, privacy: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 10 }, primary: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.cyan, marginTop: 17 }, primaryText: { color: colors.white, fontSize: 14, fontWeight: '900' }, disabled: { opacity: 0.45 }, error: { color: colors.red, fontSize: 12, lineHeight: 17, marginTop: 12 }, codeInput: { height: 54, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 15, textAlign: 'center', letterSpacing: 10, fontWeight: '900', fontSize: 23, marginTop: 14 }, editPhone: { alignItems: 'center', marginTop: 15 }, editPhoneText: { color: colors.cyanDark, fontWeight: '700', fontSize: 12 },
});
