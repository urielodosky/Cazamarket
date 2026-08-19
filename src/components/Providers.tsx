'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { CartProvider } from '@/contexts/CartContext';
import { PlanProvider } from '@/contexts/PlanContext';
import { BusinessProfileProvider } from '@/contexts/BusinessProfileContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ToastNotifications from './ToastNotifications';
import TermsAcceptanceModal from './TermsAcceptanceModal';
import UTMTracker from './ui/UTMTracker';
import { ReactNode, Suspense } from 'react';
import { PostHogProvider } from './providers/PostHogProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <ThemeProvider>
      <AuthProvider>
        <BusinessProfileProvider>
          <PlanProvider>
            <FavoritesProvider>
              <CartProvider>
                <ToastNotifications />
                <TermsAcceptanceModal />
                <Suspense fallback={null}>
                  <UTMTracker />
                </Suspense>
                {children}
              </CartProvider>
            </FavoritesProvider>
          </PlanProvider>
        </BusinessProfileProvider>
      </AuthProvider>
    </ThemeProvider>
    </PostHogProvider>
  );
}
