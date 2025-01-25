import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that don't require authentication
const publicPaths = ['/login', '/', '/auth/signup'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;
  const isPublicPath = publicPaths.includes(path);

  // If no token and trying to access protected route
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    // Only add callbackUrl if it's not already a public path
    if (!publicPaths.includes(path)) {
      loginUrl.searchParams.set('callbackUrl', path);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If has token and trying to access login/signup
  if (token && isPublicPath && path !== '/') {
    return NextResponse.redirect(new URL('/mockup/list', request.url));
  }

  // Add token to request headers for API calls
  const response = NextResponse.next();
  if (token) {
    response.headers.set('Authorization', `Bearer ${token}`);
  }

  return response;
}

// Update config to protect all necessary routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}; 