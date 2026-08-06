import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const rawInput = await request.json();
    let { email, password, username, person_type, birth_date, cuit, phone, contact_email } = rawInput;

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios' },
        { status: 400 }
      );
    }

    // 5. Validación y Sanitización
    username = typeof username === 'string' ? username.trim().replace(/[<>]/g, '') : '';
    phone = typeof phone === 'string' ? phone.trim().replace(/[<>]/g, '') : '';
    cuit = typeof cuit === 'string' ? cuit.trim().replace(/[<>]/g, '') : '';
    person_type = typeof person_type === 'string' ? person_type.trim().replace(/[<>]/g, '') : '';

    const supabase = await createServerClient();
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let step = 'check_existing_user';
    let data, error;
    try {
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', username)
        .limit(1)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingUser) {
        step = 'check_ghost_user';
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(existingUser.id);
        
        if (authError) throw authError;

        if (authUser && authUser.user) {
          if (!authUser.user.email_confirmed_at) {
            step = 'delete_ghost_user';
            const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
            if (delError) throw delError;
          } else {
            return NextResponse.json(
              { error: 'El nombre de usuario ya esta en uso por una cuenta verificada. Por favor, elige otro.' },
              { status: 400 }
            );
          }
        }
      }
      
      step = 'signup';
      const signUpRes = await supabase.auth.signUp({
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
      data = signUpRes.data;
      error = signUpRes.error;

    } catch (err: any) {
       return NextResponse.json({ error: `Falló en paso ${step}: ${err.message}` }, { status: 500 });
    }

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
              console.error(`[SECURITY LOG] Error DB registro (Email: ${email}):`, retry.error.message);
              return NextResponse.json({ error: 'Error al procesar el registro (Intento fallido)' }, { status: 400 });
            }
            return NextResponse.json({ success: true, data: retry.data });
          }
        }
        
        return NextResponse.json(
          { error: 'Este correo electrónico ya está registrado y verificado. Por favor, inicia sesión.' },
          { status: 400 }
        );
      }
      console.error(`[SECURITY LOG] Error DB registro (Email: ${email}):`, error.message);
      return NextResponse.json({ error: 'Error al procesar el registro' }, { status: 400 });
    }

    // Respuesta exitosa
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('[SECURITY LOG] Error critico en /api/auth/register:', error?.message || 'Unknown error');
    console.error('FULL ERROR OBJECT:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: error?.message || 'Ocurrio un error inesperado al procesar el registro.' },
      { status: error?.status || 500 }
    );
  }
}
