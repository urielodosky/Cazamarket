import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const rateLimitMap = new Map();

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
    
    const origin = request.headers.get('origin');
    
    // Si la petición proviene de un navegador (tiene Origin) y no está en nuestra lista blanca
    const isVercelPreview = origin && origin.endsWith('.vercel.app');
    
    if (origin && !allowedOrigins.includes(origin) && !isVercelPreview && process.env.NODE_ENV === 'production') {
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

  // 2. Rate Limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = 60; // 60 requests per minute
    const windowMs = 60 * 1000;

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { count: 1, lastReset: Date.now() });
    } else {
      const data = rateLimitMap.get(ip);
      if (Date.now() - data.lastReset > windowMs) {
        data.count = 1;
        data.lastReset = Date.now();
      } else {
        data.count++;
        if (data.count > limit) {
          return new NextResponse(
            JSON.stringify({ error: 'Too Many Requests. Please try again later.' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }

  // 3. Admin Sudo Mode Protection
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login-sudo')) {
    // 3.1 Verify Supabase Auth Cookie exists
    // The name of the cookie depends on the project reference ID. Usually it starts with sb- and ends with -auth-token
    const hasAuthCookie = request.cookies.getAll().some(cookie => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'));
    
    // 3.2 Verify Sudo Mode Cookie exists
    const sudoCookie = request.cookies.get('admin_sudo_session');
    
    if (!hasAuthCookie || !sudoCookie || sudoCookie.value !== 'active') {
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
