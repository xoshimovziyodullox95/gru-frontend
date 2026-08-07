import api from './api';

// ==================== BIZNES ====================
export const createBusiness = (data) => api.post('/business', data);
export const getMyBusinesses = () => api.get('/business/mine');
export const getBusiness = (businessId) => api.get(`/business/${businessId}`);
export const updateBusiness = (businessId, data) => api.put(`/business/${businessId}`, data);

// ==================== XODIMLAR ====================
export const addStaff = (businessId, data) => api.post(`/business/${businessId}/staff`, data);
export const getStaff = (businessId) => api.get(`/business/${businessId}/staff`);
export const updateStaffRole = (businessId, staffId, role) => api.put(`/business/${businessId}/staff/${staffId}`, { role });
export const removeStaff = (businessId, staffId) => api.delete(`/business/${businessId}/staff/${staffId}`);

// ==================== OMBORLAR ====================
export const createWarehouse = (businessId, data) => api.post(`/business/${businessId}/warehouses`, data);
export const getWarehouses = (businessId) => api.get(`/business/${businessId}/warehouses`);
export const updateWarehouse = (businessId, warehouseId, data) => api.put(`/business/${businessId}/warehouses/${warehouseId}`, data);
export const deleteWarehouse = (businessId, warehouseId) => api.delete(`/business/${businessId}/warehouses/${warehouseId}`);

// ==================== MAHSULOTLAR ====================
export const createProduct = (businessId, data) => api.post(`/business/${businessId}/products`, data);
export const getProducts = (businessId, params) => api.get(`/business/${businessId}/products`, { params });
export const getProductByBarcode = (businessId, barcode) => api.get(`/business/${businessId}/products/barcode/${barcode}`);
export const updateProduct = (businessId, productId, data) => api.put(`/business/${businessId}/products/${productId}`, data);
export const deleteProduct = (businessId, productId) => api.delete(`/business/${businessId}/products/${productId}`);

// ==================== STOK ====================
export const getStock = (businessId, warehouseId) => api.get(`/business/${businessId}/warehouses/${warehouseId}/stock`);
export const getStockMovements = (businessId, params) => api.get(`/business/${businessId}/stock-movements`, { params });
export const adjustStock = (businessId, warehouseId, data) => api.post(`/business/${businessId}/warehouses/${warehouseId}/stock/adjust`, data);

// ==================== YETKAZIB BERUVCHILAR ====================
export const createSupplier = (businessId, data) => api.post(`/business/${businessId}/suppliers`, data);
export const getSuppliers = (businessId) => api.get(`/business/${businessId}/suppliers`);
export const updateSupplier = (businessId, supplierId, data) => api.put(`/business/${businessId}/suppliers/${supplierId}`, data);
export const deleteSupplier = (businessId, supplierId) => api.delete(`/business/${businessId}/suppliers/${supplierId}`);

// ==================== TOVAR QABULI (PURCHASE ORDERS) ====================
export const createPurchaseOrder = (businessId, data) => api.post(`/business/${businessId}/purchase-orders`, data);
export const getPurchaseOrders = (businessId) => api.get(`/business/${businessId}/purchase-orders`);
export const getPurchaseOrder = (businessId, poId) => api.get(`/business/${businessId}/purchase-orders/${poId}`);
export const receivePurchaseOrder = (businessId, poId) => api.post(`/business/${businessId}/purchase-orders/${poId}/receive`);
export const payPurchaseOrder = (businessId, poId, amount) => api.post(`/business/${businessId}/purchase-orders/${poId}/pay`, { amount });

// ==================== OMBORLARARO KO'CHIRISH ====================
export const createTransfer = (businessId, data) => api.post(`/business/${businessId}/transfers`, data);

// ==================== INVENTARIZATSIYA (SVERKA) ====================
export const startInventoryCount = (businessId, warehouseId) => api.post(`/business/${businessId}/inventory-counts`, { warehouseId });
export const getInventoryCounts = (businessId) => api.get(`/business/${businessId}/inventory-counts`);
export const getInventoryCount = (businessId, countId) => api.get(`/business/${businessId}/inventory-counts/${countId}`);
export const updateInventoryCountItem = (businessId, countId, data) => api.put(`/business/${businessId}/inventory-counts/${countId}/items`, data);
export const completeInventoryCount = (businessId, countId) => api.post(`/business/${businessId}/inventory-counts/${countId}/complete`);

// ==================== MIJOZLAR ====================
export const createCustomer = (businessId, data) => api.post(`/business/${businessId}/customers`, data);
export const getCustomers = (businessId) => api.get(`/business/${businessId}/customers`);
export const updateCustomer = (businessId, customerId, data) => api.put(`/business/${businessId}/customers/${customerId}`, data);
export const deleteCustomer = (businessId, customerId) => api.delete(`/business/${businessId}/customers/${customerId}`);
export const getCustomerDebtHistory = (businessId, customerId) => api.get(`/business/${businessId}/customers/${customerId}/debt-history`);

// ==================== SOTUVLAR (POS) ====================
export const createSale = (businessId, data) => api.post(`/business/${businessId}/sales`, data);
export const getSales = (businessId, params) => api.get(`/business/${businessId}/sales`, { params });
export const getSale = (businessId, saleId) => api.get(`/business/${businessId}/sales/${saleId}`);
export const refundSale = (businessId, saleId) => api.post(`/business/${businessId}/sales/${saleId}/refund`);

// ==================== XARAJATLAR ====================
export const createExpense = (businessId, data) => api.post(`/business/${businessId}/expenses`, data);
export const getExpenses = (businessId, params) => api.get(`/business/${businessId}/expenses`, { params });
export const updateExpense = (businessId, expenseId, data) => api.put(`/business/${businessId}/expenses/${expenseId}`, data);
export const deleteExpense = (businessId, expenseId) => api.delete(`/business/${businessId}/expenses/${expenseId}`);

// ==================== ANALITIKA ====================
export const getDebtors = (businessId) => api.get(`/business/${businessId}/analytics/debtors`);
export const getCreditors = (businessId) => api.get(`/business/${businessId}/analytics/creditors`);
export const getLowStock = (businessId) => api.get(`/business/${businessId}/analytics/low-stock`);
export const getPnL = (businessId, params) => api.get(`/business/${businessId}/analytics/pnl`, { params });
export const getCashflow = (businessId, params) => api.get(`/business/${businessId}/analytics/cashflow`, { params });
export const getTopProducts = (businessId, params) => api.get(`/business/${businessId}/analytics/top-products`, { params });