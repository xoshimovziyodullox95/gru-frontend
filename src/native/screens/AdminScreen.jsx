import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiRequest, unwrapArray } from '../api';
import { colors, shadow } from '../theme';
import { BackButton } from '../ui';

export default function AdminScreen({ token, user, onBack }) {
  const [stats, setStats] = useState(null); const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const [statistics, userList] = await Promise.all([apiRequest('/admin/statistics', { token }), apiRequest('/admin/users', { token })]); setStats(statistics?.data || statistics); setUsers(unwrapArray(userList)); }
    catch (err) { setError(err.message || 'Admin ma’lumotlarini yuklab bo‘lmadi.'); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => {
    let active = true;
    Promise.all([apiRequest('/admin/statistics', { token }), apiRequest('/admin/users', { token })]).then(([statistics, userList]) => {
      if (!active) return;
      setStats(statistics?.data || statistics); setUsers(unwrapArray(userList));
    }).catch((err) => { if (active) setError(err.message || 'Admin ma’lumotlarini yuklab bo‘lmadi.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);
  if (user?.role !== 'admin') return <View style={styles.center}><Text style={styles.title}>Ruxsat yo‘q</Text><Text style={styles.note}>Bu bo‘lim faqat administrator uchun.</Text><Pressable onPress={onBack} style={styles.button}><Text style={styles.buttonText}>Orqaga</Text></Pressable></View>;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><View style={styles.header}><BackButton onPress={onBack} /><Text style={styles.title}>Admin panel</Text><Pressable onPress={load}><Text style={styles.refresh}>Yangilash</Text></Pressable></View>{error ? <Pressable onPress={load} style={styles.error}><Text style={styles.errorText}>{error} · Qayta urinish</Text></Pressable> : null}{loading ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 24 }} /> : <><View style={styles.stats}>{[['Foydalanuvchi', stats?.totalUsers], ['E’lon', stats?.totalEquipment], ['Joy', stats?.totalLocations], ['Loyiha so‘rovi', stats?.totalTurnkey]].map(([label, value]) => <View key={label} style={styles.stat}><Text style={styles.note}>{label}</Text><Text style={styles.number}>{Number(value) || 0}</Text></View>)}</View><Text style={styles.section}>Oxirgi ro‘yxatdagi foydalanuvchilar</Text>{users.slice(-50).reverse().map((item) => <View key={String(item._id || item.id)} style={styles.row}><View style={{ flex: 1 }}><Text style={styles.name}>{item.fullName || item.name || item.phone || item.email || 'Foydalanuvchi'}</Text><Text style={styles.note}>{item.phone || item.email || 'Aloqa ma’lumoti yo‘q'}</Text></View><Text style={styles.role}>{item.role || 'user'}</Text></View>)}</>}</ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 18, paddingBottom: 35 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.canvas }, header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 }, back: { width: 40, height: 42, justifyContent: 'center' }, backText: { color: colors.ink, fontSize: 32 }, title: { flex: 1, color: colors.ink, fontSize: 22, fontWeight: '900' }, refresh: { color: colors.cyanDark, fontSize: 12, fontWeight: '800' }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, stat: { width: '48%', backgroundColor: colors.white, borderRadius: 15, padding: 14, ...shadow }, number: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 7 }, section: { color: colors.ink, fontWeight: '900', fontSize: 15, marginTop: 22 }, row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 13, padding: 13, marginTop: 8 }, name: { color: colors.ink, fontWeight: '700', fontSize: 12 }, note: { color: colors.muted, fontSize: 10, marginTop: 4 }, role: { color: colors.cyanDark, fontSize: 10, fontWeight: '800' }, button: { backgroundColor: colors.cyan, padding: 13, borderRadius: 12, marginTop: 14 }, buttonText: { color: colors.white, fontWeight: '800' }, error: { backgroundColor: '#FFF0F1', padding: 12, borderRadius: 12 }, errorText: { color: colors.red, fontSize: 12 } });
