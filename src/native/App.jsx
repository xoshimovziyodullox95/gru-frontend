import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import CatalogScreen from './screens/CatalogScreen';
import CartScreen from './screens/CartScreen';
import AddEquipmentScreen from './screens/AddEquipmentScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import AccountListScreen from './screens/AccountListScreen';
import CreateServiceScreen from './screens/CreateServiceScreen';
import CreateVideoScreen from './screens/CreateVideoScreen';
import CreateLocationScreen from './screens/CreateLocationScreen';
import ServiceMarketplaceScreen from './screens/ServiceMarketplaceScreen';
import VideoFeedScreen from './screens/VideoFeedScreen';
import ServiceRequestsScreen from './screens/ServiceRequestsScreen';
import MarketplaceBrowseScreen from './screens/MarketplaceBrowseScreen';
import LocationDetailScreen from './screens/LocationDetailScreen';
import EquipmentDetailScreen from './screens/EquipmentDetailScreen';
import ZumoAIScreen from './screens/ZumoAIScreen';
import BusinessScreen from './screens/BusinessScreen';
import BankServicesScreen from './screens/BankServicesScreen';
import AdminScreen from './screens/AdminScreen';
import { absoluteMediaUrl, apiRequest, SESSION_KEY, unwrapArray } from './api';
import { getServiceTaxonomyLabel } from '../components/utils/serviceTaxonomyLabels';
import { colors, shadow } from './theme';
import { Clapperboard, House, MapPin, MessageCircle, Package, Plus, ShoppingCart, User, Wrench } from './icons';
import { BackButton, Chevron, IconTile } from './ui';

// Pastki menyu — web'dagi MarketplaceLayout bilan bir xil ikonkalar
const tabs = [
  { key: 'home', label: 'Bosh', icon: House },
  { key: 'cart', label: 'Savat', icon: ShoppingCart },
  { key: 'publish', label: 'Qo‘shish', icon: Plus },
  { key: 'chats', label: 'Chat', icon: MessageCircle },
  { key: 'profile', label: 'Profil', icon: User },
];

const itemId = (item) => item?._id || item?.id;
const ownerId = (item) => item?.userId?._id || item?.userId?.id || item?.user?._id || item?.owner?._id || item?.userId;
const itemTitle = (item) => item?.title || item?.name || 'E’lon';
const itemImage = (item) => absoluteMediaUrl(item?.images?.[0] || item?.image || item?.media?.[0]);
const priceText = (value, currency = 'UZS') => Number(value) > 0 ? (currency === 'USD' ? `$${new Intl.NumberFormat('en-US').format(Number(value))}` : `${new Intl.NumberFormat('uz-UZ').format(Number(value))} so‘m`) : 'Kelishiladi';
const sharedListingMessage = (type, item) => {
  const id = itemId(item);
  const route = type === 'location' ? 'location' : 'equipment';
  const price = item?.price || item?.price_per_month;
  const fields = [type, `/${route}/${encodeURIComponent(id)}`, itemTitle(item), itemImage(item) || '', price ? priceText(price, item?.currency) : '', ''];
  return `LISTING::${fields.map((field) => encodeURIComponent(String(field || ''))).join('::')}`;
};

function Header({ title, onBack, right }) {
  return <View style={styles.header}><BackButton onPress={onBack} /><Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>{right || <View style={{ width: 42 }} />}</View>;
}

function PublishScreen({ onAddEquipment, onChoose, onInfo }) {
  const actions = [
    [Package, 'Tovar yoki uskuna', 'Sotuv yoki ijaraga e’lon', 'equipment'],
    [MapPin, 'Joy yoki do‘kon', 'Savdo va xizmat joyi', 'location'],
    [Wrench, 'Xizmat taklif qilish', 'Mutaxassis sifatida ro‘yxatdan o‘tish', 'service'],
    [Clapperboard, 'Video post', 'Mahsulot yoki ishingizni ko‘rsating', 'video'],
  ];
  return <ScrollView style={styles.screen} contentContainerStyle={styles.publishContent}><Text style={styles.kicker}>ZUMO’DA ULASHING</Text><Text style={styles.screenTitle}>Nima joylamoqchisiz?</Text><Text style={styles.screenSub}>Sizga mos e’lon turini tanlang.</Text>
    {actions.map(([icon, title, subtitle, key]) => <Pressable key={key} onPress={() => key === 'equipment' ? onAddEquipment() : ['service', 'video', 'location'].includes(key) ? onChoose(key) : onInfo(title)} style={styles.publishRow}><IconTile icon={icon} size={46} style={{ marginRight: 12 }} /><View style={{ flex: 1 }}><Text style={styles.publishTitle}>{title}</Text><Text style={styles.publishSub}>{subtitle}</Text></View><Chevron /></Pressable>)}
  </ScrollView>;
}

