import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that don't require authentication
const publicPaths = ['/login', '/', '/auth/signup'];

// Protected paths that should not redirect to /mockup/list
const allowedProtectedPaths = [
  '/mockup/list',
  '/mockup/favorite',
  '/mockup/generate',
  '/mockup/add',
  '/mockup/edit',
  '/printify'
];

export async function middleware(request: NextRequest) {
  // İstek başlangıç zamanını kaydet
  const requestStartTime = Date.now();
  
  // İstek yolunu al
  const path = request.nextUrl.pathname;
  
  // İstek metodunu al
  const method = request.method;
  
  // Yanıtı oluştur
  const response = NextResponse.next();
  
  // Sunucu tarafında çalıştığından emin ol
  if (typeof window === 'undefined') {
    try {
      // Yanıt tamamlandığında metrikleri kaydet
      response.headers.set('Server-Timing', `request;dur=${Date.now() - requestStartTime}`);
      
      // Metrik modülünü dinamik olarak import et (sadece sunucu tarafında)
      const metricsModule = await import('./utils/metrics');
      
      // HTTP isteğini metrik olarak kaydet
      const statusCode = 200; // Gerçek durum kodunu almak zor olduğundan varsayılan olarak 200 kullanıyoruz
      const duration = (Date.now() - requestStartTime) / 1000; // saniye cinsinden
      
      await metricsModule.recordHttpRequest(method, path, statusCode, duration);
      
      console.log(`Recorded HTTP metric: ${method} ${path} ${statusCode} ${duration}s`);
    } catch (error) {
      console.error('Error recording HTTP metrics in middleware:', error);
    }
  }
  
  const token = request.cookies.get('token')?.value;
  const isPublicPath = publicPaths.includes(path);
  const isAllowedProtectedPath = allowedProtectedPaths.some(allowedPath => path.startsWith(allowedPath));

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