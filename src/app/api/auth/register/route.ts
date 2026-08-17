import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations/authSchemas';

export async function POST(request: Request) {
  try {
    const rawInput = await request.json();
    
    // 5. Validación y Sanitización con Zod
    const validationResult = registerSchema.safeParse(rawInput);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos de registro inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    let { email, password, username, person_type, birth_date, cuit, phone, contact_email } = validationResult.data;

    const supabase = await createServerClient();
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let step = 'check_existing_email';
    let data, error;
    try {
      // 1. Verificar si el email ya existe en auth.users (saltando la protección de enumeración)
      const { data: existingEmailData, error: emailCheckError } = await supabaseAdmin.rpc('check_email_exists', { search_email: email });
      if (emailCheckError) throw emailCheckError;
      
      if (existingEmailData) {
        if (!existingEmailData.email_confirmed_at) {
          // Es un fantasma. Lo borramos para liberar el correo.
          step = 'delete_ghost_email_user';
          const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(existingEmailData.id);
          if (delError) throw delError;
        } else {
          return NextResponse.json(
            { error: 'El mail ya se encuentra registrado, por favor pruebe con otro' },
            { status: 400 }
          );
        }
      }

      step = 'check_existing_username';
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
        if (authError) {
          if (authError.message.includes('not found') || authError.status === 404) {
             // Orfandad detectada en el catch de auth
             await supabaseAdmin.from('profiles').delete().eq('id', existingUser.id);
          } else {
             throw authError;
          }
        }

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
        } else if (!authError) {
          // Si no hay authUser.user y no tiró error, es un perfil huérfano.
          await supabaseAdmin.from('profiles').delete().eq('id', existingUser.id);
        }
      }

      // Check for duplicate CUIT
      if (cuit) {
        step = 'check_cuit';
        const { data: existingCuitUser, error: cuitCheckError } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name')
          .eq('cuit', cuit)
          .limit(1)
          .maybeSingle();

        if (cuitCheckError) throw cuitCheckError;

        if (existingCuitUser) {
          step = 'check_ghost_cuit_user';
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(existingCuitUser.id);
          if (authError) {
            if (authError.message.includes('not found') || authError.status === 404) {
               await supabaseAdmin.from('profiles').delete().eq('id', existingCuitUser.id);
            } else {
               throw authError;
            }
          }

          if (authUser && authUser.user) {
            if (!authUser.user.email_confirmed_at) {
              step = 'delete_ghost_cuit_user';
              const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(existingCuitUser.id);
              if (delError) throw delError;
            } else {
              return NextResponse.json(
                { error: `El CUIT ingresado ya está registrado a nombre de ${existingCuitUser.full_name}.` },
                { status: 400 }
              );
            }
          } else if (!authError) {
            // Perfil huérfano
            await supabaseAdmin.from('profiles').delete().eq('id', existingCuitUser.id);
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
      console.error(`[SECURITY LOG] Error DB registro (Email: ${email}):`, JSON.stringify(error));
      
      let finalErrorMessage = error.message || 'Error al procesar el registro';
      
      // Manejar el error 500 de Supabase cuando falla el envío del email (límite alcanzado o SMTP mal configurado)
      if (finalErrorMessage === '{}' || (error as any).status === 500 || (error as any).name === 'AuthRetryableFetchError') {
         finalErrorMessage = 'Error interno del servidor. Es probable que se haya alcanzado el límite de correos electrónicos de Supabase. Por favor, intenta de nuevo más tarde o revisa la configuración SMTP.';
      }

      return NextResponse.json({ error: finalErrorMessage }, { status: 400 });
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