function ServiceRequestScreen({ token, onLogin, onBack }) {
  const [category, setCategory] = useState('');
  const [taxonomy, setTaxonomy] = useState({});
  const [activeDirection, setActiveDirection] = useState('all');
  const [categorySearch, setCategorySearch] = useState('');
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    apiRequest('/service-providers/taxonomy')
      .then((response) => setTaxonomy(response?.taxonomy || response?.data?.taxonomy || {}))
      .catch(() => setError('Xizmat kategoriyalarini yuklab bo‘lmadi.'))
      .finally(() => setTaxonomyLoading(false));
  }, []);
  const directions = Object.entries(taxonomy).filter(([, entries]) => Array.isArray(entries) && entries.length);
  const visibleServiceCategories = directions
    .filter(([direction]) => activeDirection === 'all' || direction === activeDirection)
    .flatMap(([direction, entries]) => entries.map((slug) => ({ slug, direction })))
    .filter(({ slug, direction }) => !categorySearch.trim() || `${getServiceTaxonomyLabel(slug, 'uz')} ${getServiceTaxonomyLabel(direction, 'uz')}`.toLowerCase().includes(categorySearch.trim().toLowerCase()));
  const submit = async () => {
    if (!token) return onLogin();
    if (!category || description.trim().length < 10 || !address.trim()) { setError('Xizmat turini tanlang, muammoni kamida 10 belgi bilan yozing va manzilni kiriting.'); return; }
    setBusy(true); setError('');
    try {
      await apiRequest('/service-requests', { token, method: 'POST', body: { category, description: description.trim(), location: { address: address.trim(), lat: null, lng: null } } });
      Alert.alert('So‘rov yuborildi', 'Mos xizmat ko‘rsatuvchilarga so‘rovingiz yuborildi. Takliflar chat va bildirishnomalarda ko‘rinadi.', [{ text: 'Tushunarli', onPress: onBack }]);
    } catch (err) { setError(err.message || 'So‘rovni yuborib bo‘lmadi.'); }
    finally { setBusy(false); }
  };
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.requestContent} keyboardShouldPersistTaps="handled"><Text style={styles.kicker}>USTA YOKI XIZMAT KERAKMI?</Text><Text style={styles.screenTitle}>So‘rov yuboring</Text><Text style={styles.screenSub}>So‘rovingiz mos mutaxassislarga boradi. Kelgan takliflarni solishtirib, o‘zingiz tanlaysiz.</Text>
    <Text style={styles.label}>Qanday xizmat kerak?</Text><TextInput value={categorySearch} onChangeText={setCategorySearch} placeholder="Xizmat turini qidiring" style={styles.field} placeholderTextColor="#91A2B2" />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.directionScroller} contentContainerStyle={styles.directionRow}>
      {[['all', 'Barchasi'], ...directions.map(([slug]) => [slug, getServiceTaxonomyLabel(slug, 'uz')])].map(([slug, label]) => <Pressable key={slug} onPress={() => setActiveDirection(slug)} style={[styles.directionChip, activeDirection === slug && styles.directionChipActive]}><Text style={[styles.directionText, activeDirection === slug && styles.directionTextActive]}>{label}</Text></Pressable>)}
    </ScrollView>
    {category ? <Text style={styles.selectedCategory}>Tanlandi: {getServiceTaxonomyLabel(category, 'uz')}</Text> : <Text style={styles.categoryHint}>Avval xizmat turini tanlang</Text>}
    {taxonomyLoading ? <ActivityIndicator color={colors.cyan} style={{ margin: 12 }} /> : <View style={styles.serviceCategoryGrid}>{visibleServiceCategories.map(({ slug }) => <Pressable key={slug} onPress={() => setCategory(slug)} style={[styles.serviceCategoryChip, category === slug && styles.serviceCategoryChipSelected]}><Text numberOfLines={2} style={[styles.serviceCategoryText, category === slug && styles.serviceCategoryTextSelected]}>{getServiceTaxonomyLabel(slug, 'uz')}</Text></Pressable>)}</View>}
    <Text style={styles.label}>Muammoni qisqacha yozing</Text><TextInput value={description} onChangeText={setDescription} placeholder="Usta nimani tuzatishi yoki bajarishi kerak?" style={[styles.field, styles.multiline]} multiline textAlignVertical="top" placeholderTextColor="#91A2B2" />
    <Text style={styles.label}>Manzil</Text><TextInput value={address} onChangeText={setAddress} placeholder="Tuman, mahalla, ko‘cha" style={styles.field} placeholderTextColor="#91A2B2" />
    {error ? <Text style={styles.errorText}>{error}</Text> : null}<Pressable onPress={submit} disabled={busy} style={[styles.submit, busy && { opacity: 0.6 }]}>{busy ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>Xizmat ko‘rsatuvchilarga yuborish</Text>}</Pressable>
  </ScrollView></KeyboardAvoidingView>;
}

