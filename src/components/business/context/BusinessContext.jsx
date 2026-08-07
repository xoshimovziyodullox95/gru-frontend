import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMyBusinesses, getWarehouses } from '../../services/business';

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const [myBusinesses, setMyBusinesses] = useState({ owned: [], staffed: [] });
  const [activeBusiness, setActiveBusiness] = useState(null); // { _id, name, ... }
  const [myRole, setMyRole] = useState(null); // 'owner' | 'admin' | 'director' | 'cashier' | 'warehouse_worker'
  const [warehouses, setWarehouses] = useState([]);
  const [activeWarehouse, setActiveWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyBusinesses();
      setMyBusinesses(res.data);

      // Birinchi marta kirilganda, agar faqat bitta biznes bo'lsa, avtomatik tanlaymiz
      const all = [...res.data.owned, ...res.data.staffed];
      if (all.length === 1) {
        selectBusiness(all[0], res.data.owned.some((b) => b._id === all[0]._id) ? 'owner' : null);
      }
    } catch (err) {
      console.error('Bizneslarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectBusiness = useCallback(async (business, role) => {
    setActiveBusiness(business);
    setMyRole(role || 'owner');
    setActiveWarehouse(null);
    try {
      const res = await getWarehouses(business._id);
      setWarehouses(res.data);
      const defaultWh = res.data.find((w) => w.isDefault) || res.data[0];
      setActiveWarehouse(defaultWh || null);
    } catch (err) {
      console.error('Omborlarni yuklashda xatolik:', err);
    }
  }, []);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  return (
    <BusinessContext.Provider
      value={{
        myBusinesses, activeBusiness, myRole, warehouses, activeWarehouse,
        loading, selectBusiness, setActiveWarehouse, refreshBusinesses: loadBusinesses,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => useContext(BusinessContext);