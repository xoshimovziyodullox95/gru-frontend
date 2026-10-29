import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiRequest, unwrapArray } from '../api';
import { colors, shadow } from '../theme';
import { ChevronDown } from '../icons';
import { BackButton, Chevron } from '../ui';

const roles = { owner: 'Egasi', admin: 'Boshqaruvchi', director: 'Direktor', cashier: 'Kassir', warehouse_worker: 'Omborchi' };
const idOf = (item) => String(item?._id || item?.id || '');
const money = (value) => `${new Intl.NumberFormat('uz-UZ').format(Number(value) || 0)} so‘m`;

export default function BusinessScreen({ token, onBack, onLogin }) {
  const [businesses, setBusinesses] = useState([]);
  const [business, setBusiness] = useState(null);
  const [role, setRole] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [warehouse, setWarehouse] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [pnl, setPnl] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [purchaseSupplier, setPurchaseSupplier] = useState(null);
  const [purchaseProduct, setPurchaseProduct] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState('1');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [staff, setStaff] = useState([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffMatches, setStaffMatches] = useState([]);
  const [selectedStaffUser, setSelectedStaffUser] = useState(null);
  const [staffRole, setStaffRole] = useState('cashier');
  const staffSearchTimer = useRef(null);
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [cart, setCart] = useState([]);
  const [businessName, setBusinessName] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canSeeFinance = ['owner', 'admin', 'director'].includes(role);
  const canManageProducts = ['owner', 'admin', 'warehouse_worker'].includes(role);
  const canSell = ['owner', 'admin', 'cashier'].includes(role);

  const fetchTab = useCallback(async (selectedBusiness, selectedWarehouse, selectedTab, selectedRole) => {
    if (!selectedBusiness) return;
    setLoading(true); setError('');
    const bid = idOf(selectedBusiness);
    try {
      if (selectedTab === 'dashboard') {
        const results = await Promise.allSettled([
          apiRequest(`/business/${bid}/analytics/low-stock`, { token }),
          ['owner', 'admin', 'director'].includes(selectedRole) ? apiRequest(`/business/${bid}/analytics/pnl`, { token }) : Promise.resolve(null),
        ]);
        if (results[0].status === 'rejected') throw results[0].reason;
        setLowStock(unwrapArray(results[0].value));
        if (results[1].status === 'fulfilled') setPnl(results[1].value?.data || results[1].value || null);
      } else if (selectedTab === 'products') {
        setProducts(unwrapArray(await apiRequest(`/business/${bid}/products`, { token })));
      } else if (selectedTab === 'stock' || selectedTab === 'sales') {
        const [productResult, stockResult] = await Promise.all([
          apiRequest(`/business/${bid}/products`, { token }),
          selectedWarehouse ? apiRequest(`/business/${bid}/warehouses/${idOf(selectedWarehouse)}/stock`, { token }) : Promise.resolve([]),
        ]);
        setProducts(unwrapArray(productResult));
        setStock(unwrapArray(stockResult));
      } else if (selectedTab === 'expenses') {
        setExpenses(unwrapArray(await apiRequest(`/business/${bid}/expenses`, { token })));
      } else if (selectedTab === 'suppliers') {
        setSuppliers(unwrapArray(await apiRequest(`/business/${bid}/suppliers`, { token })));
      } else if (selectedTab === 'purchases') {
        const [orderResult, supplierResult, productResult] = await Promise.all([
          apiRequest(`/business/${bid}/purchase-orders`, { token }),
          apiRequest(`/business/${bid}/suppliers`, { token }),
          apiRequest(`/business/${bid}/products`, { token }),
        ]);
        const orderList = unwrapArray(orderResult); const supplierList = unwrapArray(supplierResult); const productList = unwrapArray(productResult);
        setPurchaseOrders(orderList); setSuppliers(supplierList); setProducts(productList);
        setPurchaseSupplier((current) => supplierList.some((item) => idOf(item) === idOf(current)) ? current : (supplierList[0] || null));
        setPurchaseProduct((current) => productList.some((item) => idOf(item) === idOf(current)) ? current : (productList[0] || null));
      } else if (selectedTab === 'staff') {
        setStaff(unwrapArray(await apiRequest(`/business/${bid}/staff`, { token })));
      }
    } catch (err) { setError(err.message || 'Biznes ma’lumotlarini yuklab bo‘lmadi.'); }
    finally { setLoading(false); }
  }, [token]);

  const selectBusiness = useCallback(async (entry, entryRole) => {
    setBusiness(entry); setRole(entryRole || entry.staffRole || 'owner'); setTab('dashboard'); setCart([]); setLoading(true); setError('');
    try {
      const fetchedWarehouses = unwrapArray(await apiRequest(`/business/${idOf(entry)}/warehouses`, { token }));
      const defaultWarehouse = fetchedWarehouses.find((item) => item.isDefault) || fetchedWarehouses[0] || null;
      setWarehouses(fetchedWarehouses); setWarehouse(defaultWarehouse);
      await fetchTab(entry, defaultWarehouse, 'dashboard', entryRole || entry.staffRole || 'owner');
    } catch (err) { setWarehouses([]); setWarehouse(null); setError(err.message || 'Biznes omborlarini yuklab bo‘lmadi.'); setLoading(false); }
  }, [fetchTab, token]);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    apiRequest('/business/mine', { token }).then((response) => {
      if (!active) return;
      const owned = (response?.owned || response?.data?.owned || []).map((item) => ({ ...item, nativeRole: 'owner' }));
      const staffed = (response?.staffed || response?.data?.staffed || []).map((item) => ({ ...item, nativeRole: item.staffRole || 'warehouse_worker' }));
      setBusinesses([...owned, ...staffed]);
      if (owned.length + staffed.length === 1) selectBusiness(owned[0] || staffed[0], (owned[0] || staffed[0]).nativeRole);
    }).catch((err) => { if (active) setError(err.message || 'Bizneslar yuklanmadi.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, selectBusiness]);

  const changeTab = (next) => { setTab(next); setCart([]); fetchTab(business, warehouse, next, role); };
  const retry = async () => {
    if (business) return fetchTab(business, warehouse, tab, role);
    setLoading(true); setError('');
    try {
      const response = await apiRequest('/business/mine', { token });
      const owned = (response?.owned || response?.data?.owned || []).map((item) => ({ ...item, nativeRole: 'owner' }));
      const staffed = (response?.staffed || response?.data?.staffed || []).map((item) => ({ ...item, nativeRole: item.staffRole || 'warehouse_worker' }));
      setBusinesses([...owned, ...staffed]);
    } catch (err) { setError(err.message || 'Bizneslar yuklanmadi.'); }
    finally { setLoading(false); }
  };
  const createBusiness = async () => {
    if (!businessName.trim() || busy) return;
    setBusy(true); setError('');
    try {
      const created = await apiRequest('/business', { token, method: 'POST', body: { name: businessName.trim(), type: 'store' } });
      const entry = created?.business || created?.data || created;
      setBusinessName(''); setBusinesses((previous) => [...previous, { ...entry, nativeRole: 'owner' }]);
      await selectBusiness(entry, 'owner');
    } catch (err) { setError(err.message || 'Biznes yaratilmadi.'); }
    finally { setBusy(false); }
  };
  const createProduct = async () => {
    if (!newProductName.trim() || Number(sellPrice) <= 0 || busy) return;
    setBusy(true); setError('');
    try {
      await apiRequest(`/business/${idOf(business)}/products`, { token, method: 'POST', body: { name: newProductName.trim(), unit: 'dona', sellPrice: Number(sellPrice), costPrice: 0, minStockThreshold: 0 } });
      setNewProductName(''); setSellPrice(''); await fetchTab(business, warehouse, 'products', role);
    } catch (err) { setError(err.message || 'Mahsulot qo‘shilmadi.'); }
    finally { setBusy(false); }
  };
  const createWarehouse = async () => {
    if (!newWarehouseName.trim() || busy) return;
    setBusy(true); setError('');
    try {
      const created = await apiRequest(`/business/${idOf(business)}/warehouses`, { token, method: 'POST', body: { name: newWarehouseName.trim() } });
      const entry = created?.warehouse || created?.data || created;
      setWarehouses((current) => [...current, entry]); setWarehouse(entry); setNewWarehouseName('');
      await fetchTab(business, entry, tab, role);
    } catch (err) { setError(err.message || 'Ombor yaratilmadi.'); }
    finally { setBusy(false); }
  };
  const adjustStock = async (product, direction) => {
    if (!warehouse || busy) return;
    setBusy(true); setError('');
    try {
      await apiRequest(`/business/${idOf(business)}/warehouses/${idOf(warehouse)}/stock/adjust`, { token, method: 'POST', body: { productId: idOf(product), quantity: 1, direction, note: 'ZUMO mobil ilovasida qoldiq tuzatildi' } });
      await fetchTab(business, warehouse, 'stock', role);
    } catch (err) { setError(err.message || 'Qoldiq yangilanmadi.'); }
    finally { setBusy(false); }
  };
  const checkout = async () => {
    if (!cart.length || !warehouse || busy) return;
    setBusy(true); setError('');
    try {
      const result = await apiRequest(`/business/${idOf(business)}/sales`, { token, method: 'POST', body: { warehouseId: idOf(warehouse), items: cart.map(({ productId, quantity }) => ({ productId, quantity })), paymentType: 'cash' } });
      Alert.alert('Sotuv saqlandi', `Jami: ${money(result?.total || result?.sale?.total)}`);
      setCart([]); await fetchTab(business, warehouse, 'sales', role);
    } catch (err) { setError(err.message || 'Sotuvni saqlab bo‘lmadi.'); }
    finally { setBusy(false); }
  };
  const addExpense = async () => {
    if (!expenseCategory.trim() || Number(expenseAmount) <= 0 || busy) return;
    setBusy(true); setError('');
    try {
      await apiRequest(`/business/${idOf(business)}/expenses`, { token, method: 'POST', body: { category: expenseCategory.trim(), amount: Number(expenseAmount), description: expenseDescription.trim() } });
      setExpenseCategory(''); setExpenseAmount(''); setExpenseDescription(''); await fetchTab(business, warehouse, 'expenses', role);
    } catch (err) { setError(err.message || 'Xarajat saqlanmadi.'); }
    finally { setBusy(false); }
  };
  const addSupplier = async () => {
    if (!supplierName.trim() || busy) return;
    setBusy(true); setError('');
    try {
      await apiRequest(`/business/${idOf(business)}/suppliers`, { token, method: 'POST', body: { name: supplierName.trim(), phone: supplierPhone.trim() } });
      setSupplierName(''); setSupplierPhone(''); await fetchTab(business, warehouse, 'suppliers', role);
    } catch (err) { setError(err.message || 'Yetkazib beruvchi saqlanmadi.'); }
    finally { setBusy(false); }
  };
  const createPurchase = async () => {
    const quantity = Number(purchaseQuantity); const unitCost = Number(purchaseCost || purchaseProduct?.costPrice);
    if (!warehouse || !purchaseSupplier || !purchaseProduct || quantity <= 0 || unitCost <= 0 || busy) return;
    setBusy(true); setError('');
    try {
      await apiRequest(`/business/${idOf(business)}/purchase-orders`, { token, method: 'POST', body: { warehouseId: idOf(warehouse), supplierId: idOf(purchaseSupplier), items: [{ productId: idOf(purchaseProduct), quantity, unitCost }] } });
      setPurchaseQuantity('1'); setPurchaseCost(''); await fetchTab(business, warehouse, 'purchases', role);
    } catch (err) { setError(err.message || 'Xarid hujjati yaratilmadi.'); }
    finally { setBusy(false); }
  };
  const purchaseAction = async (order, action) => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const orderId = idOf(order);
      if (action === 'receive') await apiRequest(`/business/${idOf(business)}/purchase-orders/${orderId}/receive`, { token, method: 'POST', body: {} });
      else {
        const remaining = Math.max(0, Number(order.totalCost) - Number(order.paidAmount));
        if (remaining <= 0) return;
        await apiRequest(`/business/${idOf(business)}/purchase-orders/${orderId}/pay`, { token, method: 'POST', body: { amount: remaining } });
      }
      await fetchTab(business, warehouse, 'purchases', role);
    } catch (err) { setError(err.message || 'Xarid hujjati yangilanmadi.'); }
    finally { setBusy(false); }
  };
  const searchStaff = (value) => {
    setStaffSearch(value); setSelectedStaffUser(null); setStaffMatches([]);
    if (staffSearchTimer.current) clearTimeout(staffSearchTimer.current);
    if (!value.trim()) return;
    staffSearchTimer.current = setTimeout(async () => {
      try { setStaffMatches(unwrapArray(await apiRequest(`/users/search?q=${encodeURIComponent(value.trim())}`, { token }))); }
      catch (err) { setError(err.message || 'Foydalanuvchi topilmadi.'); }
    }, 350);
  };
  const addStaff = async () => {
    if (!selectedStaffUser || busy) return;
    setBusy(true); setError('');
    try {
      await apiRequest(`/business/${idOf(business)}/staff`, { token, method: 'POST', body: { userId: idOf(selectedStaffUser), role: staffRole } });
      setStaffSearch(''); setSelectedStaffUser(null); setStaffMatches([]); await fetchTab(business, warehouse, 'staff', role);
    } catch (err) { setError(err.message || 'Xodim qo‘shilmadi.'); }
    finally { setBusy(false); }
  };
  const updateStaff = async (member, nextRole) => {
    setBusy(true); setError('');
    try { await apiRequest(`/business/${idOf(business)}/staff/${idOf(member)}`, { token, method: 'PUT', body: { role: nextRole } }); await fetchTab(business, warehouse, 'staff', role); }
    catch (err) { setError(err.message || 'Xodim roli yangilanmadi.'); }
    finally { setBusy(false); }
  };
  const removeStaffMember = (member) => Alert.alert('Xodimni olib tashlash', `${member.userId?.fullName || 'Xodim'} biznesdan chiqarilsinmi?`, [{ text: 'Bekor qilish', style: 'cancel' }, { text: 'Olib tashlash', style: 'destructive', onPress: async () => { setBusy(true); setError(''); try { await apiRequest(`/business/${idOf(business)}/staff/${idOf(member)}`, { token, method: 'DELETE', body: {} }); await fetchTab(business, warehouse, 'staff', role); } catch (err) { setError(err.message || 'Xodim chiqarilmadi.'); } finally { setBusy(false); } } }]);
  const stockMap = useMemo(() => new Map(stock.map((item) => [idOf(item.productId), Number(item.quantity) || 0])), [stock]);
  const cartTotal = cart.reduce((sum, line) => sum + (Number(line.product?.sellPrice) || 0) * line.quantity, 0);

  if (!token) return <View style={styles.center}><Text style={styles.title}>ZUMO Biznes</Text><Text style={styles.note}>Biznes hisobini yuritish uchun telefon orqali kiring.</Text><Pressable style={styles.primary} onPress={onLogin}><Text style={styles.primaryText}>Kirish</Text></Pressable></View>;

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><BackButton onPress={onBack} /><View style={{ flex: 1 }}><Text style={styles.title}>ZUMO Biznes</Text><Text style={styles.note}>Do‘koningizdagi tovar, qoldiq va sotuv hisobi</Text></View></View>
    {error ? <Pressable onPress={retry} style={styles.error}><Text style={styles.errorText}>{error} · Qayta urinish</Text></Pressable> : null}
    {!business && loading ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 22 }} /> : null}
    {!business ? <>
      <View style={styles.infoCard}><Text style={styles.cardTitle}>Kichik biznes hisobi — bir joyda</Text><Text style={styles.note}>Mahsulot qo‘shing, ombordagi qoldiqni kuzating va sotuvni kassada qayd qiling. Bu ma’lumotlar faqat biznesingiz va xodimlaringizga ko‘rinadi.</Text></View>
      {businesses.map((entry) => <Pressable key={idOf(entry)} onPress={() => selectBusiness(entry, entry.nativeRole)} style={styles.businessRow}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{entry.name}</Text><Text style={styles.note}>{roles[entry.nativeRole] || 'Xodim'}</Text></View><Chevron /></Pressable>)}
      <View style={styles.formCard}><Text style={styles.cardTitle}>Biznes qo‘shish</Text><TextInput value={businessName} onChangeText={setBusinessName} placeholder="Do‘kon yoki biznes nomi" style={styles.input} placeholderTextColor="#90A1B1" /><Pressable disabled={!businessName.trim() || busy} onPress={createBusiness} style={[styles.primary, (!businessName.trim() || busy) && styles.disabled]}>{busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Biznes yaratish</Text>}</Pressable></View>
    </> : <>
      <Pressable onPress={() => setBusiness(null)} style={styles.businessSelector}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{business.name}</Text><Text style={styles.note}>{roles[role] || 'Xodim'} · {warehouse?.name || 'Ombor tanlanmagan'}</Text></View><ChevronDown color={colors.muted} size={18} strokeWidth={2.2} /></Pressable>
      {warehouses.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{warehouses.map((item) => <Pressable key={idOf(item)} onPress={() => { setWarehouse(item); fetchTab(business, item, tab, role); }} style={[styles.tab, idOf(item) === idOf(warehouse) && styles.tabActive]}><Text style={[styles.tabText, idOf(item) === idOf(warehouse) && styles.tabTextActive]}>{item.name}</Text></Pressable>)}</ScrollView> : null}
      {['owner', 'admin'].includes(role) ? <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}><TextInput value={newWarehouseName} onChangeText={setNewWarehouseName} placeholder="Yangi ombor nomi" style={[styles.input, { flex: 1, marginTop: 0 }]} placeholderTextColor="#90A1B1" /><Pressable disabled={!newWarehouseName.trim() || busy} onPress={createWarehouse} style={[{ minHeight: 46, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 11, borderRadius: 12, backgroundColor: colors.cyan }, (!newWarehouseName.trim() || busy) && styles.disabled]}><Text style={styles.primaryText}>Ombor qo‘shish</Text></Pressable></View> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{[['dashboard', 'Ko‘rsatkichlar'], ['products', 'Tovarlar'], ['stock', 'Ombor'], ['sales', 'Kassa'], ...(canManageProducts ? [['purchases', 'Xaridlar']] : []), ...(canSeeFinance ? [['expenses', 'Xarajatlar']] : []), ...(['owner', 'admin'].includes(role) ? [['suppliers', 'Ta’minotchilar'], ['staff', 'Xodimlar']] : [])].map(([key, label]) => <Pressable key={key} onPress={() => changeTab(key)} style={[styles.tab, tab === key && styles.tabActive]}><Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text></Pressable>)}</ScrollView>
      {loading ? <ActivityIndicator color={colors.cyan} style={{ marginTop: 25 }} /> : null}
      {tab === 'dashboard' && !loading ? <>
        {canSeeFinance && pnl ? <View style={styles.stats}><View style={styles.stat}><Text style={styles.statLabel}>Sotuv</Text><Text style={styles.statValue}>{money(pnl.totalRevenue)}</Text></View><View style={styles.stat}><Text style={styles.statLabel}>Sof foyda</Text><Text style={styles.statValue}>{money(pnl.netProfit)}</Text></View></View> : <View style={styles.infoCard}><Text style={styles.cardTitle}>Biznesingiz nazorat ostida</Text><Text style={styles.note}>Tovar qo‘shing, keyin kassadan sotuv kiriting. Qoldiq avtomatik yangilanadi.</Text></View>}
        <Text style={styles.sectionTitle}>Kam qolgan mahsulotlar</Text>{lowStock.length ? lowStock.map((entry, index) => <View key={idOf(entry.product) || index} style={styles.row}><Text style={[styles.cardTitle, { flex: 1 }]}>{entry.product?.name || 'Mahsulot'}</Text><Text style={styles.note}>{entry.totalQty ?? 0} qoldi</Text></View>) : <Text style={styles.note}>Hozircha kam qolgan mahsulot yo‘q.</Text>}
      </> : null}
      {tab === 'products' && !loading ? <>
        {canManageProducts ? <View style={styles.formCard}><Text style={styles.cardTitle}>Yangi mahsulot</Text><TextInput value={newProductName} onChangeText={setNewProductName} placeholder="Mahsulot nomi" style={styles.input} placeholderTextColor="#90A1B1" /><TextInput value={sellPrice} onChangeText={(value) => setSellPrice(value.replace(/[^\d]/g, ''))} placeholder="Sotuv narxi (so‘m)" keyboardType="number-pad" style={styles.input} placeholderTextColor="#90A1B1" /><Pressable disabled={!newProductName.trim() || Number(sellPrice) <= 0 || busy} onPress={createProduct} style={[styles.primary, busy && styles.disabled]}>{busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Mahsulot qo‘shish</Text>}</Pressable></View> : <Text style={styles.note}>Mahsulot qo‘shish uchun biznes egasi, boshqaruvchi yoki omborchi ruxsati kerak.</Text>}
        {products.map((product) => <View key={idOf(product)} style={styles.row}><Text style={[styles.cardTitle, { flex: 1 }]}>{product.name}</Text><Text style={styles.price}>{money(product.sellPrice)}</Text></View>)}
      </> : null}
      {tab === 'stock' && !loading ? products.length ? products.map((product) => { const quantity = stockMap.get(idOf(product)) || 0; const adjustStyle = { minWidth: 39, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E1F7F9' }; return <View key={idOf(product)} style={styles.row}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{product.name}</Text><Text style={styles.note}>Qoldiq: {quantity} {product.unit || 'dona'}</Text></View>{['owner', 'admin', 'warehouse_worker'].includes(role) ? <View style={{ flexDirection: 'row', gap: 6 }}><Pressable disabled={!quantity || busy} onPress={() => adjustStock(product, 'decrease')} style={[adjustStyle, !quantity && styles.disabled]}><Text style={styles.addText}>−1</Text></Pressable><Pressable disabled={busy} onPress={() => adjustStock(product, 'increase')} style={[adjustStyle, busy && styles.disabled]}><Text style={styles.addText}>+1</Text></Pressable></View> : null}</View>; }) : <View style={styles.infoCard}><Text style={styles.cardTitle}>Ombor bo‘sh</Text><Text style={styles.note}>Avval “Tovarlar” bo‘limidan mahsulot qo‘shing.</Text></View> : null}
      {tab === 'sales' && !loading ? canSell ? <>
        {products.map((product) => { const quantity = stockMap.get(idOf(product)) || 0; const cartItem = cart.find((item) => item.productId === idOf(product)); return <View key={idOf(product)} style={styles.row}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{product.name}</Text><Text style={styles.note}>{money(product.sellPrice)} · Omborda {quantity} ta</Text></View><Pressable disabled={quantity <= (cartItem?.quantity || 0)} onPress={() => setCart((current) => { const existing = current.find((item) => item.productId === idOf(product)); return existing ? current.map((item) => item.productId === idOf(product) ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { productId: idOf(product), product, quantity: 1 }]; })} style={styles.addButton}><Text style={styles.addText}>{cartItem ? `+ ${cartItem.quantity}` : '+ Qo‘shish'}</Text></Pressable></View>; })}
        <View style={styles.formCard}><Text style={styles.cardTitle}>Savat jami: {money(cartTotal)}</Text><Pressable disabled={!cart.length || busy} onPress={checkout} style={[styles.primary, (!cart.length || busy) && styles.disabled]}>{busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Naqd sotuvni saqlash</Text>}</Pressable></View>
      </> : <Text style={styles.note}>Sotuv kiritish uchun biznes egasi, boshqaruvchi yoki kassir ruxsati kerak.</Text> : null}
      {tab === 'expenses' && !loading ? <>
        {canSeeFinance ? <View style={styles.formCard}><Text style={styles.cardTitle}>Xarajat qayd etish</Text><TextInput value={expenseCategory} onChangeText={setExpenseCategory} placeholder="Turi (masalan, ijara)" style={styles.input} placeholderTextColor="#90A1B1" /><TextInput value={expenseAmount} onChangeText={(value) => setExpenseAmount(value.replace(/[^\d]/g, ''))} placeholder="Summa (so‘m)" keyboardType="number-pad" style={styles.input} placeholderTextColor="#90A1B1" /><TextInput value={expenseDescription} onChangeText={setExpenseDescription} placeholder="Izoh (ixtiyoriy)" style={styles.input} placeholderTextColor="#90A1B1" /><Pressable disabled={!expenseCategory.trim() || Number(expenseAmount) <= 0 || busy} onPress={addExpense} style={[styles.primary, busy && styles.disabled]}><Text style={styles.primaryText}>Xarajatni saqlash</Text></Pressable></View> : <Text style={styles.note}>Xarajatlarni ko‘rish uchun rahbar ruxsati kerak.</Text>}
        {expenses.map((item) => <View key={idOf(item)} style={styles.row}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.category}</Text><Text style={styles.note}>{item.description || new Date(item.date || item.createdAt).toLocaleDateString('uz-UZ')}</Text></View><Text style={styles.price}>{money(item.amount)}</Text></View>)}
      </> : null}
      {tab === 'purchases' && !loading ? <>
        {purchaseOrders.length === 0 ? <View style={styles.infoCard}><Text style={styles.cardTitle}>Hali xarid hujjati yo‘q</Text><Text style={styles.note}>Yetkazib beruvchini tanlang, mahsulot va miqdorni kiriting. Tovar kelganda qabul qilish tugmasi qoldiqni oshiradi.</Text></View> : null}
        {['owner', 'admin', 'warehouse_worker'].includes(role) ? suppliers.length && products.length ? <View style={styles.formCard}><Text style={styles.cardTitle}>Yangi xarid hujjati</Text><Text style={styles.note}>Yetkazib beruvchi</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{suppliers.map((item) => <Pressable key={idOf(item)} onPress={() => setPurchaseSupplier(item)} style={[styles.tab, idOf(item) === idOf(purchaseSupplier) && styles.tabActive]}><Text style={[styles.tabText, idOf(item) === idOf(purchaseSupplier) && styles.tabTextActive]}>{item.name}</Text></Pressable>)}</ScrollView><Text style={styles.note}>Mahsulot</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{products.map((item) => <Pressable key={idOf(item)} onPress={() => { setPurchaseProduct(item); setPurchaseCost(String(item.costPrice || '')); }} style={[styles.tab, idOf(item) === idOf(purchaseProduct) && styles.tabActive]}><Text style={[styles.tabText, idOf(item) === idOf(purchaseProduct) && styles.tabTextActive]}>{item.name}</Text></Pressable>)}</ScrollView><View style={{ flexDirection: 'row', gap: 8 }}><TextInput value={purchaseQuantity} onChangeText={(value) => setPurchaseQuantity(value.replace(/[^\d]/g, ''))} placeholder="Miqdor" keyboardType="number-pad" style={[styles.input, { flex: 1 }]} placeholderTextColor="#90A1B1" /><TextInput value={purchaseCost} onChangeText={(value) => setPurchaseCost(value.replace(/[^\d]/g, ''))} placeholder="Tannarxi / dona" keyboardType="number-pad" style={[styles.input, { flex: 1 }]} placeholderTextColor="#90A1B1" /></View><Pressable disabled={!purchaseSupplier || !purchaseProduct || Number(purchaseQuantity) <= 0 || Number(purchaseCost || purchaseProduct?.costPrice) <= 0 || busy} onPress={createPurchase} style={[styles.primary, busy && styles.disabled]}><Text style={styles.primaryText}>Xarid hujjatini yaratish</Text></Pressable></View> : <Text style={styles.note}>Avval mahsulot va ta’minotchi qo‘shing.</Text> : <Text style={styles.note}>Xarid hujjati yaratish uchun ombor ruxsati kerak.</Text>}
        {purchaseOrders.map((order) => { const supplier = typeof order.supplierId === 'object' ? order.supplierId?.name : suppliers.find((item) => idOf(item) === idOf(order.supplierId))?.name; const remaining = Math.max(0, Number(order.totalCost) - Number(order.paidAmount)); return <View key={idOf(order)} style={styles.formCard}><Text style={styles.cardTitle}>{supplier || 'Ta’minotchi'} · {money(order.totalCost)}</Text><Text style={styles.note}>Holati: {order.status === 'pending' ? 'Kutilmoqda' : order.status === 'received' ? 'Qabul qilingan' : order.status}</Text><Text style={styles.note}>To‘langan: {money(order.paidAmount)} · Qoldiq: {money(remaining)}</Text>{order.status === 'pending' && ['owner', 'admin', 'warehouse_worker'].includes(role) ? <Pressable disabled={busy} onPress={() => purchaseAction(order, 'receive')} style={styles.primary}><Text style={styles.primaryText}>Tovarni omborga qabul qilish</Text></Pressable> : null}{order.status === 'received' && remaining > 0 && ['owner', 'admin'].includes(role) ? <Pressable disabled={busy} onPress={() => purchaseAction(order, 'pay')} style={styles.addButton}><Text style={styles.addText}>Qolgan qarzni to‘lash</Text></Pressable> : null}</View>; })}
      </> : null}
      {tab === 'staff' && !loading ? <>
        {['owner', 'admin'].includes(role) ? <View style={styles.formCard}><Text style={styles.cardTitle}>Xodim qo‘shish</Text><TextInput value={staffSearch} onChangeText={searchStaff} placeholder="Ism yoki email bo‘yicha qidirish" style={styles.input} placeholderTextColor="#90A1B1" />{staffMatches.map((person) => <Pressable key={idOf(person)} onPress={() => { setSelectedStaffUser(person); setStaffMatches([]); setStaffSearch(person.fullName || person.email || ''); }} style={styles.row}><Text style={[styles.cardTitle, { flex: 1 }]}>{person.fullName || person.email}</Text><Text style={styles.note}>{person.email || ''}</Text></Pressable>)}{selectedStaffUser ? <><Text style={styles.note}>Vazifasi</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{[['cashier', 'Kassir'], ['warehouse_worker', 'Omborchi'], ['director', 'Direktor'], ['admin', 'Boshqaruvchi']].map(([value, label]) => <Pressable key={value} onPress={() => setStaffRole(value)} style={[styles.tab, staffRole === value && styles.tabActive]}><Text style={[styles.tabText, staffRole === value && styles.tabTextActive]}>{label}</Text></Pressable>)}</ScrollView><Pressable disabled={busy} onPress={addStaff} style={[styles.primary, busy && styles.disabled]}><Text style={styles.primaryText}>Xodimni qo‘shish</Text></Pressable></> : null}</View> : <Text style={styles.note}>Xodimlarni boshqarish uchun biznes egasi yoki boshqaruvchi ruxsati kerak.</Text>}
        {staff.map((member) => <View key={idOf(member)} style={styles.formCard}><Text style={styles.cardTitle}>{member.userId?.fullName || member.userId?.phone || member.userId?.email || 'Xodim'}</Text><Text style={styles.note}>{member.userId?.phone || member.userId?.email || 'Aloqa ma’lumoti yo‘q'}</Text>{['owner', 'admin'].includes(role) ? <><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{[['cashier', 'Kassir'], ['warehouse_worker', 'Omborchi'], ['director', 'Direktor'], ['admin', 'Boshqaruvchi']].map(([value, label]) => <Pressable key={value} onPress={() => value !== member.role && updateStaff(member, value)} style={[styles.tab, member.role === value && styles.tabActive]}><Text style={[styles.tabText, member.role === value && styles.tabTextActive]}>{label}</Text></Pressable>)}</ScrollView><Pressable onPress={() => removeStaffMember(member)} style={styles.removeButton}><Text style={styles.removeText}>Xodimni olib tashlash</Text></Pressable></> : <Text style={styles.note}>Roli: {roles[member.role] || member.role}</Text>}</View>)}
      </> : null}
      {tab === 'suppliers' && !loading ? <>
        {['owner', 'admin'].includes(role) ? <View style={styles.formCard}><Text style={styles.cardTitle}>Yetkazib beruvchi qo‘shish</Text><TextInput value={supplierName} onChangeText={setSupplierName} placeholder="Kompaniya yoki shaxs nomi" style={styles.input} placeholderTextColor="#90A1B1" /><TextInput value={supplierPhone} onChangeText={setSupplierPhone} placeholder="Telefon (ixtiyoriy)" keyboardType="phone-pad" style={styles.input} placeholderTextColor="#90A1B1" /><Pressable disabled={!supplierName.trim() || busy} onPress={addSupplier} style={[styles.primary, busy && styles.disabled]}><Text style={styles.primaryText}>Saqlash</Text></Pressable></View> : <Text style={styles.note}>Ta’minotchilarni boshqarish uchun rahbar ruxsati kerak.</Text>}
        {suppliers.map((item) => <View key={idOf(item)} style={styles.row}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.note}>{item.phone || 'Telefon kiritilmagan'}</Text></View><Text style={styles.note}>Qarz: {money(item.totalOwed)}</Text></View>)}
      </> : null}
    </>}
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 18, paddingBottom: 35 }, center: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.canvas }, header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 }, back: { width: 40, height: 42, justifyContent: 'center' }, backGlyph: { color: colors.ink, fontSize: 32 }, title: { color: colors.ink, fontSize: 23, fontWeight: '900' }, note: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 }, cardTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, arrow: { color: colors.muted, fontSize: 24 }, infoCard: { backgroundColor: '#E5F7F9', borderRadius: 17, padding: 16, marginTop: 10 }, businessRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, backgroundColor: colors.white, marginTop: 9, ...shadow }, businessSelector: { flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: 15, backgroundColor: colors.white, ...shadow }, formCard: { backgroundColor: colors.white, padding: 15, borderRadius: 17, marginTop: 12, ...shadow }, input: { minHeight: 47, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, color: colors.ink, marginTop: 10, backgroundColor: '#FAFCFD' }, primary: { minHeight: 47, justifyContent: 'center', alignItems: 'center', borderRadius: 13, backgroundColor: colors.cyan, marginTop: 10 }, primaryText: { color: colors.white, fontWeight: '800', fontSize: 12 }, disabled: { opacity: 0.48 }, tabs: { gap: 7, paddingVertical: 12 }, tab: { paddingHorizontal: 13, minHeight: 36, borderRadius: 18, justifyContent: 'center', backgroundColor: '#E7EFF5' }, tabActive: { backgroundColor: colors.cyan }, tabText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, tabTextActive: { color: colors.white }, stats: { flexDirection: 'row', gap: 9, marginTop: 4 }, stat: { flex: 1, borderRadius: 15, backgroundColor: colors.white, padding: 14, ...shadow }, statLabel: { color: colors.muted, fontSize: 10 }, statValue: { color: colors.ink, fontSize: 15, fontWeight: '900', marginTop: 6 }, sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 18, marginBottom: 5 }, row: { flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: 14, backgroundColor: colors.white, marginTop: 8, ...shadow }, price: { color: colors.cyanDark, fontSize: 12, fontWeight: '800' }, addButton: { borderRadius: 11, paddingHorizontal: 11, minHeight: 35, justifyContent: 'center', backgroundColor: '#E1F7F9' }, addText: { color: colors.cyanDark, fontSize: 11, fontWeight: '800' }, removeButton: { padding: 9, alignSelf: 'flex-start', marginTop: 8 }, removeText: { color: colors.red, fontSize: 11, fontWeight: '800' }, error: { backgroundColor: '#FFF0F1', borderRadius: 12, padding: 12, marginVertical: 9 }, errorText: { color: colors.red, fontSize: 12 } });
