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
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { isVendor, upgradeToVendor } = useAuth();
  const [productPlanTier, setProductPlanTier] = useState<PlanTier>('gratis');
  const [servicePlanTier, setServicePlanTier] = useState<PlanTier>('gratis');
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedProdTier = localStorage.getItem('cazamarket_plan_tier_productos') as PlanTier | null;
    const savedServTier = localStorage.getItem('cazamarket_plan_tier_servicios') as PlanTier | null;

    if (!savedProdTier && !savedServTier) {
      // Migrar del modelo antiguo si existe
      const oldTier = localStorage.getItem('cazamarket_plan_tier') as PlanTier | null;
      const oldCat = localStorage.getItem('cazamarket_plan_category') as PlanCategory | null;
      if (oldTier && oldCat) {
         if (oldCat === 'productos') setProductPlanTier(oldTier);
         else if (oldCat === 'servicios') setServicePlanTier(oldTier);
         else if (oldCat === 'mixto') {
           setProductPlanTier(oldTier);
           setServicePlanTier(oldTier);
         }
      }
    } else {
      if (savedProdTier) setProductPlanTier(savedProdTier);
      if (savedServTier) setServicePlanTier(savedServTier);
    }
    
    setMounted(true);
  }, []);

  const selectPlan = useCallback((tier: PlanTier, category: PlanCategory) => {
    if (category === 'productos') {
      setProductPlanTier(tier);
      localStorage.setItem('cazamarket_plan_tier_productos', tier);
    } else if (category === 'servicios') {
      setServicePlanTier(tier);
      localStorage.setItem('cazamarket_plan_tier_servicios', tier);
    } else if (category === 'mixto') {
      setProductPlanTier(tier);
      setServicePlanTier(tier);
      localStorage.setItem('cazamarket_plan_tier_productos', tier);
      localStorage.setItem('cazamarket_plan_tier_servicios', tier);
    }

    const newProdTier = category === 'productos' || category === 'mixto' ? tier : productPlanTier;
    const newServTier = category === 'servicios' || category === 'mixto' ? tier : servicePlanTier;

    if (newProdTier !== 'empresarial' && newServTier !== 'empresarial') {
      localStorage.removeItem('cazamarket_virtual_advisor');
    }

    if (newProdTier !== 'gratis' || newServTier !== 'gratis') {
      upgradeToVendor();
    }
  }, [productPlanTier, servicePlanTier, upgradeToVendor]);

  const cancelPlan = useCallback((category: PlanCategory) => {
    if (category === 'productos') {
      setProductPlanTier('gratis');
      localStorage.setItem('cazamarket_plan_tier_productos', 'gratis');
    } else if (category === 'servicios') {
      setServicePlanTier('gratis');
      localStorage.setItem('cazamarket_plan_tier_servicios', 'gratis');
    } else if (category === 'mixto') {
      setProductPlanTier('gratis');
      setServicePlanTier('gratis');
      localStorage.setItem('cazamarket_plan_tier_productos', 'gratis');
      localStorage.setItem('cazamarket_plan_tier_servicios', 'gratis');
    }

    const newProdTier = category === 'productos' || category === 'mixto' ? 'gratis' : productPlanTier;
    const newServTier = category === 'servicios' || category === 'mixto' ? 'gratis' : servicePlanTier;

    if (newProdTier !== 'empresarial' && newServTier !== 'empresarial') {
      localStorage.removeItem('cazamarket_virtual_advisor');
    }
  }, [productPlanTier, servicePlanTier]);

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

