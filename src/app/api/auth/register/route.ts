import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios (email, password o username)' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Validar nombre de usuario único
    // Buscamos si existe algún perfil con este username (independiente de mayúsculas)
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .ilike('full_name', username)
      .limit(1)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya está en uso. Por favor, elige otro.' },
        { status: 400 }
      );
    }

    // 2. Proceder con el registro
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: username,
          avatar_url: '',
        },
      },
    });

    if (error) {
      // Supabase lanza un error si el correo ya existe, capturamos eso y devolvemos un mensaje claro.
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Este correo electrónico ya está registrado. Por favor, inicia sesión.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Respuesta exitosa
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Error en /api/auth/register:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error inesperado al procesar el registro.' },
      { status: 500 }
    );
  }
}
