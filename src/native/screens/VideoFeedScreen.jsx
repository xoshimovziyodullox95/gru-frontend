import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { absoluteMediaUrl, apiRequest, unwrapArray } from '../api';
import { colors, shadow } from '../theme';
import { Play } from '../icons';
import { BackButton, HeartIcon } from '../ui';

function VideoCard({ post, token, onLogin }) {
  const url = absoluteMediaUrl(post.videoUrl || post.video || post.url);
  const youtube = Boolean(post.isYoutube || /youtu(?:\.be|be\.com)/i.test(String(post.videoUrl || '')));
  const player = useVideoPlayer(!youtube ? url : null, (instance) => { instance.loop = false; });
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes?.length || Number(post.likesCount) || 0);
  const like = async () => {
    if (!token) return onLogin?.();
    const nextLiked = !liked;
    try { await apiRequest(`/posts/${encodeURIComponent(post._id || post.id)}/like`, { token, method: 'POST' }); setLiked(nextLiked); setLikes((count) => Math.max(0, count + (nextLiked ? 1 : -1))); }
    catch { /* Like count stays unchanged when the server rejects the request. */ }
  };
  return <View style={styles.card}>
    {youtube ? <Pressable onPress={() => Linking.openURL(post.videoUrl)} style={styles.youtube}><Play color={colors.white} size={30} fill={colors.white} /><Text style={styles.youtubeText}>YouTube’da ko‘rish</Text></Pressable> : url ? <VideoView player={player} style={styles.video} nativeControls contentFit="contain" allowsFullscreen allowsPictureInPicture /> : <View style={[styles.video, styles.videoEmpty]}><Text style={styles.meta}>Video manzili topilmadi</Text></View>}
    <View style={styles.body}><Text style={styles.title}>{post.title || 'Video'}</Text>{post.description ? <Text style={styles.description}>{post.description}</Text> : null}<View style={styles.footer}><Text style={styles.meta}>{post.userId?.fullName || post.userId?.full_name || 'ZUMO foydalanuvchisi'}</Text><Pressable onPress={like} style={styles.like}><HeartIcon active={liked} /><Text style={styles.meta}>{likes}</Text></Pressable></View></View>
  </View>;
}

export default function VideoFeedScreen({ token, onLogin, onBack, onAddVideo }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(() => { setLoading(true); setError(''); apiRequest('/posts?limit=30').then((response) => setPosts(unwrapArray(response?.posts || response))).catch((err) => setError(err.message || 'Videolar yuklanmadi.')).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    let active = true;
    apiRequest('/posts?limit=30')
      .then((response) => { if (active) setPosts(unwrapArray(response?.posts || response)); })
      .catch((err) => { if (active) setError(err.message || 'Videolar yuklanmadi.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <View style={styles.header}><BackButton onPress={onBack} /><Text style={styles.headerTitle}>Video postlar</Text><Pressable onPress={onAddVideo} style={styles.add}><Text style={styles.addText}>＋</Text></Pressable></View>
    <Text style={styles.subtitle}>Ishlar, mahsulotlar va foydali tavsiyalar</Text>
    {loading ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 30 }} /> : null}
    {error ? <Pressable onPress={load} style={styles.error}><Text style={styles.errorText}>{error} · Qayta urinish</Text></Pressable> : null}
    {!loading && !error && !posts.length ? <View style={styles.empty}><Text style={styles.emptyTitle}>Hozircha video post yo‘q</Text><Text style={styles.subtitle}>Birinchi videoni o‘zingiz joylang.</Text><Pressable onPress={onAddVideo} style={styles.create}><Text style={styles.createText}>Video qo‘shish</Text></Pressable></View> : null}
    {posts.map((post, index) => <VideoCard key={post._id || post.id || index} post={post} token={token} onLogin={onLogin} />)}
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 16, paddingBottom: 30 }, header: { minHeight: 43, flexDirection: 'row', alignItems: 'center' }, back: { width: 40 }, backGlyph: { color: colors.ink, fontSize: 34 }, headerTitle: { flex: 1, color: colors.ink, fontSize: 18, fontWeight: '800' }, add: { width: 38, height: 38, borderRadius: 14, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center' }, addText: { color: colors.white, fontSize: 24, marginTop: -2 }, subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 }, card: { backgroundColor: colors.white, borderRadius: 19, overflow: 'hidden', marginTop: 14, ...shadow }, video: { width: '100%', height: 230, backgroundColor: '#071629' }, videoEmpty: { alignItems: 'center', justifyContent: 'center' }, youtube: { height: 190, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111B28' }, play: { color: colors.white, fontSize: 45 }, youtubeText: { color: colors.white, fontWeight: '800', marginTop: 6 }, body: { padding: 13 }, title: { color: colors.ink, fontSize: 15, fontWeight: '800' }, description: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }, footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 11 }, meta: { color: colors.muted, fontSize: 10 }, like: { flexDirection: 'row', alignItems: 'center', gap: 5 }, likeGlyph: { color: colors.muted, fontSize: 19 }, liked: { color: colors.red }, empty: { backgroundColor: colors.white, borderRadius: 18, padding: 20, marginTop: 24, alignItems: 'flex-start' }, emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' }, create: { backgroundColor: colors.cyan, borderRadius: 13, paddingHorizontal: 15, paddingVertical: 11, marginTop: 14 }, createText: { color: colors.white, fontWeight: '800', fontSize: 12 }, error: { backgroundColor: '#FFF0F1', borderRadius: 12, padding: 12, marginTop: 14 }, errorText: { color: colors.red, fontSize: 12 } });
