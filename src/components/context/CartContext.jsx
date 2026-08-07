import React, { createContext, useContext, useState } from 'react';

export const CartContext = createContext();

// TUZATILDI: useCart hook eksport qilindi (HomePage va boshqa joylarda ishlatiladi)
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    setCartItems((prevItems) => {
      const exists = prevItems.find(i => i.id === item.id);
      if (exists) return prevItems; // Takroriy qo'shmaslik uchun
      return [...prevItems, item];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prevItems) => prevItems.filter(item => item.id !== id));
  };

  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};