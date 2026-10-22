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

  const selectBusiness = useCallback(async (business, role) => {
    setActiveBusiness(business);
    setMyRole(role || null);
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

  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyBusinesses();
      setMyBusinesses(res.data);

      // Bitta biznes bo'lsa avtomatik tanlaymiz, lekin staff rolini ham saqlaymiz.
      const all = [...res.data.owned, ...res.data.staffed];
      if (all.length === 1) {
        const business = all[0];
        const isOwner = res.data.owned.some((entry) => entry._id === business._id);
        selectBusiness(business, isOwner ? 'owner' : business.staffRole);
      }
    } catch (err) {
      console.error('Bizneslarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  }, [selectBusiness]);

  useEffect(() => {
    // This effect starts the asynchronous business bootstrap; state updates follow API responses.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

// Context provider and its hook intentionally live together in this module.
// eslint-disable-next-line react-refresh/only-export-components
export const useBusiness = () => useContext(BusinessContext);
