import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rawUpdates = await request.json();

    // 5. Validación y Sanitización (Evitar Mass Assignment y XSS)
    const allowedFields = ['full_name', 'phone', 'avatar_url'];
    const safeUpdates: Record<string, string> = {};

    for (const key of allowedFields) {
      if (rawUpdates[key] !== undefined) {
        // Importante: No importamos sanitize aquí directamente si no es necesario para strings simples,
        // pero validamos que sean strings.
        if (typeof rawUpdates[key] === 'string') {
           // Basic string sanitization for profile fields
           safeUpdates[key] = rawUpdates[key].trim().replace(/[<>]/g, ''); 
        }
      }
    }

    // Asegurarse de que no esté vacío
    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }

    // Crear cliente admin para bypasear RLS (necesario para verificar si el nombre está en uso por otro usuario)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verificar unicidad de nombre de usuario si se está intentando cambiar
    if (safeUpdates.full_name) {
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('full_name', safeUpdates.full_name)
        .neq('id', user.id)
        .limit(1)
        .maybeSingle();

      if (checkError) {
        console.error(`[SECURITY LOG] Error DB verificando unicidad de nombre (User: ${user.id}):`, checkError.message);
        return NextResponse.json({ error: 'Error interno al validar el nombre de usuario' }, { status: 500 });
      }

      if (existingUser) {
        return NextResponse.json(
          { error: 'Este nombre de usuario / razón social ya está en uso por otra cuenta. Por favor, elige otro.' },
          { status: 400 }
        );
      }
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(safeUpdates)
      .eq('id', user.id);

    if (error) {
      // 8. Sistema de Logs de Seguridad: Loguear el error real internamente
      console.error(`[SECURITY LOG] Error DB actualizando perfil (User: ${user.id}):`, error.message);
      // 7. Manejo de Errores Seguro: Devolver un error genérico al cliente
      return NextResponse.json({ error: 'Error interno al actualizar el perfil' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[SECURITY LOG] Excepción en API de update profile:`, err?.message || 'Unknown error');
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
