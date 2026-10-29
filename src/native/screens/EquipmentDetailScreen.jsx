import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { absoluteMediaUrl } from '../api';
import { colors, shadow } from '../theme';
import { HeartIcon, PinText } from '../ui';

const idOf = (item) => item?._id || item?.id;
const titleOf = (item) => item?.title || item?.name || 'E’lon';
const imagesOf = (item) => (Array.isArray(item?.images) ? item.images : [item?.image || item?.media?.[0]])
  .map((entry) => absoluteMediaUrl(typeof entry === 'string' ? entry : entry?.url || entry?.path))
  .filter(Boolean);
const priceOf = (value, currency = 'UZS') => Number(value) > 0
  ? currency === 'USD' ? `$${new Intl.NumberFormat('en-US').format(Number(value))}` : `${new Intl.NumberFormat('uz-UZ').format(Number(value))} so‘m`
  : 'Kelishiladi';

export default function EquipmentDetailScreen({ item, onOpenChat, onAddCart, isFavorite, onToggleFavorite, related = [], onOpenListing }) {
  const { width } = useWindowDimensions();
  const images = imagesOf(item);
  const owner = item?.userId?.fullName || item?.userId?.name || item?.user?.fullName || item?.owner?.fullName || 'E’lon egasi';
  const storeProduct = item?.saleMode === 'store';
  const condition = item?.condition === 'used' ? 'Ishlatilgan' : 'Yangi';
  return <ScrollView style={s.screen} contentContainerStyle={s.content}>
    {images.length ? <View><ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
      {images.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} style={[s.heroImage, { width }]} resizeMode="cover" />)}
    </ScrollView>{images.length > 1 ? <View style={s.imageCount}><Text style={s.imageCountText}>{images.length} ta rasm · suring</Text></View> : null}</View>
      : <View style={s.heroEmpty}><Text style={s.heroMark}>Z</Text></View>}
    <View style={s.panel}>
      <View style={s.titleRow}><View style={{ flex: 1 }}><Text style={s.price}>{priceOf(item?.price, item?.currency)}</Text><Text style={s.title}>{titleOf(item)}</Text></View><Pressable onPress={() => onToggleFavorite?.(item)} style={[s.favorite, isFavorite && s.favoriteOn]}><HeartIcon active={isFavorite} /></Pressable></View>
      <PinText style={s.location}>{item?.location || item?.city || 'O‘zbekiston'}</PinText>
      <View style={s.badges}><Text style={s.badge}>{storeProduct ? 'Do‘kon mahsuloti' : 'Sotuvchi e’loni'}</Text><Text style={s.badge}>{condition}</Text>{storeProduct && Number.isFinite(Number(item?.stockQuantity)) ? <Text style={s.badge}>Omborda: {Number(item.stockQuantity)} ta</Text> : null}</View>
      {item?.level1 || item?.category ? <Text style={s.category}>{[item.level1, item.category].filter(Boolean).join(' · ')}</Text> : null}
      <View style={s.rule} /><Text style={s.section}>Tavsif</Text><Text style={s.description}>{item?.description || 'E’lon egasidan batafsil ma’lumot oling.'}</Text>
      <View style={s.owner}><View style={s.avatar}><Text style={s.avatarText}>{owner.slice(0, 1).toUpperCase()}</Text></View><View><Text style={s.ownerHint}>E’lon egasi</Text><Text style={s.ownerName}>{owner}</Text></View></View>
    </View>
    {related.length ? <View style={s.related}><Text style={s.section}>O‘xshash e’lonlar</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.relatedRow}>{related.map((entry) => { const uri = imagesOf(entry)[0]; return <Pressable key={idOf(entry)} onPress={() => onOpenListing?.(entry)} style={s.relatedCard}>{uri ? <Image source={{ uri }} style={s.relatedImage} /> : <View style={[s.relatedImage, s.relatedEmpty]}><Text style={s.relatedZ}>Z</Text></View>}<Text numberOfLines={2} style={s.relatedTitle}>{titleOf(entry)}</Text><Text style={s.relatedPrice}>{priceOf(entry.price, entry.currency)}</Text></Pressable>; })}</ScrollView></View> : null}
    <View style={s.actions}><Pressable style={[s.contact, !storeProduct && { flex: 1 }]} onPress={() => onOpenChat(item)}><Text style={s.contactText}>Sotuvchiga yozish</Text></Pressable>{storeProduct ? <Pressable style={s.cart} onPress={() => onAddCart(item)}><Text style={s.cartText}>Savatga</Text></Pressable> : null}</View>
  </ScrollView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas }, content: { paddingBottom: 24 }, heroImage: { height: 290, backgroundColor: '#E6EEF4' }, heroEmpty: { height: 250, backgroundColor: '#DDF6F9', alignItems: 'center', justifyContent: 'center' }, heroMark: { color: colors.cyan, fontSize: 70, fontWeight: '900' }, imageCount: { position: 'absolute', right: 14, bottom: 12, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#071629B8' }, imageCountText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  panel: { padding: 20 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, favorite: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F5F8' }, favoriteOn: { backgroundColor: '#FFE8EC' }, favoriteGlyph: { color: colors.ink, fontSize: 24 }, favoriteGlyphOn: { color: colors.red }, price: { color: colors.cyanDark, fontSize: 21, fontWeight: '900' }, title: { color: colors.ink, fontSize: 20, fontWeight: '800', lineHeight: 26, marginTop: 6 }, location: { color: colors.muted, fontSize: 12, marginTop: 9 }, badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 }, badge: { color: colors.cyanDark, backgroundColor: '#E3F8FA', fontSize: 10, fontWeight: '700', borderRadius: 9, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 6 }, category: { color: colors.muted, fontSize: 11, marginTop: 10 }, rule: { height: 1, backgroundColor: colors.line, marginVertical: 17 }, section: { color: colors.ink, fontSize: 15, fontWeight: '800' }, description: { color: '#51687C', fontSize: 13, lineHeight: 20, marginTop: 7 }, owner: { flexDirection: 'row', alignItems: 'center', marginTop: 22, backgroundColor: colors.white, padding: 13, borderRadius: 16 }, avatar: { height: 44, width: 44, borderRadius: 22, backgroundColor: '#DCF4F7', alignItems: 'center', justifyContent: 'center', marginRight: 11 }, avatarText: { color: colors.cyanDark, fontSize: 18, fontWeight: '900' }, ownerHint: { color: colors.muted, fontSize: 10 }, ownerName: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 3 },
  related: { paddingLeft: 20, marginTop: 5 }, relatedRow: { gap: 10, paddingVertical: 10, paddingRight: 20 }, relatedCard: { width: 145, padding: 8, borderRadius: 14, backgroundColor: colors.white, ...shadow }, relatedImage: { width: '100%', height: 92, borderRadius: 10, backgroundColor: '#E6EEF4' }, relatedEmpty: { alignItems: 'center', justifyContent: 'center' }, relatedZ: { color: colors.cyan, fontSize: 30, fontWeight: '900' }, relatedTitle: { color: colors.ink, fontSize: 11, fontWeight: '700', marginTop: 7, minHeight: 30 }, relatedPrice: { color: colors.cyanDark, fontSize: 11, fontWeight: '800', marginTop: 4 }, actions: { flexDirection: 'row', gap: 10, padding: 18 }, contact: { flex: 1, minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyan }, contactText: { color: colors.white, fontWeight: '800', fontSize: 13 }, cart: { minWidth: 100, minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cyan }, cartText: { color: colors.cyanDark, fontWeight: '800', fontSize: 13 },
});
