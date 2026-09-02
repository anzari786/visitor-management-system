import { NextRequest, NextResponse } from 'next/server';
import { isDevelopmentAuthBypassEnabled } from '@/lib/auth-config';

const PUBLIC_ROUTES = ['/login', '/self-service'];

export function middleware(request: NextRequest) {
   const { pathname } = request.nextUrl;
   const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
   const hasSession = request.cookies.has('vms.sid');

   if (!hasSession && !isPublic && !isDevelopmentAuthBypassEnabled) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
   }

   if (hasSession && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
   }

   return NextResponse.next();
}

export const config = {
   matcher: [
      '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
   ],
};
