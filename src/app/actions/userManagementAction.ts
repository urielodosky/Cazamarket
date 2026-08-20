'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
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

export async function adminToggleBlock(userId: string, currentlyBlocked: boolean, reason?: string, duration?: '24h' | '7d' | '30d' | 'permanent') {
  try {
    await verifySudoMode();
    const supabase = await createClient();

    const updates: any = { is_blocked: !currentlyBlocked };

    if (!currentlyBlocked) {
      // Blocking
      updates.block_reason = reason || 'Infracción de las políticas';
      if (duration === '24h') {
        const d = new Date(); d.setHours(d.getHours() + 24); updates.block_expires_at = d.toISOString();
      } else if (duration === '7d') {
        const d = new Date(); d.setDate(d.getDate() + 7); updates.block_expires_at = d.toISOString();
      } else if (duration === '30d') {
        const d = new Date(); d.setDate(d.getDate() + 30); updates.block_expires_at = d.toISOString();
      } else {
        updates.block_expires_at = null; // permanent
      }
    } else {
      // Unblocking
      updates.block_reason = null;
      updates.block_expires_at = null;
      updates.block_appeal = null;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in adminToggleBlock:', error);
    return { success: false, error: error.message || 'Error al modificar estado de bloqueo' };
  }
}

export async function submitBlockAppeal(appealMessage: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    // Usar cliente admin para actualizar perfil bloqueado, ya que RLS puede estar restringiendo
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ block_appeal: appealMessage })
      .eq('id', user.id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error in submitBlockAppeal:', error);
    return { success: false, error: error.message || 'Error al enviar apelación' };
  }
}

export async function adminSendNotification(userId: string, title: string, message: string) {
  try {
    await verifySudoMode();
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'system',
        title,
        message,
        is_read: false
      });

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in adminSendNotification:', error);
    return { success: false, error: error.message || 'Error al enviar notificación' };
  }
}

export async function adminSendGlobalNotification(title: string, message: string) {
  try {
    await verifySudoMode();
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all user IDs
    const { data: profiles, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id');

    if (fetchError) throw fetchError;
    if (!profiles || profiles.length === 0) return { success: true };

    const notifications = profiles.map(profile => ({
      user_id: profile.id,
      type: 'system',
      title,
      message,
      is_read: false
    }));

    // Insert notifications in batches to avoid payload limits
    const batchSize = 1000;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert(batch);
      
      if (insertError) throw insertError;
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in adminSendGlobalNotification:', error);
    return { success: false, error: error.message || 'Error al enviar notificación global' };
  }
}
