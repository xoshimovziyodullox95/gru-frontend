import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiUpload } from '../api';
import { colors } from '../theme';
import { Video } from '../icons';
import { BackButton, IconTile } from '../ui';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export default function CreateVideoScreen({ token, onLogin, onBack, onCreated }) {
  const [video, setVideo] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const chooseVideo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { setError('Video tanlash uchun galereyaga ruxsat bering.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], allowsMultipleSelection: false, videoMaxDuration: 180, videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      if (asset.fileSize > MAX_VIDEO_BYTES) { setError('Video hajmi 100 MB dan oshmasligi kerak.'); return; }
      if (asset.mimeType && !['video/mp4', 'video/webm', 'video/quicktime'].includes(asset.mimeType)) { setError('MP4, WebM yoki MOV video tanlang.'); return; }
      setVideo(asset); setError('');
    } catch (err) { setError(err.message || 'Videoni tanlab bo‘lmadi.'); }
  };
  const submit = async () => {
    if (!token) return onLogin?.();
    if (!video) { setError('Avval videoni tanlang.'); return; }
    setBusy(true); setError('');
    try {
      const formData = new FormData();
      formData.append('video', Platform.OS === 'web' && video.file ? video.file : { uri: video.uri, name: video.fileName || `zumo-${Date.now()}.mp4`, type: video.mimeType || 'video/mp4' });
      formData.append('title', title.trim() || 'Video');
      formData.append('description', description.trim());
      await apiUpload('/posts', { token, formData });
      Alert.alert('Video joylandi', 'Video postingiz muvaffaqiyatli qo‘shildi.', [{ text: 'Ko‘rish', onPress: onCreated }]);
    } catch (err) { setError(err.message || 'Videoni joylab bo‘lmadi.'); }
    finally { setBusy(false); }
  };
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><BackButton onPress={onBack} /><Text style={styles.headerTitle}>Video post</Text></View>
    <Text style={styles.title}>Ishingizni video bilan ko‘rsating</Text><Text style={styles.note}>MP4, WebM yoki MOV · 100 MB gacha · 3 daqiqagacha</Text>
    <Pressable onPress={chooseVideo} style={styles.picker}><IconTile icon={Video} size={60} iconSize={28} /><Text style={styles.pickerTitle}>{video?.fileName || 'Galereyadan video tanlash'}</Text><Text style={styles.pickerNote}>{video ? `${Math.round((video.fileSize || 0) / 1024 / 1024)} MB` : 'Videoni tanlash uchun bosing'}</Text></Pressable>
    <Text style={styles.label}>Sarlavha (ixtiyoriy)</Text><TextInput value={title} onChangeText={setTitle} maxLength={80} placeholder="Masalan: Konditsioner o‘rnatish jarayoni" style={styles.field} placeholderTextColor="#90A1B1" />
    <Text style={styles.label}>Izoh (ixtiyoriy)</Text><TextInput value={description} onChangeText={setDescription} maxLength={500} multiline textAlignVertical="top" placeholder="Video haqida qisqacha yozing" style={[styles.field, styles.multiline]} placeholderTextColor="#90A1B1" />
    {error ? <Text style={styles.error}>{error}</Text> : null}<Pressable onPress={submit} disabled={busy} style={[styles.submit, busy && { opacity: .6 }]}>{busy ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>Video postni joylash</Text>}</Pressable>
  </ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 18, paddingBottom: 32 }, header: { minHeight: 45, flexDirection: 'row', alignItems: 'center' }, back: { width: 42 }, backText: { color: colors.ink, fontSize: 34 }, headerTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' }, title: { color: colors.ink, fontSize: 23, lineHeight: 29, fontWeight: '900', marginTop: 10 }, note: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }, picker: { minHeight: 175, marginTop: 20, borderRadius: 19, borderWidth: 1, borderStyle: 'dashed', borderColor: '#99CBD4', backgroundColor: '#E7F7F9', alignItems: 'center', justifyContent: 'center', padding: 20 }, videoGlyph: { color: colors.cyanDark, fontSize: 32 }, pickerTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 10, textAlign: 'center' }, pickerNote: { color: colors.muted, fontSize: 11, marginTop: 5 }, label: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 16, marginBottom: 7 }, field: { minHeight: 49, borderWidth: 1, borderColor: colors.line, borderRadius: 13, backgroundColor: colors.white, color: colors.ink, paddingHorizontal: 13 }, multiline: { minHeight: 105, paddingTop: 12 }, error: { color: colors.red, fontSize: 12, marginTop: 12 }, submit: { minHeight: 52, borderRadius: 15, backgroundColor: colors.cyan, justifyContent: 'center', alignItems: 'center', marginTop: 20 }, submitText: { color: colors.white, fontWeight: '900' } });
