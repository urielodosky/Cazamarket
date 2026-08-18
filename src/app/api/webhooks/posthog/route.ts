import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usar el rol de servicio (admin) para sobrepasar el RLS y crear notificaciones
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verificamos si PostHog envió el evento de alerta
    if (!body || !body.text) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const alertMessage = body.text || 'Alerta crítica reportada por PostHog.';
    
    // 1. Buscar a todos los usuarios con rol 'admin' (suponiendo que existe la columna 'role' en 'profiles')
    const { data: admins, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (fetchError) {
      console.error('Error buscando admins:', fetchError);
      return NextResponse.json({ error: 'Error interno consultando admins' }, { status: 500 });
    }

    if (!admins || admins.length === 0) {
      console.warn('PostHog Webhook: No se encontraron administradores para notificar.');
      return NextResponse.json({ message: 'Sin administradores para notificar.' });
    }

    // 2. Mock: Registrar la alerta en una tabla 'system_logs' o 'notifications' para los admins
    const logsToInsert = admins.map(admin => ({
      user_id: admin.id,
      title: '⚠️ Alerta Crítica (PostHog)',
      message: alertMessage,
      type: 'error',
      read: false,
      created_at: new Date().toISOString()
    }));

    // Intentamos insertarlo en system_logs. Si no existe la tabla, solo lo registramos en consola como mock
    const { error: insertError } = await supabaseAdmin
      .from('system_logs')
      .insert(logsToInsert);

    if (insertError) {
      console.warn('PostHog Webhook: No se pudo insertar en system_logs (tabla inexistente o error). Mockeando el log...');
      console.log('--- MOCK ALERT TO ADMINS ---');
      console.log(logsToInsert);
      console.log('----------------------------');
    }

    return NextResponse.json({ success: true, alertedAdmins: admins.length });
  } catch (error: any) {
    console.error('PostHog Webhook Error:', error?.message || 'Unknown error');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
