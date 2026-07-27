'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { CartProvider } from '@/contexts/CartContext';
import { PlanProvider } from '@/contexts/PlanContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PlanProvider>
          <FavoritesProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </FavoritesProvider>
        </PlanProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
