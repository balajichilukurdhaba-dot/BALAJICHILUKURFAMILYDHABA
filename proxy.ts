import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

function sanitizeUrl(url: string | undefined): string {
  if (!url) return '';
  let cleaned = url.trim().replace(/^['"]|['"]$/g, '');
  
  cleaned = cleaned.replace(/^(https?)\/\/+/i, '$1://');
  cleaned = cleaned.replace(/^(https?):?\/\/+/i, '$1://');
  
  if ((cleaned.match(/https?:\/\//gi) || []).length > 1 || cleaned.includes('https//') || cleaned.includes('http//')) {
    const parts = cleaned.split(/(?=https?:?\/\/)/i);
    for (const part of parts) {
      let trimmed = part.trim();
      trimmed = trimmed.replace(/^(https?):?\/\/+/i, '$1://');
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        cleaned = trimmed;
        break;
      }
    }
  }

  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginRoute = pathname === '/admin/login';

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sanitizedUrl = sanitizeUrl(originalUrl);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isValidUrl = sanitizedUrl.startsWith('http://') || sanitizedUrl.startsWith('https://');

  const adminCookie = request.cookies.get('admin_logged_in')?.value;
  const loginTimeStr = request.cookies.get('admin_login_time')?.value;
  const loginTime = loginTimeStr ? parseInt(loginTimeStr, 10) : null;
  const MAX_SESSION_MS = 6 * 60 * 60 * 1000; // 6 hours
  const isExpired = loginTime ? (Date.now() - loginTime > MAX_SESSION_MS) : false;

  let session = null;
  let isAuthenticated = (adminCookie === 'true') && !isExpired;

  // Only make remote Supabase Auth network call if not already authenticated via fast cookie
  if (!isAuthenticated && !isExpired && sanitizedUrl && anonKey && isValidUrl) {
    try {
      const supabase = createServerClient(
        sanitizedUrl,
        anonKey,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({ name, value, ...options });
              response = NextResponse.next({
                request: { headers: request.headers },
              });
              response.cookies.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({ name, value: '', ...options });
              response = NextResponse.next({
                request: { headers: request.headers },
              });
              response.cookies.set({ name, value, ...options });
            },
          },
        }
      );
      const { data } = await supabase.auth.getSession();
      session = data.session;
      if (session) {
        isAuthenticated = true;
      }
    } catch (e) {
      console.warn('[proxy] Supabase auth session check failed:', e);
    }
  }

  if (isExpired && isAdminRoute && !isLoginRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin/login';
    redirectUrl.searchParams.set('reason', 'expired');
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.cookies.delete('admin_logged_in');
    redirectResponse.cookies.delete('admin_login_time');
    return redirectResponse;
  }

  if (isAdminRoute && !isLoginRoute && !isAuthenticated) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin/login';
    return NextResponse.redirect(redirectUrl);
  }

  if (isLoginRoute && isAuthenticated) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
