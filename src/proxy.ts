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

  // 3. Session handling
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
