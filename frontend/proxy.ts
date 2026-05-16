import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/onboarding') || pathname.startsWith('/welcome');
  const isLandingPage = pathname === '/';
  
  // Allow landing and auth pages without tokens
  if (!token && !isAuthPage && !isLandingPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If already logged in, redirect landing/auth to dashboard
  if (token && (isAuthPage || isLandingPage)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Exclude static assets (jpg, png, svg, etc.) so they load via public/
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.jpg$|.*\\.png$|.*\\.svg$).*)'],
};
