// Usta xizmatlari uchun ikonka va rang: har bir yo'nalishning o'z rangi, har bir xizmatning o'z ikonkasi
import {
  Snowflake, Hammer, Droplets, Zap, WashingMachine, ArrowUpDown, KeyRound, Sofa, Fish, Fan, Cpu,
  Sparkles, Shirt, Grid3x3, Wind, SprayCan, Trash2, Wrench, HardHat, PaintRoller, Users, BookOpen,
  Languages, Brain, Dumbbell, Baby, PawPrint, Truck, Tractor, Forklift, Car, Code, Megaphone, Scale,
  Calculator, Stamp, Home, Printer, Mic, PartyPopper, Scissors, Camera, Palette, Sprout, Trees,
  DraftingCompass, Plane, Package, GraduationCap, Heart, Briefcase, LayoutGrid,
} from 'lucide-react';

// Yo'nalish: ikonka va rang (fon — shu rangning och tusi)
export const DIRECTION_STYLE = {
  'maishiy-va-uy-xizmatlari': { Icon: Home, color: '#0096c7' },
  'tozalash-va-sanitariya': { Icon: Sparkles, color: '#10b981' },
  'qurilish-va-tamirlash': { Icon: HardHat, color: '#f59e0b' },
  'talim-va-psixologiya': { Icon: GraduationCap, color: '#6366f1' },
  'oila-va-parvarish': { Icon: Heart, color: '#ec4899' },
  'transport-va-maxsus-texnika': { Icon: Truck, color: '#0ea5e9' },
  'biznes-huquq-va-it': { Icon: Briefcase, color: '#475569' },
  'gozallik-moda-va-tadbirlar': { Icon: Scissors, color: '#a855f7' },
  'boshqa-xizmatlar': { Icon: LayoutGrid, color: '#64748b' },
};

const SERVICE_ICONS = {
  konditsioner: Snowflake,
  'bir-soatga-usta': Hammer,
  santexnik: Droplets,
  elektrik: Zap,
  'maishiy-texnika': WashingMachine,
  'lift-ustasi': ArrowUpDown,
  'qulf-ustasi': KeyRound,
  'mebel-montaj-va-tamirlash': Sofa,
  'akvarium-xizmatlari': Fish,
  ventilyatsiya: Fan,
  elektronika: Cpu,
  'tozalash-klining': Sparkles,
  ximchistka: Shirt,
  'gilam-tozalash': Grid3x3,
  'gilam-va-fasad-tozalash': Wind,
  dezinfeksiya: SprayCan,
  'chiqindilarni-olib-tashlash': Trash2,
  'tamirlash-remont': Wrench,
  'qurilish-ishlari': HardHat,
  molyarchi: PaintRoller,
  'kunlik-ishchi-mardikor': Users,
  repetitorlar: BookOpen,
  'tillar-va-repetitorlik': Languages,
  psixolog: Brain,
  'murabbiylar-va-kouchlar': Dumbbell,
  enaga: Baby,
  veterinar: PawPrint,
  'yuk-tashish': Truck,
  'qishloq-xojaligi-texnikasi': Tractor,
  'maxsus-texnika': Forklift,
  'avto-xizmat': Car,
  'it-xizmatlari': Code,
  marketing: Megaphone,
  advokat: Scale,
  buxgalter: Calculator,
  'advokat-va-buxgalter': Scale,
  notarius: Stamp,
  'rieltorlik-xizmatlari': Home,
  tarjimon: Languages,
  poligrafiya: Printer,
  'shou-biznes': Mic,
  'bazm-xizmatlari': PartyPopper,
  'gozallik-ustalari': Scissors,
  tikuvchilik: Scissors,
  modellar: Camera,
  dizayn: Palette,
  bogdorchilik: Sprout,
  'landshaft-dizayni': Trees,
  muhandis: DraftingCompass,
  turizm: Plane,
  'yetkazib-berish': Package,
  'uyda-ishlash': Home,
};

/** Xizmat uchun { Icon, color }: xizmatning o'z ikonkasi, rang — yo'nalishdan */
export function serviceStyle(slug, direction) {
  const dir = DIRECTION_STYLE[direction] || DIRECTION_STYLE['boshqa-xizmatlar'];
  return { Icon: SERVICE_ICONS[slug] || dir.Icon, color: dir.color };
}
