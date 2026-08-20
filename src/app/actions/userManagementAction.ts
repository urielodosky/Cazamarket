'use server';

import { createClient } from '@/lib/supabase/server';
import { verifySudoMode } from '@/lib/auth/verifySudo';

export async function adminChangePlan(userId: string, planField: 'product_plan_tier' | 'service_plan_tier', newPlanTier: string) {
  try {
    await verifySudoMode();
    const supabase = await createClient();

    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 10);

    const updates: any = {
      [planField]: newPlanTier
    };

    const { data: profile } = await supabase
      .from('profiles')
      .select('product_plan_tier, service_plan_tier')
      .eq('id', userId)
      .single();
    
    const otherPlanField = planField === 'product_plan_tier' ? 'service_plan_tier' : 'product_plan_tier';
    const otherPlanTier = profile?.[otherPlanField] || 'gratis';

    if (newPlanTier !== 'gratis' || otherPlanTier !== 'gratis') {
      updates.plan_status = 'activo';
      updates.plan_expires_at = expirationDate.toISOString();
    } else {
      updates.plan_status = null;
      updates.plan_expires_at = null;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in adminChangePlan:', error);
    return { success: false, error: error.message || 'Error al cambiar el plan' };
  }
}

export async function adminToggleBlock(userId: string, currentlyBlocked: boolean) {
  try {
    await verifySudoMode();
    const supabase = await createClient();

    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !currentlyBlocked })
      .eq('id', userId);

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in adminToggleBlock:', error);
    return { success: false, error: error.message || 'Error al modificar estado de bloqueo' };
  }
}
