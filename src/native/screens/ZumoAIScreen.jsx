import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiRequest, apiUpload, unwrapArray } from '../api';
import { colors } from '../theme';
import { Send, Sparkles } from '../icons';
import { BackButton, Chevron } from '../ui';

export default function ZumoAIScreen({ token, onLogin, onBack }) {
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadChats = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true); setError('');
    try { const data = await apiRequest('/gru-ai/chats', { token }); setChats(unwrapArray(data?.chats || data)); }
    catch (err) { setError(err.message || 'AI suhbatlarini yuklab bo‘lmadi.'); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    apiRequest('/gru-ai/chats', { token })
      .then((data) => { if (active) setChats(unwrapArray(data?.chats || data)); })
      .catch((err) => { if (active) setError(err.message || 'AI suhbatlarini yuklab bo‘lmadi.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const openChat = async (id) => {
    setActiveId(id); setMessages([]); setError('');
    try { const data = await apiRequest(`/gru-ai/chats/${encodeURIComponent(id)}`, { token }); setMessages(data?.messages || []); }
    catch (err) { setError(err.message || 'Suhbatni ochib bo‘lmadi.'); }
  };
  const newChat = async () => {
    setBusy(true); setError('');
    try { const data = await apiRequest('/gru-ai/chats', { token, method: 'POST', body: {} }); const id = data?._id || data?.chat?._id; if (!id) throw new Error('Yangi suhbat ochilmadi.'); setActiveId(id); setMessages([]); await loadChats(); }
    catch (err) { setError(err.message || 'Yangi suhbat ochilmadi.'); }
    finally { setBusy(false); }
  };
  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    if (!token) { onLogin?.(); return; }
    setBusy(true); setError(''); setDraft('');
    const optimistic = [...messages, { role: 'user', text }]; setMessages(optimistic);
    try {
      let id = activeId;
      if (!id) { const created = await apiRequest('/gru-ai/chats', { token, method: 'POST', body: {} }); id = created?._id || created?.chat?._id; if (!id) throw new Error('Yangi suhbat ochilmadi.'); setActiveId(id); }
      const form = new FormData(); form.append('text', text);
      const result = await apiUpload(`/gru-ai/chats/${encodeURIComponent(id)}/messages`, { token, formData: form });
      setMessages([...optimistic, { role: 'assistant', text: result?.reply || 'Javob olinmadi.' }]);
      await loadChats();
    } catch (err) { setMessages(optimistic); setError(err.message || 'Xabar yuborilmadi.'); setDraft(text); }
    finally { setBusy(false); }
  };

  if (!token) return <View style={s.center}><Text style={s.title}>ZUMO AI</Text><Text style={s.muted}>Yordamchidan foydalanish uchun telefon raqamingiz bilan kiring.</Text><Pressable onPress={onLogin} style={s.primary}><Text style={s.primaryText}>Kirish</Text></Pressable></View>;
  return <View style={s.screen}>
    <View style={s.header}><BackButton onPress={activeId ? () => { setActiveId(null); setMessages([]); } : onBack} /><View style={{ flex: 1 }}><Text style={s.title}>ZUMO AI</Text><Text style={s.muted}>Savol bering, yordam oling</Text></View><Pressable onPress={newChat} disabled={busy} style={s.newButton}><Text style={s.newText}>＋</Text></Pressable></View>
    {!activeId ? <ScrollView contentContainerStyle={s.list}>
      <Text style={s.section}>Yangi suhbat</Text><Text style={s.intro}>Xizmat, mahsulot yoki ZUMO’dan foydalanish haqida so‘rashingiz mumkin.</Text>
      {loading ? <ActivityIndicator color={colors.cyan} style={{ margin: 20 }} /> : null}
      {chats.map((chat) => <Pressable key={chat._id} onPress={() => openChat(chat._id)} style={s.chatRow}><Sparkles color={colors.cyan} size={18} strokeWidth={2} /><Text numberOfLines={1} style={s.chatTitle}>{chat.title || 'Yangi suhbat'}</Text><Chevron /></Pressable>)}
      {!loading && !chats.length ? <Text style={s.empty}>Hali suhbat yo‘q. Pastdagi + tugmasini bosib boshlang.</Text> : null}
    </ScrollView> : <ScrollView contentContainerStyle={s.messages}>
      {messages.map((message, index) => <View key={message._id || index} style={[s.bubble, message.role === 'user' ? s.mine : s.theirs]}><Text style={[s.message, message.role === 'user' && s.mineText]}>{message.text}</Text></View>)}
      {busy ? <Text style={s.typing}>ZUMO AI javob yozyapti…</Text> : null}
    </ScrollView>}
    {error ? <Text style={s.error}>{error}</Text> : null}
    {activeId ? <View style={s.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Savolingizni yozing..." placeholderTextColor="#91A2B2" style={s.input} multiline maxLength={4000} /><Pressable onPress={send} disabled={!draft.trim() || busy} style={[s.send, (!draft.trim() || busy) && { opacity: .45 }]}><Send color={colors.white} size={18} strokeWidth={2.2} /></Pressable></View> : null}
    {!activeId ? <Pressable onPress={newChat} disabled={busy} style={s.primary}><Text style={s.primaryText}>{busy ? 'Ochilyapti…' : '＋ Yangi suhbat'}</Text></Pressable> : null}
  </View>;
}

const s = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderColor: colors.line, backgroundColor: colors.white }, back: { width: 40, height: 44, justifyContent: 'center' }, backText: { color: colors.ink, fontSize: 32 }, title: { color: colors.ink, fontSize: 20, fontWeight: '800' }, muted: { color: colors.muted, fontSize: 12, marginTop: 3 }, newButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center' }, newText: { color: colors.white, fontSize: 25, fontWeight: '700' }, list: { padding: 18, paddingBottom: 24 }, section: { color: colors.ink, fontSize: 18, fontWeight: '800' }, intro: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 16 }, chatRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, backgroundColor: colors.white, borderRadius: 14, marginTop: 8 }, chatGlyph: { color: colors.cyanDark, fontSize: 20, marginRight: 12 }, chatTitle: { color: colors.ink, fontSize: 14, flex: 1 }, arrow: { color: colors.muted, fontSize: 24 }, empty: { textAlign: 'center', color: colors.muted, marginTop: 24, lineHeight: 20 }, messages: { flexGrow: 1, padding: 15, justifyContent: 'flex-end' }, bubble: { maxWidth: '88%', padding: 12, borderRadius: 16, marginVertical: 5 }, mine: { alignSelf: 'flex-end', backgroundColor: colors.cyan }, theirs: { alignSelf: 'flex-start', backgroundColor: colors.white }, message: { color: colors.ink, fontSize: 14, lineHeight: 20 }, mineText: { color: colors.white }, typing: { color: colors.muted, fontSize: 12, margin: 8 }, composer: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.line, padding: 10 }, input: { flex: 1, color: colors.ink, maxHeight: 110, paddingHorizontal: 13, paddingVertical: 10, fontSize: 14, backgroundColor: colors.canvas, borderRadius: 14 }, send: { width: 44, height: 44, marginLeft: 8, borderRadius: 14, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center' }, sendText: { color: colors.white, fontSize: 20 }, error: { color: colors.red, paddingHorizontal: 14, paddingVertical: 6, fontSize: 12 }, primary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, margin: 14, backgroundColor: colors.cyan }, primaryText: { color: colors.white, fontWeight: '800' }, center: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.canvas } });
