import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  console.log('Current path:', request.nextUrl.pathname);
  console.log('Token:', token);
  console.log('Is login page:', isLoginPage);

  // If no token and not on login page, redirect to login
  if (!token && !isLoginPage) {
    console.log('Redirecting to login page');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If has token and on login page, redirect to mockup list
  if (token && isLoginPage) {
    console.log('Redirecting to mockup list');
    return NextResponse.redirect(new URL('/mockup/list', request.url));
  }

  // Add token to request headers
  const headers = new Headers(request.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = NextResponse.next({
    request: {
      headers
    }
  });

  return response;
}

export const config = {
  matcher: [
    '/mockup/:path*',
    '/login'
  ]
}; 