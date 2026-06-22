import { createContext, useContext, useMemo, useState, useCallback } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [tableNumber, setTableNumberState] = useState(null);
  const [items, setItems] = useState([]); // [{ id, name, price, quantity, notes }]

  // Switching tables (e.g. someone reuses the browser at table 2 after
  // ordering at table 1) starts a fresh cart rather than mixing orders.
  const setTableNumber = useCallback(
    (nextTableNumber) => {
      setTableNumberState((current) => {
        if (current !== null && current !== nextTableNumber) {
          setItems([]);
        }
        return nextTableNumber;
      });
    },
    []
  );

  const addItem = useCallback((menuItem) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === menuItem.id);
      if (existing) {
        return current.map((item) =>
          item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...current,
        {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          notes: "",
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.id !== id);
      }
      return current.map((item) => (item.id === id ? { ...item, quantity } : item));
    });
  }, []);

  const updateNotes = useCallback((id, notes) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, notes } : item)));
  }, []);

  const removeItem = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const getQuantity = useCallback(
    (id) => items.find((item) => item.id === id)?.quantity ?? 0,
    [items]
  );

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [items]
  );

  const value = {
    tableNumber,
    setTableNumber,
    items,
    addItem,
    updateQuantity,
    updateNotes,
    removeItem,
    clearCart,
    getQuantity,
    totalCount,
    totalAmount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
