// src/hooks/useCart.js
import { useState, useEffect, useCallback } from 'react';

const CART_KEY = 'cart';

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('cartUpdated'));
}

/**
 * Umumiy savat hook'i.
 * CartPage, UniversalCard va boshqa har qanday joyda bitta manba
 * (localStorage) bilan ishlash uchun — dublikat mantiqning oldini oladi.
 *
 * Qaytaradi:
 * - cart: to'liq savat massivi
 * - getQuantity(id): shu mahsulotning savatdagi soni (yo'q bo'lsa 0)
 * - increment(item): sonini 1 ga oshiradi (savatda yo'q bo'lsa qo'shadi)
 * - decrement(item): sonini 1 ga kamaytiradi (0 bo'lsa savatdan olib tashlaydi)
 * - setQuantity(item, n): to'g'ridan-to'g'ri sonni belgilaydi
 * - removeItem(id): savatdan butunlay olib tashlaydi
 * - clearCart(): savatni tozalaydi
 * - totalItems, totalPrice
 */
export function useCart() {
  const [cart, setCart] = useState(readCart);

  useEffect(() => {
    const sync = () => setCart(readCart());
    window.addEventListener('cartUpdated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('cartUpdated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const getQuantity = useCallback(
    (id) => cart.find((i) => i.id === id)?.quantity || 0,
    [cart]
  );

  const setQuantity = useCallback((item, quantity) => {
    const current = readCart();
    const idx = current.findIndex((i) => i.id === item.id);

    if (quantity <= 0) {
      if (idx !== -1) {
        const next = current.filter((i) => i.id !== item.id);
        writeCart(next);
        setCart(next);
      }
      return;
    }

    let next;
    if (idx !== -1) {
      next = current.map((i) => (i.id === item.id ? { ...i, quantity } : i));
    } else {
      next = [...current, { ...item, quantity }];
    }
    writeCart(next);
    setCart(next);
  }, []);

  const increment = useCallback(
    (item) => setQuantity(item, getQuantity(item.id) + 1),
    [getQuantity, setQuantity]
  );

  const decrement = useCallback(
    (item) => setQuantity(item, getQuantity(item.id) - 1),
    [getQuantity, setQuantity]
  );

  const removeItem = useCallback((id) => setQuantity({ id }, 0), [setQuantity]);

  const clearCart = useCallback(() => {
    writeCart([]);
    setCart([]);
  }, []);

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, i) => sum + (parseFloat(i.price) || 0) * i.quantity,
    0
  );

  return {
    cart,
    getQuantity,
    setQuantity,
    increment,
    decrement,
    removeItem,
    clearCart,
    totalItems,
    totalPrice,
  };
}