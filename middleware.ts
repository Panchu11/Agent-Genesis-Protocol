import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Check auth condition
  if (!session && isProtectedRoute(request.nextUrl.pathname)) {
    // Redirect to login if accessing a protected route without being authenticated
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing auth pages while already authenticated
  if (session && isAuthRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

// Define which routes are protected and require authentication
function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/agent-forge/create',
    '/mind-gardens/create',
    '/evolution-lab/create',
    '/evolution-lab/compare',
    '/profile',
  ];

  return protectedRoutes.some(route => pathname.startsWith(route));
}

// Define which routes are auth routes (login, register, etc.)
function isAuthRoute(pathname: string): boolean {
  const authRoutes = [
    '/auth/login',
    '/auth/register',
  ];

  return authRoutes.some(route => pathname.startsWith(route));
}

// Define which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
