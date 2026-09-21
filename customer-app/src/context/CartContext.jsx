import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [providerConflict, setProviderConflict] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart_items', JSON.stringify(items));
  }, [items]);

  // Derive current cart provider
  const currentProvider = items.length > 0 ? {
    id: items[0].provider_id,
    name: items[0].provider_name,
    address: items[0].provider_address
  } : null;

  function addItem(product, quantity = 1) {
    // Check if adding item from a different provider
    if (items.length > 0 && items[0].provider_id !== product.provider_id) {
      setProviderConflict({
        currentProviderName: items[0].provider_name,
        newProduct: product,
        newQuantity: quantity,
        newProviderName: product.provider_name
      });
      return false;
    }

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === product.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = Math.min(updated[existingIdx].quantity + quantity, product.quantity);
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            ...product,
            quantity: Math.min(quantity, product.quantity)
          }
        ];
      }
    });

    setIsDrawerOpen(true);
    return true;
  }

  function resolveProviderConflict(shouldReplace) {
    if (shouldReplace && providerConflict) {
      const { newProduct, newQuantity } = providerConflict;
      setItems([
        {
          ...newProduct,
          quantity: Math.min(newQuantity, newProduct.quantity)
        }
      ]);
      setIsDrawerOpen(true);
    }
    setProviderConflict(null);
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.min(quantity, item.availableStock || item.quantity) }
          : item
      )
    );
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.discounted_price) * item.quantity), 0);
  const platformFee = items.length > 0 ? 5.00 : 0;
  const total = Math.round((subtotal + platformFee) * 100) / 100;
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        currentProvider,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        subtotal: Math.round(subtotal * 100) / 100,
        platformFee,
        total,
        totalItemsCount,
        isDrawerOpen,
        setIsDrawerOpen,
        providerConflict,
        resolveProviderConflict
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

export default CartContext;
