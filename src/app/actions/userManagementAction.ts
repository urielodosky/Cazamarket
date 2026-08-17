'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { verifySudoMode } from '@/lib/auth/verifySudo';

// Cliente Admin para bypass RLS
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function adminChangePlan(userId: string, newPlanTier: string) {
  try {
    await verifySudoMode();

    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 10);

    const updates: any = {
      product_plan_tier: newPlanTier,
      service_plan_tier: newPlanTier
    };

    if (newPlanTier !== 'gratis') {
      updates.plan_status = 'activo';
      updates.plan_expires_at = expirationDate.toISOString();
    } else {
      updates.plan_status = null;
      updates.plan_expires_at = null;
    }

    const { error } = await supabaseAdmin
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

    const { error } = await supabaseAdmin
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
