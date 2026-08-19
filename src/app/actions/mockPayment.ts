'use server'

import { createClient } from '@/lib/supabase/server';

export async function mockPremiumPayment() {
  if (process.env.NODE_ENV !== 'development') {
    return { success: false, error: 'Sólo permitido en entorno de desarrollo' };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'No autorizado' };
  }

  // Simulamos un webhook de MercadoPago/Stripe que promueve la cuenta al plan más alto
  const { error } = await supabase
    .from('profiles')
    .update({
      product_plan_tier: 'empresarial',
      service_plan_tier: 'empresarial',
      pending_product_plan_tier: null,
      pending_service_plan_tier: null,
      subscription_start_date: new Date().toISOString(),
      role: 'negocio' // Ensure they get the business role as well
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
