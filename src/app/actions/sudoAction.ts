'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function loginSudoMode(password: string) {
  try {
    const sudoPassword = process.env.ADMIN_SUDO_PASSWORD;
    
    if (!sudoPassword) {
      console.error('ADMIN_SUDO_PASSWORD no está configurado en las variables de entorno.');
      return { success: false, error: 'Error de configuración del servidor.' };
    }

    if (password !== sudoPassword) {
      return { success: false, error: 'Contraseña incorrecta.' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autorizado. Debes iniciar sesión primero.' };
    }

    // Verificar en la BD si el usuario es superadmin
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_superadmin')
      .eq('id', user.id)
      .single();

    if (error || !profile?.is_superadmin) {
      return { success: false, error: 'Acceso denegado. No tienes permisos de administrador.' };
    }

    // Si todo está correcto, establecemos la cookie Sudo Mode (1 hora = 3600 seg)
    const MAX_AGE = 3600;
    
    cookies().set('admin_sudo_session', 'active', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: MAX_AGE,
      path: '/admin', // La cookie solo viaja hacia rutas de admin
    });

    return { success: true };
  } catch (error) {
    console.error('Sudo Mode Error:', error);
    return { success: false, error: 'Ocurrió un error inesperado.' };
  }
}
