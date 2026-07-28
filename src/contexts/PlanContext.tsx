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

// Helper: construir la clave de localStorage vinculada al usuario
function userPlanKey(userId: string, suffix: string) {
  return `cazamarket_plan_${userId}_${suffix}`;
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { isVendor, upgradeToVendor, supabaseUser, isLoggedIn } = useAuth();
  const [productPlanTier, setProductPlanTier] = useState<PlanTier>('gratis');
  const [servicePlanTier, setServicePlanTier] = useState<PlanTier>('gratis');
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

    setMounted(true);
  }, [userId]);

  const selectPlan = useCallback((tier: PlanTier, category: PlanCategory) => {
    if (!userId) return;

    if (category === 'productos') {
      setProductPlanTier(tier);
      localStorage.setItem(userPlanKey(userId, 'productos'), tier);
    } else if (category === 'servicios') {
      setServicePlanTier(tier);
      localStorage.setItem(userPlanKey(userId, 'servicios'), tier);
    } else if (category === 'mixto') {
      setProductPlanTier(tier);
      setServicePlanTier(tier);
      localStorage.setItem(userPlanKey(userId, 'productos'), tier);
      localStorage.setItem(userPlanKey(userId, 'servicios'), tier);
    }

    const newProdTier = category === 'productos' || category === 'mixto' ? tier : productPlanTier;
    const newServTier = category === 'servicios' || category === 'mixto' ? tier : servicePlanTier;

    if (newProdTier !== 'empresarial' && newServTier !== 'empresarial') {
      localStorage.removeItem('cazamarket_virtual_advisor');
    }

    if (newProdTier !== 'gratis' || newServTier !== 'gratis') {
      upgradeToVendor();
    }
  }, [userId, productPlanTier, servicePlanTier, upgradeToVendor]);

  const cancelPlan = useCallback((category: PlanCategory) => {
    if (!userId) return;

    if (category === 'productos') {
      setProductPlanTier('gratis');
      localStorage.setItem(userPlanKey(userId, 'productos'), 'gratis');
    } else if (category === 'servicios') {
      setServicePlanTier('gratis');
      localStorage.setItem(userPlanKey(userId, 'servicios'), 'gratis');
    } else if (category === 'mixto') {
      setProductPlanTier('gratis');
      setServicePlanTier('gratis');
      localStorage.setItem(userPlanKey(userId, 'productos'), 'gratis');
      localStorage.setItem(userPlanKey(userId, 'servicios'), 'gratis');
    }

    const newProdTier = category === 'productos' || category === 'mixto' ? 'gratis' : productPlanTier;
    const newServTier = category === 'servicios' || category === 'mixto' ? 'gratis' : servicePlanTier;

    if (newProdTier !== 'empresarial' && newServTier !== 'empresarial') {
      localStorage.removeItem('cazamarket_virtual_advisor');
    }
  }, [userId, productPlanTier, servicePlanTier]);

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