export default function App() {
  const [tab, setTab] = useState('home');
  const [screen, setScreen] = useState('tabs');
  const [previousScreen, setPreviousScreen] = useState('tabs');
  const [listing, setListing] = useState(null);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationListing, setLocationListing] = useState(null);
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [chatTarget, setChatTarget] = useState(null);
  const [sharedProviderId, setSharedProviderId] = useState(null);
  const [accountType, setAccountType] = useState('saved');
  const [favorites, setFavorites] = useState([]);

  const handleBack = useCallback(() => {
    if (screen === 'tabs') {
      if (tab !== 'home') { setTab('home'); return true; }
      return false;
    }
    if (screen === 'detail' || screen === 'location-detail') { setScreen(previousScreen || 'tabs'); return true; }
    if (screen === 'business') { setScreen(previousScreen || 'tabs'); return true; }
    if (screen === 'bank') { setScreen(previousScreen || 'tabs'); return true; }
    if (screen === 'admin') { setScreen(previousScreen || 'tabs'); return true; }
    if (screen === 'ai') { setScreen('tabs'); setTab('profile'); return true; }
    if (screen === 'equipment-edit' || screen === 'location-edit') { setScreen('account'); return true; }
    if (screen === 'equipment-create' || screen === 'location-create' || screen === 'service-create' || screen === 'video-create') { setScreen('publish'); return true; }
    if (screen === 'account' || screen === 'service-requests') { setScreen('tabs'); setTab('profile'); return true; }
    if (screen === 'service-marketplace') { setScreen(previousScreen || 'tabs'); return true; }
    if (screen === 'publish' || screen === 'request' || screen === 'video-feed' || screen === 'marketplace-browse') { setScreen('tabs'); setTab(screen === 'marketplace-browse' ? 'catalog' : 'home'); return true; }
    setScreen('tabs');
    return true;
  }, [previousScreen, screen, tab]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  }, [handleBack]);

  const loadData = useCallback(async () => {
    setLoading(true); setError('');
    const [categoryResult, listingResult] = await Promise.allSettled([
      apiRequest('/categories/products'),
      apiRequest('/equipment?limit=60'),
    ]);
    if (categoryResult.status === 'fulfilled') setCategories(unwrapArray(categoryResult.value));
    if (listingResult.status === 'fulfilled') setListings(unwrapArray(listingResult.value));
    const failures = [categoryResult, listingResult].filter((result) => result.status === 'rejected');
    if (failures.length === 2) setError('Serverga ulanib bo‘lmadi. Backend manzilini tekshiring.');
    else if (failures.length) setError('Ayrim ma’lumotlar yuklanmadi. Qayta urining.');
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.allSettled([apiRequest('/categories/products'), apiRequest('/equipment?limit=60')]).then(([categoryResult, listingResult]) => {
      if (!active) return;
      if (categoryResult.status === 'fulfilled') setCategories(unwrapArray(categoryResult.value));
      if (listingResult.status === 'fulfilled') setListings(unwrapArray(listingResult.value));
      const failures = [categoryResult, listingResult].filter((result) => result.status === 'rejected');
      if (failures.length === 2) setError('Serverga ulanib bo‘lmadi. Backend manzilini tekshiring.');
      else if (failures.length) setError('Ayrim ma’lumotlar yuklanmadi. Qayta urining.');
      setLoading(false);
    });
    AsyncStorage.getItem('zumo.native.favorites').then((saved) => { if (active && saved) setFavorites(JSON.parse(saved)); }).catch(() => {});
    AsyncStorage.getItem(SESSION_KEY).then(async (saved) => {
      if (!saved || !active) return;
      let session;
      try { session = JSON.parse(saved); } catch { session = { access_token: saved }; }
      if (!session?.access_token) return;
      if (active) setToken(session.access_token);
      const [meResult, profileResult] = await Promise.allSettled([
        apiRequest('/chat/me', { token: session.access_token }),
        apiRequest('/user/profile', { token: session.access_token }),
      ]);
      if (!active) return;
      const profileResponse = profileResult.status === 'fulfilled' ? profileResult.value : {};
      const profileData = profileResponse?.profile || profileResponse?.user || profileResponse?.data?.user || profileResponse?.data || profileResponse;
      const me = meResult.status === 'fulfilled' ? meResult.value : {};
      setUser({ ...profileData, id: me.id || profileData?._id || profileData?.id });
      if ([meResult, profileResult].some((result) => result.status === 'rejected' && result.reason?.status === 401)) {
        await AsyncStorage.removeItem(SESSION_KEY);
        setToken(null);
        setUser(null);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const visibleListings = useMemo(() => listings.filter((item) => {
    const term = query.toLocaleLowerCase();
    const matchesQuery = !term || `${item.title || ''} ${item.description || ''} ${item.category || ''}`.toLocaleLowerCase().includes(term);
    const matchesCategory = !selectedCategory || selectedCategory.id === 'services' || item.level1 === selectedCategory.id || item.category === selectedCategory.id || item.productType === selectedCategory.id;
    return matchesQuery && matchesCategory;
  }), [listings, query, selectedCategory]);

  const goTab = (key) => { setScreen('tabs'); setTab(key); if (key !== 'home') setQuery(''); };
  const openListing = (item) => { setPreviousScreen(screen); setListing(item); setScreen('detail'); };
  const openLocation = (item) => { setPreviousScreen(screen); setLocationListing(item); setScreen('location-detail'); };
  const toggleFavorite = async (item, type = 'equipment') => {
    const id = String(itemId(item) || '');
    if (!id) return;
    const exists = favorites.some((entry) => String(entry.id) === id && entry.type === type);
    const next = exists ? favorites.filter((entry) => !(String(entry.id) === id && entry.type === type)) : [...favorites, { id, type, title: itemTitle(item), image: itemImage(item), price: priceText(item.price || item.price_per_month, item.currency), currency: item.currency || 'UZS', link: `/${type === 'location' ? 'location' : 'equipment'}/${id}`, listing: item, addedAt: new Date().toISOString() }];
    setFavorites(next);
    try { await AsyncStorage.setItem('zumo.native.favorites', JSON.stringify(next)); }
    catch { setFavorites(favorites); Alert.alert('Saqlanmadi', 'E’lonni qurilmada saqlashga ruxsat berilmadi.'); }
  };
  const onCategory = (category) => { setQuery(''); setPreviousScreen('tabs'); setSelectedCategory(category || null); setTab('catalog'); if (category?.id === 'services') { setScreen('service-marketplace'); return; } setScreen('marketplace-browse'); };
  const onLogin = useCallback((newToken, newUser) => { setToken(newToken); setUser(newUser || null); setTab('profile'); setScreen('tabs'); }, []);
  const onLogout = async () => { await AsyncStorage.removeItem(SESSION_KEY); await AsyncStorage.removeItem('zumo.native.access-token'); setToken(null); setUser(null); };
  const addCart = async (item, currentToken) => {
    if (!currentToken) { Alert.alert('Kirish kerak', 'Savatdan foydalanish uchun telefon raqamingiz bilan kiring.'); setTab('profile'); setScreen('tabs'); return; }
    try { await apiRequest('/cart', { token: currentToken, method: 'POST', body: { itemType: 'equipment', itemId: itemId(item) } }); Alert.alert('Savatga qo‘shildi', itemTitle(item)); }
    catch (err) { Alert.alert('Savatga qo‘shilmadi', err.message || 'Qayta urinib ko‘ring.'); }
  };
  const messageSeller = async (item, currentToken) => {
    const target = ownerId(item);
    if (!currentToken) { Alert.alert('Kirish kerak', 'E’lon egasiga yozish uchun avval telefon orqali kiring.'); setTab('profile'); setScreen('tabs'); return; }
    if (!target) { Alert.alert('Sotuvchi topilmadi', 'Ushbu e’lon egasi bilan chat ochib bo‘lmadi.'); return; }
    try {
      await apiRequest('/chat/send', { token: currentToken, method: 'POST', body: { to: target, message: sharedListingMessage('equipment', item) } });
      setChatTarget({ userId: target, fullName: item?.userId?.fullName || item?.user?.fullName || 'E’lon egasi' });
      setTab('chats'); setScreen('tabs');
    } catch (err) { Alert.alert('Xabar yuborilmadi', err.message || 'Qayta urinib ko‘ring.'); }
  };
  const messageLocationOwner = async (item) => {
    const target = ownerId(item);
    if (!token) { Alert.alert('Kirish kerak', 'E’lon egasiga yozish uchun avval telefon orqali kiring.'); setTab('profile'); setScreen('tabs'); return; }
    if (!target) { Alert.alert('E’lon egasi topilmadi', 'Ushbu e’lon egasi bilan chat ochib bo‘lmadi.'); return; }
    try {
      await apiRequest('/chat/send', { token, method: 'POST', body: { to: target, message: sharedListingMessage('location', item) } });
      setChatTarget({ userId: target, fullName: item?.userId?.fullName || item?.userId?.name || 'E’lon egasi' });
      setTab('chats'); setScreen('tabs');
    } catch (err) { Alert.alert('Xabar yuborilmadi', err.message || 'Qayta urinib ko‘ring.'); }
  };
  const openSharedListing = async ({ id, type }) => {
    if (type === 'location') {
      try { const response = await apiRequest(`/locations/${encodeURIComponent(id)}`, { token }); setPreviousScreen(screen); setLocationListing(response?.location || response?.data || response); setScreen('location-detail'); }
      catch (err) { Alert.alert('Joy e’loni ochilmadi', err.message || 'E’lon topilmadi.'); }
      return;
    }
    if (type === 'serviceprovider') {
      setSharedProviderId(id);
      setPreviousScreen(screen);
      setScreen('service-marketplace');
      return;
    }
    if (type !== 'equipment') { Alert.alert('E’lon turi', 'Bu turdagi ulashilgan e’lon bu mobil qismda ochilmaydi.'); return; }
    try {
      const response = await apiRequest(`/equipment/${encodeURIComponent(id)}`, { token });
      const equipment = response?.equipment || response?.data?.equipment || response?.data || response;
      setPreviousScreen(screen); setListing(equipment); setScreen('detail');
    } catch (err) { Alert.alert('E’lon ochilmadi', err.message || 'E’lon topilmadi.'); }
  };

  const openNotification = (notification) => {
    const id = notification?.itemId?._id || notification?.itemId?.id || notification?.itemId;
    if (notification?.type === 'order') {
      if (notification.itemType === 'bank_service') { setPreviousScreen('tabs'); setScreen('bank'); return; }
      setAccountType(notification.orderInfo?.status ? 'orders' : 'received-orders');
      setScreen('account');
      return;
    }
    if (notification?.itemType === 'equipment' && id) { openSharedListing({ id, type: 'equipment' }); return; }
    if (notification?.itemType === 'location' && id) { openSharedListing({ id, type: 'location' }); return; }
    if (notification?.itemType === 'serviceprovider' && id) { openSharedListing({ id, type: 'serviceprovider' }); return; }
    if (notification?.itemType === 'servicerequest') {
      setAccountType(notification.type === 'new_offer' ? 'my-service-requests' : 'provider-requests');
      setScreen('service-requests');
      return;
    }
    if (notification?.itemType === 'bank_service') { setPreviousScreen('tabs'); setScreen('bank'); return; }
    Alert.alert(notification?.title || 'Bildirishnoma', notification?.body || notification?.message || 'Bildirishnoma o‘qildi.');
  };

  let content;
  if (screen === 'business') content = <BusinessScreen token={token} onBack={() => setScreen(previousScreen || 'tabs')} onLogin={() => { setScreen('tabs'); setTab('profile'); }} />;
  else if (screen === 'bank') content = <BankServicesScreen token={token} onBack={() => setScreen(previousScreen || 'tabs')} onLogin={() => { setScreen('tabs'); setTab('profile'); }} />;
  else if (screen === 'admin') content = <AdminScreen token={token} user={user} onBack={() => setScreen(previousScreen || 'tabs')} />;
  else if (screen === 'ai') content = <ZumoAIScreen token={token} onLogin={() => { setScreen('tabs'); setTab('profile'); }} onBack={() => { setScreen('tabs'); setTab('profile'); }} />;
  else if (screen === 'detail' && listing) content = <><Header title="E’lon tafsiloti" onBack={() => setScreen(previousScreen || 'tabs')} /><EquipmentDetailScreen item={listing} onOpenChat={(item) => messageSeller(item, token)} onAddCart={(item) => addCart(item, token)} isFavorite={favorites.some((entry) => String(entry.id) === String(itemId(listing)) && entry.type === 'equipment')} onToggleFavorite={toggleFavorite} related={listings.filter((entry) => String(itemId(entry)) !== String(itemId(listing)) && (entry.level1 === listing.level1 || entry.category === listing.category)).slice(0, 10)} onOpenListing={openListing} /></>;
  else if (screen === 'equipment-edit' && editingEquipment) content = <AddEquipmentScreen categories={categories} token={token} user={user} initialItem={editingEquipment} onLogin={() => { setScreen('tabs'); setTab('profile'); }} onBack={() => setScreen('account')} onPublished={() => { loadData(); setAccountType('listings'); setScreen('account'); }} />;
  else if (screen === 'location-edit' && editingLocation) content = <CreateLocationScreen token={token} user={user} initialLocation={editingLocation} onLogin={() => { setScreen('tabs'); setTab('profile'); }} onBack={() => setScreen('account')} onCreated={() => { setAccountType('locations'); setScreen('account'); }} />;
  else if (screen === 'location-detail' && locationListing) content = <LocationDetailScreen location={locationListing} token={token} onBack={() => setScreen(previousScreen || 'tabs')} onContact={messageLocationOwner} onOpenLocation={openLocation} isFavorite={favorites.some((entry) => String(entry.id) === String(itemId(locationListing)) && entry.type === 'location')} onToggleFavorite={(item) => toggleFavorite(item, 'location')} />;
  else if (screen === 'marketplace-browse') content = <MarketplaceBrowseScreen initialType={selectedCategory?.id === 'locations' ? 'locations' : 'equipment'} initialCategory={selectedCategory?.id === 'locations' ? null : selectedCategory} initialSubcategory={selectedCategory?.selectedSubcategory} initialQuery={query} onBack={() => { setSelectedCategory(null); setQuery(''); setScreen('tabs'); setTab('catalog'); }} onOpenEquipment={openListing} onOpenLocation={openLocation} />;
  else if (screen === 'account') content = <AccountListScreen type={accountType} token={token} favorites={favorites} onBack={() => setScreen('tabs')} onOpenListing={(item) => openListing(item?.listing || item)} onOpenLocation={(item) => openLocation(item?.listing || item)} onOpenNotification={openNotification} onEditListing={(item) => { setEditingEquipment(item); setScreen('equipment-edit'); }} onEditLocation={(item) => { setEditingLocation(item); setScreen('location-edit'); }} onRemoveFavorite={(item) => toggleFavorite(item?.listing || item, item?.type || 'equipment')} />;
  else if (screen === 'service-requests') content = <ServiceRequestsScreen token={token} mode={accountType === 'provider-requests' ? 'provider' : 'mine'} onLogin={() => { setScreen('tabs'); setTab('profile'); }} onBack={() => setScreen('tabs')} />;
  else if (screen === 'request') content = <><Header title="Xizmat so‘rovi" onBack={() => setScreen('tabs')} /><ServiceRequestScreen token={token} onLogin={() => { setScreen('tabs'); setTab('profile'); }} onBack={() => setScreen('tabs')} /></>;
  else if (screen === 'equipment-create') content = <AddEquipmentScreen categories={categories} token={token} user={user} onLogin={() => { setScreen('tabs'); setTab('profile'); }} onBack={() => setScreen('publish')} onPublished={() => { loadData(); setScreen('tabs'); setTab('home'); }} />;
  else if (screen === 'service-create') content = <CreateServiceScreen token={token} user={user} onLogin={() => { setScreen('tabs'); setTab('profile'); }} onBack={() => setScreen('publish')} onCreated={() => { setScreen('tabs'); setTab('profile'); }} />;
  else if (screen === 'video-create') content = <CreateVideoScreen token={token} onLogin={() => { setScreen('tabs'); setTab('profile'); }} onBack={() => setScreen('publish')} onCreated={() => { loadData(); setScreen('tabs'); setTab('home'); }} />;
  else if (screen === 'location-create') content = <CreateLocationScreen token={token} user={user} onLogin={() => { setScreen('tabs'); setTab('profile'); }} onBack={() => setScreen('publish')} onCreated={() => { loadData(); setScreen('tabs'); setTab('home'); }} />;
  else if (screen === 'service-marketplace') content = <ServiceMarketplaceScreen token={token} initialProviderId={sharedProviderId} onProviderOpened={() => setSharedProviderId(null)} onLogin={() => { setScreen('tabs'); setTab('profile'); }} onBack={() => setScreen(previousScreen || 'tabs')} />;
  else if (screen === 'video-feed') content = <VideoFeedScreen token={token} onLogin={() => { setScreen('tabs'); setTab('profile'); }} onBack={() => { setScreen('tabs'); setTab('home'); }} onAddVideo={() => setScreen('video-create')} />;
  else if (screen === 'publish') content = <><Header title="E’lon joylash" onBack={() => setScreen('tabs')} /><PublishScreen onAddEquipment={() => setScreen('equipment-create')} onChoose={(key) => setScreen(key === 'service' ? 'service-create' : key === 'location' ? 'location-create' : 'video-create')} onInfo={(title) => Alert.alert(title, 'Bu e’lon turi keyingi migratsiya bosqichida ulanadi.')} /></>;
  else if (screen === 'tabs' && tab === 'home') content = <HomeScreen categories={categories} listings={visibleListings} loading={loading} error={error} onRetry={loadData} onCategory={onCategory} onListing={openListing} onSearch={(value) => { setQuery(value); setSelectedCategory(null); setPreviousScreen('tabs'); setTab('catalog'); setScreen('marketplace-browse'); }} onVideoFeed={() => setScreen('video-feed')} onAi={() => setScreen('ai')} onTab={(key) => { if (key === 'request') setScreen('request'); else if (key === 'publish') setScreen('publish'); else if (key === 'business') { setPreviousScreen('tabs'); setScreen('business'); } else if (key === 'bank') { setPreviousScreen('tabs'); setScreen('bank'); } else goTab(key); }} />;
  else if (screen === 'tabs' && tab === 'catalog') content = <CatalogScreen categories={categories} onCategory={onCategory} onLocations={() => { setPreviousScreen('tabs'); setSelectedCategory({ id: 'locations' }); setScreen('marketplace-browse'); }} onBack={() => goTab('home')} />;
  else if (screen === 'tabs' && tab === 'cart') content = <CartScreen token={token} onLogin={() => goTab('profile')} onOpenListing={openListing} onMessageSeller={messageSeller} />;
  else if (screen === 'tabs' && tab === 'chats') content = <ChatScreen token={token} onLogin={() => goTab('profile')} target={chatTarget} currentUserId={user?._id || user?.id} onOpenConversation={setChatTarget} onBackToChats={() => setChatTarget(null)} onOpenSharedListing={openSharedListing} />;
  else if (screen === 'tabs' && tab === 'profile') content = <ProfileScreen token={token} user={user} onLogin={onLogin} onLogout={onLogout} onNavigateAccount={(type) => { if (type === 'ai') { setPreviousScreen('tabs'); setScreen('ai'); return; } if (type === 'business') { setPreviousScreen('tabs'); setScreen('business'); return; } if (type === 'admin') { setPreviousScreen('tabs'); setScreen('admin'); return; } setAccountType(type); setScreen(type.includes('service-requests') || type === 'provider-requests' ? 'service-requests' : 'account'); }} />;
  else content = <HomeScreen categories={categories} listings={visibleListings} loading={loading} error={error} onRetry={loadData} onCategory={onCategory} onListing={openListing} onSearch={(value) => { setQuery(value); setSelectedCategory(null); setPreviousScreen('tabs'); setTab('catalog'); setScreen('marketplace-browse'); }} onVideoFeed={() => setScreen('video-feed')} onAi={() => setScreen('ai')} onTab={(key) => key === 'request' ? setScreen('request') : key === 'publish' ? setScreen('publish') : goTab(key)} />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />
      <View style={styles.app}>{content}</View>
      {screen === 'tabs' ? <View style={styles.tabbar}>{tabs.map((entry) => {
        const active = tab === entry.key;
        const isPublish = entry.key === 'publish';
        const TabIcon = entry.icon;
        return <Pressable key={entry.key} onPress={() => isPublish ? setScreen('publish') : goTab(entry.key)} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={entry.label}>
          <View style={[styles.tabGlyphWrap, active && styles.tabGlyphActive, isPublish && styles.publishTab]}>
            <TabIcon color={isPublish ? colors.white : active ? colors.cyanDark : '#8A9BAE'} size={isPublish ? 24 : 22} strokeWidth={isPublish ? 2.6 : 2} />
          </View>
          <Text style={[styles.tabLabel, active && styles.tabLabelOn]}>{entry.label}</Text>
        </Pressable>;
      })}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas }, app: { flex: 1 }, screen: { flex: 1, backgroundColor: colors.canvas },
  tabbar: { height: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line, paddingBottom: Platform.OS === 'ios' ? 3 : 5 }, tab: { minWidth: 54, alignItems: 'center', justifyContent: 'center' }, tabGlyphWrap: { width: 38, height: 33, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }, tabGlyphActive: { backgroundColor: '#E2F8FA' }, tabGlyph: { color: '#92A3B2', fontSize: 25, fontWeight: '700' }, tabGlyphOn: { color: colors.cyanDark }, tabLabel: { color: '#8A9BAE', fontSize: 11, fontWeight: '600', marginTop: 2 }, tabLabelOn: { color: colors.cyanDark, fontWeight: '800' }, publishTab: { width: 44, height: 40, borderRadius: 15, backgroundColor: colors.cyan, marginTop: -15, borderWidth: 4, borderColor: colors.white, ...shadow }, plusGlyph: { color: colors.white, fontSize: 28, marginTop: -3 },
  header: { height: 55, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, backgroundColor: colors.canvas, borderBottomWidth: 1, borderBottomColor: colors.line }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, backGlyph: { color: colors.ink, fontSize: 35, marginTop: -4 }, headerTitle: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '800', marginLeft: 4 },
  detailContent: { paddingBottom: 26 }, detailImage: { width: '100%', height: 280, backgroundColor: '#E6EEF4' }, detailPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDF6F9' }, detailZ: { color: colors.cyan, fontSize: 70, fontWeight: '900' }, detailPanel: { paddingHorizontal: 20, paddingTop: 20 }, detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, saveButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F5F8' }, saveButtonActive: { backgroundColor: '#FFE8EC' }, saveGlyph: { color: colors.ink, fontSize: 24 }, saveGlyphActive: { color: colors.red }, detailPrice: { color: colors.cyanDark, fontSize: 21, fontWeight: '900' }, detailTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', lineHeight: 26, marginTop: 6 }, detailLocation: { color: colors.muted, fontSize: 12, marginTop: 9 }, detailRule: { height: 1, backgroundColor: colors.line, marginVertical: 17 }, detailSection: { color: colors.ink, fontSize: 15, fontWeight: '800' }, detailDescription: { color: '#51687C', fontSize: 13, lineHeight: 20, marginTop: 7 }, ownerCard: { flexDirection: 'row', alignItems: 'center', marginTop: 22, backgroundColor: colors.white, padding: 13, borderRadius: 16 }, ownerAvatar: { height: 44, width: 44, borderRadius: 22, backgroundColor: '#DCF4F7', alignItems: 'center', justifyContent: 'center' }, ownerInitial: { color: colors.cyanDark, fontSize: 18, fontWeight: '900' }, ownerLabel: { color: colors.muted, fontSize: 10 }, ownerName: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 3 }, relatedWrap: { paddingLeft: 20, marginTop: 22 }, relatedRow: { gap: 10, paddingVertical: 10, paddingRight: 20 }, relatedCard: { width: 145, padding: 8, borderRadius: 14, backgroundColor: colors.white }, relatedImage: { width: '100%', height: 92, borderRadius: 10, backgroundColor: '#E6EEF4' }, relatedFallback: { color: colors.cyan, fontSize: 30, fontWeight: '900' }, relatedTitle: { color: colors.ink, fontSize: 11, fontWeight: '700', marginTop: 7, minHeight: 30 }, relatedPrice: { color: colors.cyanDark, fontSize: 11, fontWeight: '800', marginTop: 4 }, detailActions: { flexDirection: 'row', gap: 10, padding: 18 }, contactButton: { flex: 1, minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyan }, contactText: { color: colors.white, fontWeight: '800', fontSize: 13 }, cartButton: { minWidth: 100, minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cyan }, cartText: { color: colors.cyanDark, fontWeight: '800', fontSize: 13 },
  publishContent: { padding: 20, paddingBottom: 30 }, kicker: { color: colors.cyanDark, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginTop: 8 }, screenTitle: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 6 }, screenSub: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 20 }, publishRow: { backgroundColor: colors.white, minHeight: 78, borderRadius: 17, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, marginTop: 9, ...shadow }, publishGlyph: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E4F7F9', marginRight: 12 }, publishGlyphText: { color: colors.cyanDark, fontSize: 23, fontWeight: '800' }, publishTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' }, publishSub: { color: colors.muted, fontSize: 12, marginTop: 4 }, chevron: { color: colors.muted, fontSize: 24, paddingHorizontal: 4 },
  requestContent: { padding: 20, paddingBottom: 35 }, label: { color: colors.ink, fontSize: 13, fontWeight: '800', marginBottom: 8, marginTop: 13 }, field: { minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: '#DDE7EE', backgroundColor: colors.white, paddingHorizontal: 14, color: colors.ink, fontSize: 14 }, directionScroller: { marginTop: 10, maxHeight: 42 }, directionRow: { gap: 7, paddingRight: 10 }, directionChip: { paddingHorizontal: 13, height: 34, justifyContent: 'center', borderRadius: 17, backgroundColor: '#E7EFF5' }, directionChipActive: { backgroundColor: colors.cyan }, directionText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, directionTextActive: { color: colors.white }, selectedCategory: { color: colors.cyanDark, fontSize: 11, fontWeight: '800', marginTop: 10 }, categoryHint: { color: colors.muted, fontSize: 11, marginTop: 10 }, serviceCategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, marginTop: 8 }, serviceCategoryChip: { width: '48.5%', minHeight: 43, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E0EAF1', backgroundColor: colors.white }, serviceCategoryChipSelected: { borderColor: colors.cyan, backgroundColor: '#E3F8FA' }, serviceCategoryText: { color: colors.ink, fontSize: 11, lineHeight: 15, fontWeight: '600' }, serviceCategoryTextSelected: { color: colors.cyanDark, fontWeight: '800' }, multiline: { minHeight: 110, paddingTop: 13 }, submit: { minHeight: 52, borderRadius: 15, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center', marginTop: 19 }, submitText: { color: colors.white, fontWeight: '900', fontSize: 13 }, errorText: { color: colors.red, fontSize: 12, marginTop: 10 },
});
