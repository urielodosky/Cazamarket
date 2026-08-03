import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map();

export function middleware(req: NextRequest) {
  // 1. Force HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers.get('x-forwarded-proto') === 'http'
  ) {
    const httpsUrl = `https://${req.headers.get('host')}${req.nextUrl.pathname}${req.nextUrl.search}`;
    return NextResponse.redirect(httpsUrl, 301);
  }

  // 2. Rate Limiting for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const limit = 60; // 60 requests per minute
    const windowMs = 60 * 1000;

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, {
        count: 1,
        lastReset: Date.now()
      });
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

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
