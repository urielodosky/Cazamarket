'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  PlanTier,
  PlanCategory,
  PlanPermissions,
  getPlanPermissions,
  getPlanDisplayName,
  isAtLeast,
  PLAN_TIER_ORDER
} from '@/types/planTypes';
import { useAuth } from './AuthContext';

interface PlanContextType {
  productPlanTier: PlanTier;
  servicePlanTier: PlanTier;
  planTier: PlanTier; // mantenido por retrocompatibilidad
  planCategory: PlanCategory; // mantenido por retrocompatibilidad
  permissions: PlanPermissions;
  planDisplayName: string;
  selectPlan: (tier: PlanTier, category: PlanCategory) => void;
  cancelPlan: (category: PlanCategory) => void;
  hasFeature: (feature: keyof PlanPermissions) => boolean;
  isAtLeastTier: (required: PlanTier, category?: PlanCategory) => boolean;
  isPaidPlan: boolean;
  subscriptionStartDate: string | null;
  pendingProductPlanTier: PlanTier | null;
  pendingServicePlanTier: PlanTier | null;
  calculateNextBillingDate: () => string | null;
  acceleratePlan: (category: PlanCategory) => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

// Helper: construir la clave de localStorage vinculada al usuario
function userPlanKey(userId: string, suffix: string) {
  return `cazamarket_plan_${userId}_${suffix}`;
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { isVendor, upgradeToVendor, supabaseUser, isLoggedIn } = useAuth();
  const [productPlanTier, setProductPlanTier] = useState<PlanTier>('gratis');
  const [servicePlanTier, setServicePlanTier] = useState<PlanTier>('gratis');
  const [pendingProductPlanTier, setPendingProductPlanTier] = useState<PlanTier | null>(null);
  const [pendingServicePlanTier, setPendingServicePlanTier] = useState<PlanTier | null>(null);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const userId = supabaseUser?.id || '';

  // Cargar planes del usuario actual (o resetear a gratis si no hay usuario)
  useEffect(() => {
    if (!userId) {
      // No hay usuario logueado → todo gratis
      setProductPlanTier('gratis');
      setServicePlanTier('gratis');
      setMounted(true);
      return;
    }

    // Leer planes específicos de este usuario
    const savedProd = localStorage.getItem(userPlanKey(userId, 'productos')) as PlanTier | null;
    const savedServ = localStorage.getItem(userPlanKey(userId, 'servicios')) as PlanTier | null;

    // Migrar del modelo antiguo (claves genéricas) si existen y este usuario no tiene claves propias
    if (!savedProd && !savedServ) {
      const oldProd = localStorage.getItem('cazamarket_plan_tier_productos') as PlanTier | null;
      const oldServ = localStorage.getItem('cazamarket_plan_tier_servicios') as PlanTier | null;
      if (oldProd || oldServ) {
        // Migrar al nuevo modelo per-usuario
        if (oldProd) {
          localStorage.setItem(userPlanKey(userId, 'productos'), oldProd);
          setProductPlanTier(oldProd);
        }
        if (oldServ) {
          localStorage.setItem(userPlanKey(userId, 'servicios'), oldServ);
          setServicePlanTier(oldServ);
        }
        // Limpiar las claves viejas genéricas
        localStorage.removeItem('cazamarket_plan_tier_productos');
        localStorage.removeItem('cazamarket_plan_tier_servicios');
        localStorage.removeItem('cazamarket_plan_tier');
        localStorage.removeItem('cazamarket_plan_category');
      } else {
        setProductPlanTier('gratis');
        setServicePlanTier('gratis');
      }
    } else {
      setProductPlanTier(savedProd || 'gratis');
      setServicePlanTier(savedServ || 'gratis');
    }

    const pendingProd = localStorage.getItem(userPlanKey(userId, 'pending_productos')) as PlanTier | null;
    const pendingServ = localStorage.getItem(userPlanKey(userId, 'pending_servicios')) as PlanTier | null;
    
    // Si tenían un plan pendiente (por el bug anterior), lo aplicamos inmediatamente
    if (pendingProd) {
      setProductPlanTier(pendingProd);
      localStorage.setItem(userPlanKey(userId, 'productos'), pendingProd);
      localStorage.removeItem(userPlanKey(userId, 'pending_productos'));
    }
    if (pendingServ) {
      setServicePlanTier(pendingServ);
      localStorage.setItem(userPlanKey(userId, 'servicios'), pendingServ);
      localStorage.removeItem(userPlanKey(userId, 'pending_servicios'));
    }

    const savedStartDate = localStorage.getItem(userPlanKey(userId, 'subscriptionStartDate'));
    if (savedStartDate) {
      setSubscriptionStartDate(savedStartDate);
    }

    setMounted(true);
  }, [userId]);

  const selectPlan = useCallback((tier: PlanTier, category: PlanCategory) => {
    if (!userId) return;

    // Todo cambio de plan se aplica inmediatamente para mejor experiencia UX en la simulación.
    if (category === 'productos') {
      setProductPlanTier(tier);
      localStorage.setItem(userPlanKey(userId, 'productos'), tier);
      setPendingProductPlanTier(null);
      localStorage.removeItem(userPlanKey(userId, 'pending_productos'));
    } else if (category === 'servicios') {
      setServicePlanTier(tier);
      localStorage.setItem(userPlanKey(userId, 'servicios'), tier);
      setPendingServicePlanTier(null);
      localStorage.removeItem(userPlanKey(userId, 'pending_servicios'));
    } else if (category === 'mixto') {
      setProductPlanTier(tier);
      setServicePlanTier(tier);
      localStorage.setItem(userPlanKey(userId, 'productos'), tier);
      localStorage.setItem(userPlanKey(userId, 'servicios'), tier);
      setPendingProductPlanTier(null);
      setPendingServicePlanTier(null);
      localStorage.removeItem(userPlanKey(userId, 'pending_productos'));
      localStorage.removeItem(userPlanKey(userId, 'pending_servicios'));
    }

    if (!subscriptionStartDate && tier !== 'gratis') {
      const now = new Date().toISOString();
      setSubscriptionStartDate(now);
      localStorage.setItem(userPlanKey(userId, 'subscriptionStartDate'), now);
    }

    const newProdTier = category === 'productos' || category === 'mixto' ? tier : productPlanTier;
    const newServTier = category === 'servicios' || category === 'mixto' ? tier : servicePlanTier;

    if (newProdTier !== 'empresarial' && newServTier !== 'empresarial') {
      localStorage.removeItem('cazamarket_virtual_advisor');
    }

    if (newProdTier !== 'gratis' || newServTier !== 'gratis') {
      upgradeToVendor();
    }
  }, [userId, productPlanTier, servicePlanTier, upgradeToVendor, subscriptionStartDate]);

  const cancelPlan = useCallback((category: PlanCategory) => {
    if (!userId) return;

    if (category === 'productos') {
      setPendingProductPlanTier('gratis');
      localStorage.setItem(userPlanKey(userId, 'pending_productos'), 'gratis');
    } else if (category === 'servicios') {
      setPendingServicePlanTier('gratis');
      localStorage.setItem(userPlanKey(userId, 'pending_servicios'), 'gratis');
    } else if (category === 'mixto') {
      setPendingProductPlanTier('gratis');
      setPendingServicePlanTier('gratis');
      localStorage.setItem(userPlanKey(userId, 'pending_productos'), 'gratis');
      localStorage.setItem(userPlanKey(userId, 'pending_servicios'), 'gratis');
    }
  }, [userId]);

  const permissions = getPlanPermissions(
    mounted ? productPlanTier : 'gratis',
    mounted ? servicePlanTier : 'gratis'
  );

  const hasFeature = useCallback((feature: keyof PlanPermissions): boolean => {
    const val = permissions[feature];
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val > 0;
    return false;
  }, [permissions]);

  const isAtLeastTier = useCallback((required: PlanTier, category?: PlanCategory): boolean => {
    if (category === 'productos') return isAtLeast(mounted ? productPlanTier : 'gratis', required);
    if (category === 'servicios') return isAtLeast(mounted ? servicePlanTier : 'gratis', required);
    return isAtLeast(mounted ? productPlanTier : 'gratis', required) || isAtLeast(mounted ? servicePlanTier : 'gratis', required);
  }, [productPlanTier, servicePlanTier, mounted]);

  const isPaidPlan = mounted ? (productPlanTier !== 'gratis' || servicePlanTier !== 'gratis') : false;

  const calculateNextBillingDate = useCallback(() => {
    if (!subscriptionStartDate) return null;
    const start = new Date(subscriptionStartDate);
    const now = new Date();
    let current = new Date(start);
    
    while (current <= now) {
      const year = current.getFullYear();
      const month = current.getMonth();
      let day = current.getDate();

      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      }

      const maxDays = new Date(nextYear, nextMonth + 1, 0).getDate();
      if (day > maxDays) {
        day = maxDays;
      }

      current = new Date(nextYear, nextMonth, day);
    }
    return current.toISOString();
  }, [subscriptionStartDate]);

