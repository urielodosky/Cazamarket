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
import { createClient } from '@/lib/supabase/client';

interface PlanContextType {
  productPlanTier: PlanTier;
  servicePlanTier: PlanTier;
  planTier: PlanTier; 
  planCategory: PlanCategory; 
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

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { isVendor, upgradeToVendor, supabaseUser, isLoggedIn } = useAuth();
  const [productPlanTier, setProductPlanTier] = useState<PlanTier>('gratis');
  const [servicePlanTier, setServicePlanTier] = useState<PlanTier>('gratis');
  const [pendingProductPlanTier, setPendingProductPlanTier] = useState<PlanTier | null>(null);
  const [pendingServicePlanTier, setPendingServicePlanTier] = useState<PlanTier | null>(null);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const supabase = createClient();
  const userId = supabaseUser?.id;

  // Cargar planes desde Supabase
  useEffect(() => {
    const loadPlans = async () => {
      if (!userId || !isLoggedIn) {
        setProductPlanTier('gratis');
        setServicePlanTier('gratis');
        setPendingProductPlanTier(null);
        setPendingServicePlanTier(null);
        setSubscriptionStartDate(null);
        setMounted(true);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('product_plan_tier, service_plan_tier, pending_product_plan_tier, pending_service_plan_tier, subscription_start_date')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setProductPlanTier((data.product_plan_tier as PlanTier) || 'gratis');
        setServicePlanTier((data.service_plan_tier as PlanTier) || 'gratis');
        setPendingProductPlanTier((data.pending_product_plan_tier as PlanTier) || null);
        setPendingServicePlanTier((data.pending_service_plan_tier as PlanTier) || null);
        setSubscriptionStartDate(data.subscription_start_date || null);
      }
      setMounted(true);
    };

    loadPlans();
  }, [userId, isLoggedIn]);

  const updateProfilePlans = async (updates: any) => {
    if (!userId) return;
    await supabase.from('profiles').update(updates).eq('id', userId);
  };

  const selectPlan = useCallback(async (tier: PlanTier, category: PlanCategory) => {
    if (!userId) {
      alert("Debes iniciar sesión con una cuenta real para seleccionar un plan.");
      return;
    }

    const isUpgradingFromPaid = (category === 'productos' || category === 'mixto') && productPlanTier !== 'gratis' 
                             || (category === 'servicios' || category === 'mixto') && servicePlanTier !== 'gratis';
                             
    const updates: any = {};

    if (isUpgradingFromPaid && tier !== 'gratis') {
      if (category === 'productos' || category === 'mixto') {
        setPendingProductPlanTier(tier);
        updates.pending_product_plan_tier = tier;
      }
      if (category === 'servicios' || category === 'mixto') {
        setPendingServicePlanTier(tier);
        updates.pending_service_plan_tier = tier;
      }
      await updateProfilePlans(updates);
      return;
    }

    if (category === 'productos') {
      setProductPlanTier(tier);
      setPendingProductPlanTier(null);
      updates.product_plan_tier = tier;
      updates.pending_product_plan_tier = null;
    } else if (category === 'servicios') {
      setServicePlanTier(tier);
      setPendingServicePlanTier(null);
      updates.service_plan_tier = tier;
      updates.pending_service_plan_tier = null;
    } else if (category === 'mixto') {
      setProductPlanTier(tier);
      setServicePlanTier(tier);
      setPendingProductPlanTier(null);
      setPendingServicePlanTier(null);
      updates.product_plan_tier = tier;
      updates.service_plan_tier = tier;
      updates.pending_product_plan_tier = null;
      updates.pending_service_plan_tier = null;
    }

    if (!subscriptionStartDate && tier !== 'gratis') {
      const now = new Date().toISOString();
      setSubscriptionStartDate(now);
      updates.subscription_start_date = now;
    }

    const newProdTier = category === 'productos' || category === 'mixto' ? tier : productPlanTier;
    const newServTier = category === 'servicios' || category === 'mixto' ? tier : servicePlanTier;

    await updateProfilePlans(updates);

    if (newProdTier !== 'gratis' || newServTier !== 'gratis') {
      upgradeToVendor();
    }
  }, [userId, productPlanTier, servicePlanTier, upgradeToVendor, subscriptionStartDate]);

  const cancelPlan = useCallback(async (category: PlanCategory) => {
    if (!userId) return;

    const updates: any = {};
    if (category === 'productos') {
      setPendingProductPlanTier('gratis');
      updates.pending_product_plan_tier = 'gratis';
    } else if (category === 'servicios') {
      setPendingServicePlanTier('gratis');
      updates.pending_service_plan_tier = 'gratis';
    } else if (category === 'mixto') {
      setPendingProductPlanTier('gratis');
      setPendingServicePlanTier('gratis');
      updates.pending_product_plan_tier = 'gratis';
      updates.pending_service_plan_tier = 'gratis';
    }
    
    await updateProfilePlans(updates);
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

  const acceleratePlan = useCallback(async (category: PlanCategory) => {
    if (!userId) return;
    
    const nextProdTier = (category === 'productos' || category === 'mixto') && pendingProductPlanTier ? pendingProductPlanTier : productPlanTier;
    const nextServTier = (category === 'servicios' || category === 'mixto') && pendingServicePlanTier ? pendingServicePlanTier : servicePlanTier;

    const updates: any = {};

    if ((category === 'productos' || category === 'mixto') && pendingProductPlanTier) {
      setProductPlanTier(pendingProductPlanTier);
      setPendingProductPlanTier(null);
      updates.product_plan_tier = pendingProductPlanTier;
      updates.pending_product_plan_tier = null;
    }
    if ((category === 'servicios' || category === 'mixto') && pendingServicePlanTier) {
      setServicePlanTier(pendingServicePlanTier);
      setPendingServicePlanTier(null);
      updates.service_plan_tier = pendingServicePlanTier;
      updates.pending_service_plan_tier = null;
    }
    
    if (nextProdTier === 'gratis' && nextServTier === 'gratis') {
      setSubscriptionStartDate(null);
      updates.subscription_start_date = null;
    } else {
      const now = new Date().toISOString();
      setSubscriptionStartDate(now);
      updates.subscription_start_date = now;
    }
    
    await updateProfilePlans(updates);
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
