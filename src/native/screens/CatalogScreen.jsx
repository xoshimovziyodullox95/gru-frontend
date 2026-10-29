import { useEffect, useState } from 'react';
import { BackHandler, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { categoryArt } from '../categoryArt';
import { colors, shadow } from '../theme';
import { ChevronLeft, LayoutGrid, MapPin, Search, Wrench } from '../icons';
import { Chevron, IconTile } from '../ui';

export default function CatalogScreen({ categories, onCategory, onBack, onLocations }) {
  const [activeCategory, setActiveCategory] = useState(null);
  useEffect(() => {
    if (!activeCategory) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { setActiveCategory(null); return true; });
    return () => subscription.remove();
  }, [activeCategory]);
  const labelOf = (category) => category?.name?.uz || category?.name || category?.short?.uz || category?.short || category?.id || '';
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => activeCategory ? setActiveCategory(null) : onBack?.()} style={styles.back}><ChevronLeft color={colors.cyanDark} size={18} strokeWidth={2.4} /><Text style={styles.backText}>{activeCategory ? 'Kategoriyalar' : 'Bosh sahifaga'}</Text></Pressable>
      <Text style={styles.kicker}>ZUMO MARKET</Text>
      <Text style={styles.title}>{activeCategory ? labelOf(activeCategory) : 'Katalog'}</Text>
      <Text style={styles.description}>{activeCategory ? 'Kerakli bo‘limni tanlab, shu turdagi e’lonlarni ko‘ring.' : 'Kerakli bo‘limni tanlang — mavjud e’lonlar va takliflarni ko‘ring.'}</Text>
      <View style={styles.list}>
        {activeCategory ? <>
          <Pressable onPress={() => onCategory(activeCategory)} style={styles.allCategory}><Text style={styles.allCategoryText}>Barcha “{labelOf(activeCategory)}” e’lonlari</Text><Chevron /></Pressable>
          {(activeCategory.subs || []).map((sub, index) => (
            <Pressable key={sub.id} onPress={() => onCategory({ ...activeCategory, selectedSubcategory: sub.id, selectedSubcategoryName: labelOf(sub) })} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
              <IconTile icon={Search} size={52} iconSize={20} background={['#E5F5FF', '#E8F8F1', '#FFF1E7', '#F1EAFE'][index % 4]} />
              <View style={styles.rowText}><Text style={styles.name}>{labelOf(sub)}</Text><Text style={styles.hint}>Shu bo‘limdagi e’lonlar</Text></View><Chevron />
            </Pressable>
          ))}
        </> : categories.map((category, index) => (
          <Pressable key={category.id} onPress={() => category.subs?.length ? setActiveCategory(category) : onCategory(category)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}>
            <View style={[styles.iconWrap, { backgroundColor: ['#E5F5FF', '#E8F8F1', '#FFF1E7', '#F1EAFE'][index % 4] }]}>
              {categoryArt[category.id] ? <Image source={categoryArt[category.id]} style={styles.photo} resizeMode="cover" /> : <LayoutGrid color={colors.cyan} size={22} />}
            </View>
            <View style={styles.rowText}><Text style={styles.name}>{category.short?.uz || category.short || category.name?.uz || category.name || category.id}</Text><Text style={styles.hint}>Tovarlar va e’lonlar</Text></View>
            <Chevron />
          </Pressable>
        ))}
        {!activeCategory ? <>
        <Pressable style={[styles.row, styles.serviceRow]} onPress={() => onCategory({ id: 'services', name: 'Xizmatlar' })}>
          <IconTile icon={Wrench} size={52} iconSize={22} /><View style={styles.rowText}><Text style={styles.name}>Xizmatlar</Text><Text style={styles.hint}>Usta va mutaxassislar</Text></View><Chevron />
        </Pressable>
        <Pressable style={[styles.row, styles.serviceRow]} onPress={onLocations}>
          <IconTile icon={MapPin} size={52} iconSize={22} /><View style={styles.rowText}><Text style={styles.name}>Joylar</Text><Text style={styles.hint}>Do‘kon, ofis, ombor va ijara</Text></View><Chevron />
        </Pressable>
        </> : null}
      </View>
      <View style={styles.note}><Text style={styles.noteTitle}>Bo‘limlar bo‘yicha qidiring</Text><Text style={styles.noteText}>Kategoriya tanlanganda e’lonlar ro‘yxatini shu bo‘lim bo‘yicha saralaymiz.</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 20, paddingBottom: 30 }, back: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, backGlyph: { color: colors.ink, fontSize: 32, marginRight: 7 }, backText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, kicker: { color: colors.cyanDark, fontWeight: '800', fontSize: 11, letterSpacing: 1.4, marginTop: 8 }, title: { color: colors.ink, fontSize: 30, fontWeight: '900', marginTop: 5 }, description: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 20 },
  list: { gap: 9 }, photo: { width: '100%', height: '100%' }, row: { minHeight: 76, borderRadius: 18, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, ...shadow }, iconWrap: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, icon: { width: 46, height: 46 }, fallback: { fontSize: 25, color: colors.cyanDark }, rowText: { flex: 1, marginLeft: 12 }, name: { color: colors.ink, fontSize: 14, fontWeight: '800' }, hint: { color: colors.muted, fontSize: 11, marginTop: 4 }, arrow: { color: '#92A5B7', fontSize: 27, paddingHorizontal: 5 }, serviceRow: { borderWidth: 1, borderColor: '#D9EFF3' }, allCategory: { minHeight: 52, borderRadius: 15, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: '#DFF6F8' }, allCategoryText: { flex: 1, color: colors.cyanDark, fontSize: 13, fontWeight: '800' }, note: { backgroundColor: '#E4F7F9', borderRadius: 18, padding: 16, marginTop: 20 }, noteTitle: { color: colors.ink, fontWeight: '800' }, noteText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
});
