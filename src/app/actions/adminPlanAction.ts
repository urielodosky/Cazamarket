'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// We need an admin client to bypass RLS and update the profile
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function grantFreePlan(targetUserId: string, planTier: string) {
  try {
    // 1. Verificar la cookie del Sudo Mode
    const sudoCookie = cookies().get('admin_sudo_session');
    if (!sudoCookie || sudoCookie.value !== 'active') {
      return { success: false, error: 'Sudo mode requerido. La sesión segura ha expirado.' };
    }

    // 2. Verificar la sesión de Supabase del usuario actual (quien ejecuta la acción)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autorizado.' };
    }

    // 3. Verificar en BD que el usuario ejecutante sea superadmin (Modo Dios)
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('is_superadmin')
      .eq('id', user.id)
      .single();

    if (adminError || !adminProfile?.is_superadmin) {
      return { success: false, error: 'Acceso denegado. No tienes el nivel de permisos requerido.' };
    }

    // 4. Ejecutar la acción (Modo Dios: asignar plan gratis usando Service Role)
    // Se establece el plan y se le da vigencia de 10 años (prácticamente de por vida)
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 10);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        plan_tier: planTier,
        plan_status: 'activo',
        plan_expires_at: expirationDate.toISOString(),
      })
      .eq('id', targetUserId);

    if (updateError) {
      console.error('Error assigning plan:', updateError);
      return { success: false, error: 'Fallo al actualizar el perfil del usuario.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Admin Plan Action Error:', error);
    return { success: false, error: 'Error inesperado del servidor.' };
  }
}
