import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { io } from 'socket.io-client';
import { API_URL, apiRequest, unwrapArray } from '../api';
import { colors } from '../theme';
import { MessageCircle, Send } from '../icons';
import { BackButton, Chevron, IconTile } from '../ui';

const pickName = (item) => item?.fullName || item?.full_name || item?.name || item?.user?.fullName || item?.user?.name || 'Suhbat';
const pickPreview = (item) => item?.lastMessage?.text || item?.lastMessage?.content || item?.last_message?.text || item?.lastMessage || 'Xabarlar shu yerda ko‘rinadi';
const parseSharedListing = (message) => {
  if (typeof message !== 'string' || !message.startsWith('LISTING::')) return null;
  const fields = message.slice('LISTING::'.length).split('::');
  const decode = (value) => { try { return decodeURIComponent(value || ''); } catch { return value || ''; } };
  // Legacy native messages used type::id::title. Web messages use type::url::title::image::price::note.
  if (fields.length <= 3 && !String(fields[1] || '').includes('/')) {
    const [type, id, encodedTitle] = fields;
    return id ? { type, id, title: decode(encodedTitle) || 'Ulashilgan e’lon' } : null;
  }
  const [type, encodedUrl, encodedTitle, encodedThumbnail, encodedPrice] = fields;
  const url = decode(encodedUrl);
  const match = url.match(/\/(equipment|location|service-provider)\/([^/?#]+)/i);
  if (!match) return null;
  const routeType = match[1].toLowerCase();
  const normalizedType = routeType === 'service-provider' ? 'serviceprovider' : routeType;
  return {
    type: normalizedType || decode(type),
    id: decode(match[2]),
    title: decode(encodedTitle) || 'Ulashilgan e’lon',
    thumbnail: decode(encodedThumbnail),
    price: decode(encodedPrice),
  };
};

export default function ChatScreen({ token, onLogin, target, currentUserId, onOpenConversation, onBackToChats, onOpenSharedListing }) {
  const [items, setItems] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(Boolean(token));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback((showLoading = true) => {
    if (!token) return;
    if (showLoading) { setLoading(true); setError(''); }
    apiRequest('/chat/conversations', { token })
      .then((response) => setItems(unwrapArray(response?.conversations || response?.data?.conversations || response)))
      .catch((err) => setError(err.message || 'Suhbatlarni yuklab bo‘lmadi.'))
      .finally(() => { if (showLoading) setLoading(false); });
  }, [token]);
  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    apiRequest('/chat/conversations', { token })
      .then((response) => { if (active) setItems(unwrapArray(response?.conversations || response?.data?.conversations || response)); })
      .catch((err) => { if (active) setError(err.message || 'Suhbatlarni yuklab bo‘lmadi.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);
  useEffect(() => {
    if (!token || !target?.userId) return undefined;
    let active = true;
    apiRequest(`/chat/messages/${encodeURIComponent(target.userId)}?limit=100`, { token })
      .then((response) => { if (active) setMessages(unwrapArray(response)); })
      .catch((err) => { if (active) setError(err.message || 'Xabarlarni yuklab bo‘lmadi.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, target?.userId]);
  useEffect(() => {
    if (!token) return undefined;
    const socket = io(API_URL.replace(/\/api\/?$/, ''), { auth: { token }, transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: 10 });
    const receive = (message) => {
      const from = message?.from?._id || message?.from?.id || message?.from;
      if (target?.userId && String(from) === String(target.userId)) {
        setMessages((previous) => previous.some((entry) => String(entry._id || entry.id) === String(message._id || message.id)) ? previous : [...previous, message]);
      }
      load(false);
    };
    socket.on('receive_message', receive);
    return () => { socket.off('receive_message', receive); socket.disconnect(); };
  }, [token, target?.userId, load]);
  const send = async () => {
    if (!draft.trim() || !target?.userId || sending) return;
    const message = draft.trim(); setSending(true); setError('');
    try {
      const sent = await apiRequest('/chat/send', { token, method: 'POST', body: { to: target.userId, message } });
      setMessages((previous) => [...previous, sent]); setDraft('');
    } catch (err) { setError(err.message || 'Xabar yuborilmadi.'); }
    finally { setSending(false); }
  };
  if (!token) return <View style={styles.center}><IconTile icon={MessageCircle} size={64} iconSize={30} style={{ marginBottom: 6 }} /><Text style={styles.title}>Xabarlaringiz bir joyda</Text><Text style={styles.note}>Sotuvchi, usta va xaridorlar bilan yozishish uchun tizimga kiring.</Text><Pressable onPress={onLogin} style={styles.button}><Text style={styles.buttonText}>Telefon orqali kirish</Text></Pressable></View>;
  if (target?.userId) return <View style={styles.conversation}><View style={styles.conversationHead}><BackButton onPress={onBackToChats} /><View><Text style={styles.name}>{target.fullName || 'Suhbat'}</Text><Text style={styles.note}>ZUMO chat</Text></View></View>
    <ScrollView style={styles.messages} contentContainerStyle={styles.messageList}>
      {loading ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 24 }} /> : null}
      {messages.map((message, index) => {
        const fromId = message.from?._id || message.from?.id || message.from;
        const mine = String(fromId) === String(currentUserId) || message.isMine;
        const shared = parseSharedListing(message.message || message.text);
        return shared
          ? <Pressable key={message._id || message.id || index} onPress={() => onOpenSharedListing?.(shared)} style={[styles.sharedCard, mine ? styles.mineShared : styles.theirsShared]}>
            {shared.thumbnail ? <Image source={{ uri: shared.thumbnail }} style={styles.sharedImage} resizeMode="cover" /> : null}
            <View style={styles.sharedInfo}><Text style={styles.sharedEyebrow}>ZUMO · {shared.type === 'serviceprovider' ? 'XIZMAT' : 'E’LON'}</Text><Text style={styles.sharedTitle}>{shared.title}</Text>{shared.price ? <Text style={styles.sharedPrice}>{shared.price}</Text> : null}<Text style={styles.sharedHint}>E’lonni ko‘rish →</Text></View>
          </Pressable>
          : <View key={message._id || message.id || index} style={[styles.bubble, mine ? styles.mine : styles.theirs]}><Text style={[styles.messageText, mine && styles.mineText]}>{message.message || message.text}</Text></View>;
      })}
      {!loading && !messages.length ? <Text style={styles.emptyChat}>Suhbat boshlandi. Xabar yuboring.</Text> : null}
    </ScrollView>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
    <View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Xabar yozing..." placeholderTextColor="#90A1B1" style={styles.composerInput} multiline /><Pressable onPress={send} disabled={!draft.trim() || sending} style={[styles.sendButton, (!draft.trim() || sending) && { opacity: 0.5 }]}><Send color={colors.white} size={18} strokeWidth={2.2} /></Pressable></View>
  </View>;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Chatlar</Text><Text style={styles.note}>E’lon va xizmatlar bo‘yicha suhbatlaringiz</Text>
      {loading ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 30 }} /> : null}
      {error ? <Pressable onPress={load} style={styles.error}><Text style={styles.errorText}>{error} · Qayta yuklash</Text></Pressable> : null}
      {!loading && !error && !items.length ? <View style={styles.empty}><IconTile icon={MessageCircle} size={64} iconSize={30} style={{ marginBottom: 6 }} /><Text style={styles.emptyTitle}>Hali suhbat yo‘q</Text><Text style={styles.note}>E’lon egasiga yozganingizdan keyin chat shu yerda chiqadi.</Text></View> : null}
      {items.map((item, index) => <Pressable key={item.userId || item._id || item.id || index} onPress={() => onOpenConversation?.({ userId: item.userId || item._id || item.id, fullName: pickName(item) })} style={styles.row}><View style={styles.avatar}><Text style={styles.avatarText}>{pickName(item).slice(0, 1).toUpperCase()}</Text></View><View style={styles.rowText}><Text style={styles.name}>{pickName(item)}</Text><Text style={styles.preview} numberOfLines={1}>{pickPreview(item)}</Text></View><Chevron /></Pressable>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 20, paddingBottom: 30 }, center: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }, title: { color: colors.ink, fontSize: 24, fontWeight: '900' }, note: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 7 }, icon: { color: colors.cyan, fontSize: 38, marginBottom: 12 }, button: { marginTop: 18, backgroundColor: colors.cyan, borderRadius: 15, paddingVertical: 14, paddingHorizontal: 20 }, buttonText: { color: colors.white, fontWeight: '800' }, empty: { marginTop: 40, backgroundColor: colors.white, borderRadius: 20, padding: 24, alignItems: 'center' }, emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' }, row: { backgroundColor: colors.white, borderRadius: 17, padding: 13, marginTop: 10, flexDirection: 'row', alignItems: 'center' }, avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DFF5F8', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.cyanDark, fontWeight: '900', fontSize: 19 }, rowText: { flex: 1, marginLeft: 12 }, name: { color: colors.ink, fontSize: 14, fontWeight: '800' }, preview: { color: colors.muted, marginTop: 4, fontSize: 12 }, arrow: { color: colors.muted, fontSize: 24 }, error: { padding: 13, backgroundColor: '#FFF0F1', borderRadius: 12, marginTop: 16 }, errorText: { color: colors.red, textAlign: 'center', fontSize: 12 }, conversation: { flex: 1, backgroundColor: colors.canvas }, conversationHead: { minHeight: 62, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.line }, headBack: { width: 45, height: 45, alignItems: 'center', justifyContent: 'center' }, messages: { flex: 1 }, messageList: { padding: 16, gap: 9 }, bubble: { maxWidth: '82%', borderRadius: 17, paddingVertical: 10, paddingHorizontal: 13 }, mine: { alignSelf: 'flex-end', backgroundColor: colors.cyan }, theirs: { alignSelf: 'flex-start', backgroundColor: colors.white }, messageText: { color: colors.ink, fontSize: 13, lineHeight: 19 }, mineText: { color: colors.white }, sharedCard: { maxWidth: '85%', borderRadius: 16, overflow: 'hidden', borderWidth: 1 }, sharedImage: { width: 250, height: 145, backgroundColor: colors.line }, sharedInfo: { padding: 13 }, mineShared: { alignSelf: 'flex-end', backgroundColor: '#E5F9FB', borderColor: '#BCEAF0' }, theirsShared: { alignSelf: 'flex-start', backgroundColor: colors.white, borderColor: colors.line }, sharedEyebrow: { color: colors.cyanDark, fontSize: 9, letterSpacing: 1, fontWeight: '900' }, sharedTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 5 }, sharedPrice: { color: colors.cyanDark, fontSize: 12, fontWeight: '800', marginTop: 5 }, sharedHint: { color: colors.cyanDark, fontSize: 11, fontWeight: '800', marginTop: 8 }, emptyChat: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 25 }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, backgroundColor: colors.white }, composerInput: { flex: 1, minHeight: 44, maxHeight: 110, borderRadius: 16, backgroundColor: colors.canvas, paddingHorizontal: 13, paddingTop: 12, paddingBottom: 9, color: colors.ink, fontSize: 14 }, sendButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center' }, sendText: { color: colors.white, fontSize: 20, fontWeight: '900' },
});
