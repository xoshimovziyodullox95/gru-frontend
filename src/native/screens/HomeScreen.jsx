/* global require */
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { absoluteMediaUrl, apiRequest, unwrapArray } from '../api';
import { categoryArt } from '../categoryArt';
import { colors, shadow } from '../theme';
import { ChevronRight, Clapperboard, LayoutGrid, Play, Search, ShoppingBag, Sparkles, Tag, User, Wrench, Zap } from '../icons';

const money = (value, currency = 'UZS') => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? (currency === 'USD' ? `$${new Intl.NumberFormat('en-US').format(amount)}` : `${new Intl.NumberFormat('uz-UZ').format(amount)} so‘m`) : 'Kelishiladi';
};
const HERO_VIDEO = require('../../../public/videos/hero-background.mp4');
const HERO_POSTER = require('../../../public/images/hero-poster.webp');
const SELLER_BANNER = require('../../../public/images/seler-human.webp');
const BUSINESS_BANNER = require('../../../public/images/biznes-human.webp');

function ProductCard({ item, onPress }) {
  const image = absoluteMediaUrl(item.images?.[0] || item.image || item.media?.[0]);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.product, pressed && styles.pressed]}>
      {image ? <Image source={{ uri: image }} style={styles.productImage} resizeMode="cover" /> : (
        <View style={[styles.productImage, styles.productPlaceholder]}><Text style={styles.placeholderGlyph}>Z</Text></View>
      )}
      <View style={styles.productBody}>
        <Text numberOfLines={2} style={styles.productTitle}>{item.title || item.name || 'E’lon'}</Text>
        <Text style={styles.productPrice}>{money(item.price, item.currency)}</Text>
        <Text numberOfLines={1} style={styles.productMeta}>{item.location || item.city || 'O‘zbekiston'}</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen({ categories, listings, loading, error, onRetry, onCategory, onListing, onSearch, onTab, onVideoFeed, onAi }) {
  const [query, setQuery] = useState('');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [videos, setVideos] = useState([]);
  const heroPlayer = useVideoPlayer(HERO_VIDEO, (player) => { player.loop = true; player.muted = true; });
  const freshListings = useMemo(() => listings.slice(0, 12), [listings]);
  const submitSearch = () => onSearch(query.trim());
  useEffect(() => { heroPlayer.play(); return () => heroPlayer.pause(); }, [heroPlayer]);
  useEffect(() => {
    const timer = setInterval(() => setBannerIndex((index) => (index + 1) % 2), 5000);
    let active = true;
    apiRequest('/posts?limit=8').then((result) => { if (active) setVideos(unwrapArray(result)); }).catch(() => {});
    return () => { active = false; clearInterval(timer); };
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.topline}>
        <View><Text style={styles.brand}>ZUMO</Text><Text style={styles.brandSub}>Bozor va xizmatlar bir joyda</Text></View>
        <Pressable style={styles.profileButton} onPress={() => onTab('profile')}><User color='#00C8F5' size={19} strokeWidth={2.2} /></Pressable>
      </View>
      <View style={styles.hero}>
        <Image source={HERO_POSTER} style={styles.heroVideo} resizeMode="cover" />
        <VideoView player={heroPlayer} style={styles.heroVideo} contentFit="cover" nativeControls={false} />
        <View pointerEvents="none" style={styles.heroOverlay} />
        <View style={styles.heroContent}>
        <Text style={styles.heroEyebrow}>ZUMO’DA TOPING</Text>
        <Text style={styles.heroTitle}>Kerakli narsa{ '\n' }yaqin atrofda.</Text>
        <Text style={styles.heroDesc}>Tovar toping, ustaga murojaat qiling yoki o‘z e’loningizni joylang.</Text>
        <View style={styles.search}>
          <Search color={colors.cyanDark} size={20} strokeWidth={2.2} style={{ marginRight: 8 }} />
          <TextInput value={query} onChangeText={setQuery} onSubmitEditing={submitSearch} placeholder="Nima qidiryapsiz?" placeholderTextColor="#91A2B2" style={styles.searchInput} returnKeyType="search" />
          <Pressable style={styles.searchAction} onPress={submitSearch}><Text style={styles.searchActionText}>Qidirish</Text></Pressable>
        </View>

      <View style={styles.actionsRow}>
        <Pressable style={[styles.actionCard, styles.actionService]} onPress={() => onTab('request')}>
          <Wrench color='#FFB072' size={20} strokeWidth={2} /><View style={styles.actionText}><Text style={styles.actionTitle}>Usta kerakmi?</Text><Text style={styles.actionHint}>Xizmat so‘rash</Text></View><ChevronRight color='#98B7C9' size={18} />
        </Pressable>
        <Pressable style={[styles.actionCard, styles.actionMarket]} onPress={() => onTab('catalog')}>
          <ShoppingBag color='#64F4DC' size={20} strokeWidth={2} /><View style={styles.actionText}><Text style={styles.actionTitle}>Bozor</Text><Text style={styles.actionHint}>Tovar va joylar</Text></View><ChevronRight color='#98B7C9' size={18} />
        </Pressable>
      </View>
      <View style={styles.futureRow}>
        <Pressable style={[styles.futureCard, styles.sellCard]} onPress={() => onTab('publish')}><Tag color='#C9B2FF' size={19} strokeWidth={2} /><View style={{ flex: 1 }}><Text style={styles.futureTitle}>E’lon berish</Text><Text style={styles.futureHint}>Narsangizni soting</Text></View></Pressable>
        <Pressable style={[styles.futureCard, styles.businessCard]} onPress={() => onTab('business')}><Zap color='#FFD25A' size={19} strokeWidth={2} /><View style={{ flex: 1 }}><Text style={styles.futureTitle}>150+ biznes yo‘nalishi</Text><Text style={styles.futureHint}>Tez kunda</Text></View></Pressable>
      </View>
        </View>
      </View>

      <Pressable onPress={() => bannerIndex === 0 ? onTab('publish') : onTab('business')} style={styles.promoBanner}>
        <Image source={bannerIndex === 0 ? SELLER_BANNER : BUSINESS_BANNER} style={styles.promoImage} resizeMode="contain" />
        <View style={styles.promoCopy}><Text style={styles.promoTitle}>{bannerIndex === 0 ? 'Tovaringiz bormi?' : 'Biznesingiz bormi?'}</Text><Text style={styles.promoSubtitle}>{bannerIndex === 0 ? 'Biz bilan soting' : 'Uni rivojlantiring'}</Text><View style={styles.promoDots}><View style={[styles.promoDot, bannerIndex === 0 && styles.promoDotActive]} /><View style={[styles.promoDot, bannerIndex === 1 && styles.promoDotActive]} /></View></View>
        <ChevronRight color={colors.cyanDark} size={24} style={{ marginHorizontal: 12 }} />
      </Pressable>

      <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Kategoriyalar</Text><Text style={styles.sectionSub}>Bo‘limni tanlang</Text></View><Pressable onPress={() => onTab('catalog')}><View style={styles.linkRow}><Text style={styles.link}>Barchasi</Text><ChevronRight color={colors.cyanDark} size={15} strokeWidth={2.4} /></View></Pressable></View>
      <View style={styles.categories}>
        {categories.slice(0, 10).map((category) => (
          <Pressable key={category.id} onPress={() => onCategory(category)} style={({ pressed }) => [styles.category, pressed && styles.pressed]}>
            <View style={styles.categoryImageWrap}>
              {categoryArt[category.id] ? <Image source={categoryArt[category.id]} style={styles.categoryImage} resizeMode="cover" /> : <LayoutGrid color={colors.cyan} size={24} />}
            </View>
            <Text numberOfLines={2} style={styles.categoryName}>{category.short?.uz || category.short || category.name?.uz || category.name || category.id}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.shortcuts}>
        <Pressable style={styles.videoShortcut} onPress={onVideoFeed}><Clapperboard color={colors.cyanDark} size={19} strokeWidth={2} /><View style={{ flex: 1 }}><Text style={styles.videoShortcutTitle}>Videolar</Text><Text style={styles.videoShortcutHint}>Ishlar va mahsulotlar</Text></View><ChevronRight color='#98B7C9' size={18} /></Pressable>
        <Pressable style={styles.aiShortcut} onPress={onAi}><Sparkles color={colors.cyanDark} size={19} strokeWidth={2} /><View style={{ flex: 1 }}><Text style={styles.videoShortcutTitle}>ZUMO AI</Text><Text style={styles.videoShortcutHint}>Savol bering</Text></View><ChevronRight color='#98B7C9' size={18} /></Pressable>
      </View>

      <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Videolar</Text><Text style={styles.sectionSub}>Mahsulotlar va bajarilgan ishlar</Text></View><Pressable onPress={onVideoFeed}><View style={styles.linkRow}><Text style={styles.link}>Barchasi</Text><ChevronRight color={colors.cyanDark} size={15} strokeWidth={2.4} /></View></Pressable></View>
      {videos.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.videoList}>{videos.map((post) => { const thumbnail = absoluteMediaUrl(post.thumbnailUrl || post.thumbnail || post.coverImage || post.image); return <Pressable key={post._id || post.id} onPress={onVideoFeed} style={styles.videoCard}>{thumbnail ? <Image source={{ uri: thumbnail }} style={styles.videoImage} resizeMode="cover" /> : <View style={[styles.videoImage, styles.videoPlaceholder]}><Play color={colors.white} size={28} fill={colors.white} /></View>}<View style={styles.videoCaption}><Text numberOfLines={2} style={styles.videoTitle}>{post.title || post.description || 'Video post'}</Text></View></Pressable>; })}</ScrollView> : <Pressable onPress={onVideoFeed} style={styles.videoEmpty}><Play color={colors.white} size={28} fill={colors.white} /><Text style={styles.videoEmptyText}>Videolarni ko‘rish</Text><ChevronRight color='#98B7C9' size={18} /></Pressable>}

      <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Yangi e’lonlar</Text><Text style={styles.sectionSub}>Siz uchun tanlangan takliflar</Text></View><Pressable onPress={() => onTab('catalog')}><View style={styles.linkRow}><Text style={styles.link}>Hammasi</Text><ChevronRight color={colors.cyanDark} size={15} strokeWidth={2.4} /></View></Pressable></View>
      {loading ? <ActivityIndicator color={colors.cyan} style={{ marginVertical: 26 }} /> : null}
      {error ? <Pressable onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>{error}  ·  Qayta urinish</Text></Pressable> : null}
      {!loading && !freshListings.length ? <View style={styles.empty}><Text style={styles.emptyTitle}>Hozircha e’lonlar yo‘q</Text><Text style={styles.emptyHint}>Keyinroq yana ko‘rib chiqing.</Text></View> : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.products}>
          {freshListings.map((item) => <ProductCard key={item._id || item.id} item={item} onPress={() => onListing(item)} />)}
        </ScrollView>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas }, content: { paddingBottom: 24 },
  topline: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, backgroundColor: '#071A30', marginBottom: 0 },
  brand: { color: '#00C8F5', fontSize: 22, fontWeight: '900', letterSpacing: 1.5 }, brandSub: { display: 'none' },
  profileButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#102C46', alignItems: 'center', justifyContent: 'center' }, profileGlyph: { color: '#00C8F5', fontSize: 20 },
  hero: { minHeight: 490, justifyContent: 'center', backgroundColor: '#01091C', overflow: 'hidden' }, heroVideo: { ...StyleSheet.absoluteFillObject }, heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 12, 30, 0.68)' }, heroContent: { paddingHorizontal: 18, paddingVertical: 30, alignItems: 'center', zIndex: 1 }, heroEyebrow: { color: '#62D9ED', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { color: colors.white, fontSize: 31, lineHeight: 37, fontWeight: '800', marginTop: 10, textAlign: 'center' }, heroDesc: { color: '#D1E1EC', fontSize: 13, lineHeight: 19, marginTop: 9, maxWidth: 330, textAlign: 'center' },
  search: { height: 52, flexDirection: 'row', alignItems: 'center', paddingLeft: 13, paddingRight: 5, marginTop: 19, borderRadius: 17, backgroundColor: colors.white }, searchGlyph: { color: colors.cyanDark, fontSize: 28, marginRight: 8, marginTop: -3 }, searchInput: { flex: 1, minWidth: 20, color: colors.ink, fontSize: 14 }, searchAction: { height: 42, paddingHorizontal: 13, justifyContent: 'center', borderRadius: 13, backgroundColor: colors.cyan }, searchActionText: { color: colors.white, fontWeight: '800', fontSize: 12 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 15 }, actionCard: { width: '47%', minHeight: 64, borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 7, borderWidth: 1, borderColor: 'rgba(0, 201, 245, .35)', backgroundColor: 'rgba(5, 33, 58, .82)' }, actionService: { borderColor: 'rgba(255, 145, 66, .7)' }, actionMarket: { borderColor: 'rgba(0, 201, 176, .55)' }, actionIcon: { fontSize: 21, color: '#00D3FF', width: 25, textAlign: 'center' }, actionText: { flex: 1 }, actionTitle: { color: colors.white, fontSize: 13, fontWeight: '800' }, actionHint: { color: '#BCD1DF', fontSize: 11, marginTop: 3 }, actionArrow: { color: '#98B7C9', fontSize: 20 }, futureRow: { flexDirection: 'row', gap: 9, marginTop: 9 }, futureCard: { flex: 1, minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 9, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(122, 188, 238, .55)', backgroundColor: 'rgba(14, 39, 68, .86)' }, futureIcon: { color: '#B6D4E9', fontSize: 18 }, futureTitle: { color: colors.white, fontSize: 13, fontWeight: '800' }, futureHint: { color: '#9BB8CC', fontSize: 11, marginTop: 2 }, sellCard: { borderColor: 'rgba(170, 130, 255, .55)', backgroundColor: 'rgba(60, 30, 130, .55)' }, businessCard: { borderColor: 'rgba(255, 186, 0, .5)', backgroundColor: 'rgba(80, 60, 10, .55)' },
  promoBanner: { height: 118, marginHorizontal: 18, marginTop: 18, flexDirection: 'row', alignItems: 'center', backgroundColor: '#E4F9FC', borderWidth: 1, borderColor: '#B9EBF4', borderRadius: 20, overflow: 'hidden' }, promoImage: { width: 118, height: 112, alignSelf: 'flex-end' }, promoCopy: { flex: 1, paddingLeft: 4 }, promoTitle: { color: colors.ink, fontSize: 14, fontWeight: '900' }, promoSubtitle: { color: colors.muted, fontSize: 12, marginTop: 5 }, promoDots: { flexDirection: 'row', gap: 6, marginTop: 16 }, promoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#A8B6C2' }, promoDotActive: { width: 23, backgroundColor: colors.cyan }, promoArrow: { color: colors.cyanDark, fontSize: 27, paddingHorizontal: 14 }, shortcuts: { flexDirection: 'row', gap: 9, marginHorizontal: 18, marginTop: 20 }, videoShortcut: { flex: 1, minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 9, borderRadius: 16, backgroundColor: colors.white, ...shadow }, aiShortcut: { flex: 1, minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 9, borderRadius: 16, backgroundColor: '#E6F8FA' }, aiIcon: { color: colors.cyanDark, fontSize: 21 }, videoShortcutIcon: { color: colors.cyanDark, fontSize: 17 }, videoShortcutTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' }, videoShortcutHint: { color: colors.muted, fontSize: 11, marginTop: 3 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 18, marginTop: 25, marginBottom: 12 }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' }, sectionSub: { color: colors.muted, fontSize: 12, marginTop: 3 }, link: { color: colors.cyanDark, fontSize: 13, fontWeight: '700' }, linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, paddingHorizontal: 18 }, category: { width: '18.8%', alignItems: 'center' }, categoryImageWrap: { width: 61, height: 61, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, overflow: 'hidden', ...shadow }, categoryImage: { width: '100%', height: '100%' }, categoryFallback: { color: colors.cyan, fontSize: 25 }, categoryName: { color: colors.ink, fontSize: 11, lineHeight: 14, fontWeight: '700', textAlign: 'center', marginTop: 6, minHeight: 24 },
  products: { flexDirection: 'row', gap: 11, paddingHorizontal: 18 }, product: { width: 190, backgroundColor: colors.white, borderRadius: 17, overflow: 'hidden', ...shadow }, productImage: { width: '100%', height: 128, backgroundColor: '#E6EEF4' }, productPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6F7FA' }, placeholderGlyph: { color: colors.cyan, fontSize: 36, fontWeight: '900' }, productBody: { padding: 11 }, productTitle: { color: colors.ink, fontSize: 13, lineHeight: 17, fontWeight: '700', minHeight: 34 }, productPrice: { color: colors.cyanDark, fontSize: 13, fontWeight: '900', marginTop: 8 }, productMeta: { color: colors.muted, fontSize: 11, marginTop: 5 },
  videoList: { flexDirection: 'row', gap: 10, paddingHorizontal: 18 }, videoCard: { width: 138, height: 194, backgroundColor: '#071629', borderRadius: 17, overflow: 'hidden' }, videoImage: { width: '100%', height: '100%' }, videoPlaceholder: { alignItems: 'center', justifyContent: 'center' }, videoPlay: { color: colors.white, fontSize: 32 }, videoCaption: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, paddingTop: 28, backgroundColor: 'rgba(4, 13, 26, .55)' }, videoTitle: { color: colors.white, fontSize: 11, fontWeight: '800' }, videoEmpty: { minHeight: 76, marginHorizontal: 18, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0B2037', borderRadius: 16 }, videoEmptyText: { color: colors.white, flex: 1, fontSize: 12, fontWeight: '700' },
  empty: { backgroundColor: colors.white, padding: 20, borderRadius: 16, alignItems: 'center' }, emptyTitle: { color: colors.ink, fontWeight: '700' }, emptyHint: { color: colors.muted, fontSize: 12, marginTop: 5 }, retry: { borderRadius: 12, backgroundColor: '#FFF0F1', padding: 12 }, retryText: { color: colors.red, fontSize: 12, textAlign: 'center' }, pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
