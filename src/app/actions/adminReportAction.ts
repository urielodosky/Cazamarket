'use server';

import { cookies } from 'next/headers';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Cliente Admin para bypass RLS
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifySudoMode() {
  const cookieStore = await cookies();
  const sudoCookie = cookieStore.get('admin_sudo_session');
  if (!sudoCookie || sudoCookie.value !== 'active') {
    throw new Error('Sudo mode requerido. La sesión segura ha expirado.');
  }
}

export async function updateReportStatus(reportId: string, newStatus: 'pending' | 'resolved' | 'dismissed') {
  try {
    await verifySudoMode();

    const { error } = await supabaseAdmin
      .from('reports')
      .update({ status: newStatus })
      .eq('id', reportId);

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in updateReportStatus:', error);
    return { success: false, error: error.message || 'Error al actualizar la denuncia' };
  }
}
