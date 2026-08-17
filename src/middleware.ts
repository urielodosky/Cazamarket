import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { jwtVerify } from 'jose'

import { globalRateLimit, authRateLimit } from '@/lib/security/ratelimit'

export default async function proxy(request: NextRequest) {
  // 1. Force HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') === 'http'
  ) {
    const httpsUrl = `https://${request.headers.get('host')}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(httpsUrl, 301);
  }

  // 1.5 Strict CORS Configuration for API Routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const allowedOrigins = [
      'https://cazamarket.com', 
      'https://www.cazamarket.com',
      'https://cazamarket.vercel.app'
    ];
    if (process.env.NEXT_PUBLIC_SITE_URL) allowedOrigins.push(process.env.NEXT_PUBLIC_SITE_URL);
    if (process.env.ALLOWED_ORIGIN) allowedOrigins.push(process.env.ALLOWED_ORIGIN);
    
    const origin = request.headers.get('origin');
    
    // Si la petición proviene de un navegador (tiene Origin) y no está en nuestra lista blanca
    if (origin && !allowedOrigins.includes(origin) && process.env.NODE_ENV === 'production') {
      console.warn(`[SECURITY LOG] Petición CORS bloqueada desde origen no autorizado: ${origin}`);
      return new NextResponse(
        JSON.stringify({ error: 'CORS policy violation: Origin not allowed' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Si es un preflight request (OPTIONS), le respondemos inmediatamente con éxito
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      response.headers.set('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-signature, x-request-id');
      return response;
    }
  }

  // 2. Upstash Rate Limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    
    // Si es una ruta de autenticación, aplicamos el límite estricto
    const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth/');
    const limiter = isAuthRoute ? authRateLimit : globalRateLimit;

    const { success, limit, reset, remaining } = await limiter.limit(ip);

    if (!success) {
      console.warn(`[SECURITY LOG] Rate limit excedido por IP: ${ip} en ruta ${request.nextUrl.pathname}`);
      return new NextResponse(
        JSON.stringify({ error: 'Too Many Requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          } 
        }
      );
    }
  }

  // 3. Admin Sudo Mode Protection — Verificación criptográfica con JWT
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login-sudo')) {
    // 3.1 Verify Supabase Auth Cookie exists
    const hasAuthCookie = request.cookies.getAll().some(cookie => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'));
    
    // 3.2 Verify Sudo Mode JWT — verificar firma criptográfica y expiración
    const sudoCookie = request.cookies.get('admin_sudo_session');
    let isValidSudo = false;

    if (hasAuthCookie && sudoCookie?.value) {
      try {
        const secret = process.env.ADMIN_JWT_SECRET;
        if (secret) {
          const key = new TextEncoder().encode(secret);
          const { payload } = await jwtVerify(sudoCookie.value, key);
          isValidSudo = payload.role === 'superadmin' && !!payload.sub;
        }
      } catch {
        // Token expirado, firma inválida o manipulado → isValidSudo queda false
      }
    }

    if (!isValidSudo) {
      const loginUrl = new URL('/admin/login-sudo', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Session handling
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
