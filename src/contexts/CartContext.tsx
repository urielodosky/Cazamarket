'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

import { isAtLeast } from '@/types/planTypes';
import { usePlan } from './PlanContext';

export interface CartItem {
  id: string; // "producto-1" or "servicio-2"
  name: string;
  price: string; // formatted string like "$120.00"
  image: string;
  store: string;
  storeId: number | string;
  quantity: number;
  type: 'producto' | 'servicio';
  category?: string;
  baseDiscount?: { type: string, value: string };
  volumeDiscounts?: { minQty: string, type: string, value: string }[];
  timeDiscounts?: { minTime: string, type: string, value: string }[];
  earlyBirdDiscounts?: { minDays: string, type: string, value: string }[];
  seasonRules?: { startDate: string, endDate: string, adjustmentType: string, type: string, value: string }[];
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  canAddToCart: (storeId: number | string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { hasFeature } = usePlan();

  useEffect(() => {
    const saved = localStorage.getItem('cazamarket_cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cazamarket_cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const canAddToCart = (storeId: number | string, storePlanTier?: string) => {
    if (storeId === 1 || storeId === '1') {
      return hasFeature('carritoWhatsApp');
    }
    if (storePlanTier && storePlanTier === 'gratis') {
      return false;
    }
    // We assume true if plan is unknown, relying on the UI to hide the add to cart button for free plans.
    return true;
  };

  const addToCart = (newItem: Omit<CartItem, 'quantity'> & { storePlanTier?: string }) => {
    if (!canAddToCart(newItem.storeId, newItem.storePlanTier)) {
      alert("Este vendedor tiene el plan Gratis, el cual no incluye carrito de compras. Por favor, contáctalo mediante el botón de WhatsApp.");
      return;
    }

    const itemToAdd = { ...newItem };
    delete itemToAdd.storePlanTier; // Don't store this in cart state

    setCart(prev => {
      const existing = prev.find(item => item.id === itemToAdd.id);
      if (existing) {
        return prev.map(item => item.id === itemToAdd.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...itemToAdd, quantity: 1 } as CartItem];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, canAddToCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
