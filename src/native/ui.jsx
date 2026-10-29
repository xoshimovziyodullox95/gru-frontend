// Umumiy kichik UI bo'laklari — web'dagi lucide ikonkalar bilan bir xil ko'rinish
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, Heart, MapPin } from './icons';
import { colors } from './theme';

// Ro'yxat qatoridagi o'ng strelka
export function Chevron({ color = colors.muted, size = 18 }) {
  return <ChevronRight color={color} size={size} strokeWidth={2.2} />;
}

// Sarlavhadagi "orqaga" tugmasi
export function BackButton({ onPress, color = colors.ink, style }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel="Orqaga" style={[styles.back, style]}>
      <ChevronLeft color={color} size={24} strokeWidth={2.2} />
    </Pressable>
  );
}

// Yumaloq kvadrat ichidagi ikonka (web'dagi ikonka plitkalari kabi)
export function IconTile({ icon: Icon, color = colors.cyan, background = colors.cyanSoft, size = 44, iconSize = 21, style }) {
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: background }, style]}>
      <Icon color={color} size={iconSize} strokeWidth={2} />
    </View>
  );
}

// Manzil: pin ikonka + matn
export function PinText({ children, style, color = colors.muted }) {
  return (
    <View style={styles.pinRow}>
      <MapPin color={color} size={14} strokeWidth={2.2} />
      <Text style={[style, styles.pinText]} numberOfLines={2}>{children}</Text>
    </View>
  );
}

// Saqlash yuragi — tanlanganda qizil to'ladi
export function HeartIcon({ active, size = 20, color = colors.ink }) {
  return <Heart size={size} strokeWidth={2.1} color={active ? colors.red : color} fill={active ? colors.red : 'transparent'} />;
}

const styles = StyleSheet.create({
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 },
  pinText: { flex: 1, marginTop: 0 },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  tile: { alignItems: 'center', justifyContent: 'center' },
});
