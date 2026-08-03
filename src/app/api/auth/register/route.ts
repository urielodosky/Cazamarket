import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, username, person_type, birth_date, cuit, phone, contact_email } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios (email, password o username)' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    
    // Crear cliente admin con plenos poderes
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. LIMPIEZA: Verificar si el nombre de usuario está secuestrado por una cuenta fantasma
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .ilike('full_name', username)
      .limit(1)
      .maybeSingle();

    if (existingUser) {
      // El username existe, veamos si es fantasma (sin confirmar)
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(existingUser.id);
      
      if (authUser && authUser.user) {
        if (!authUser.user.email_confirmed_at) {
          // ¡ES UN FANTASMA! Lo destruimos sin piedad para liberar el nombre.
          await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
        } else {
          // Es un usuario real verificado
          return NextResponse.json(
            { error: 'El nombre de usuario ya está en uso por una cuenta verificada. Por favor, elige otro.' },
            { status: 400 }
          );
        }
      }
    }

    // 2. Proceder con el registro normal
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: username,
          avatar_url: '',
          person_type: person_type || null,
          birth_date: birth_date || null,
          cuit: cuit || null,
          phone: phone || null,
          contact_email: contact_email || email,
          terms_accepted_at: new Date().toISOString(),
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        // LIMPIEZA 2: El correo existe. Veamos si es fantasma.
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        if (usersData && usersData.users) {
          const ghost = usersData.users.find(u => u.email === email && !u.email_confirmed_at);
          if (ghost) {
            // El correo está secuestrado por un fantasma. Lo destruimos.
            await supabaseAdmin.auth.admin.deleteUser(ghost.id);
            
            // Reintentamos el registro limpio
            const retry = await supabase.auth.signUp({
              email,
              password,
              options: { 
                data: { 
                  full_name: username, 
                  avatar_url: '',
                  person_type: person_type || null,
                  birth_date: birth_date || null,
                  cuit: cuit || null,
                  phone: phone || null,
                  contact_email: contact_email || email,
                  terms_accepted_at: new Date().toISOString(),
                } 
              }
            });
            
            if (retry.error) {
              return NextResponse.json({ error: retry.error.message }, { status: 400 });
            }
            return NextResponse.json({ success: true, data: retry.data });
          }
        }
        
        return NextResponse.json(
          { error: 'Este correo electrónico ya está registrado y verificado. Por favor, inicia sesión.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Respuesta exitosa
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Error en /api/auth/register:', error?.message || 'Unknown error');
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al procesar el registro.' },
      { status: 500 }
    );
  }
}