  const acceleratePlan = useCallback((category: PlanCategory) => {
    if (!userId) return;
    
    const nextProdTier = (category === 'productos' || category === 'mixto') && pendingProductPlanTier ? pendingProductPlanTier : productPlanTier;
    const nextServTier = (category === 'servicios' || category === 'mixto') && pendingServicePlanTier ? pendingServicePlanTier : servicePlanTier;

    if ((category === 'productos' || category === 'mixto') && pendingProductPlanTier) {
      setProductPlanTier(pendingProductPlanTier);
      localStorage.setItem(userPlanKey(userId, 'productos'), pendingProductPlanTier);
      setPendingProductPlanTier(null);
      localStorage.removeItem(userPlanKey(userId, 'pending_productos'));
    }
    if ((category === 'servicios' || category === 'mixto') && pendingServicePlanTier) {
      setServicePlanTier(pendingServicePlanTier);
      localStorage.setItem(userPlanKey(userId, 'servicios'), pendingServicePlanTier);
      setPendingServicePlanTier(null);
      localStorage.removeItem(userPlanKey(userId, 'pending_servicios'));
    }
    
    if (nextProdTier === 'gratis' && nextServTier === 'gratis') {
      setSubscriptionStartDate(null);
      localStorage.removeItem(userPlanKey(userId, 'subscriptionStartDate'));
    } else {
      const now = new Date().toISOString();
      setSubscriptionStartDate(now);
      localStorage.setItem(userPlanKey(userId, 'subscriptionStartDate'), now);
    }
    
    if (nextProdTier !== 'empresarial' && nextServTier !== 'empresarial') {
      localStorage.removeItem('cazamarket_virtual_advisor');
    }
  }, [userId, pendingProductPlanTier, pendingServicePlanTier, productPlanTier, servicePlanTier]);

  const planDisplayName = mounted 
    ? getPlanDisplayName(productPlanTier, servicePlanTier)
    : 'Gratis';

  const highestTierLevel = mounted 
    ? Math.max(PLAN_TIER_ORDER.indexOf(productPlanTier), PLAN_TIER_ORDER.indexOf(servicePlanTier))
    : 0;
  const highestTier = PLAN_TIER_ORDER[highestTierLevel];

  return (
    <PlanContext.Provider value={{
      productPlanTier: mounted ? productPlanTier : 'gratis',
      servicePlanTier: mounted ? servicePlanTier : 'gratis',
      planTier: highestTier, 
      planCategory: 'productos', 
      permissions,
      planDisplayName,
      selectPlan,
      cancelPlan,
      hasFeature,
      isAtLeastTier,
      isPaidPlan,
      subscriptionStartDate: mounted ? subscriptionStartDate : null,
      pendingProductPlanTier: mounted ? pendingProductPlanTier : null,
      pendingServicePlanTier: mounted ? pendingServicePlanTier : null,
      calculateNextBillingDate,
      acceleratePlan,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}

