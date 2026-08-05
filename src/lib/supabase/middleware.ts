import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-site tracking cookies.
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 6. Autenticación en Rutas
  // Rutas que requieren autenticación estricta (no se puede entrar si no estás logueado)
  const protectedRoutes = ['/configuracion', '/mis-tiendas', '/favoritos', '/mensajes', '/comunidad/nuevo', '/carrito', '/resenas'];
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Rutas exclusivas para invitados (no se puede entrar si YA estás logueado)
  const authRoutes = ['/registro', '/login'];
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (isProtectedRoute && !user) {
    // 8. Log de Seguridad: Intento de acceso a ruta protegida
    console.warn(`[SECURITY LOG] Intento de acceso no autorizado a ${request.nextUrl.pathname} (IP: ${request.headers.get('x-forwarded-for')})`);
    
    // Redirigir al registro (o login)
    const url = request.nextUrl.clone()
    url.pathname = '/registro'
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    // Si ya tiene cuenta y quiere entrar al registro, mandarlo al inicio
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
