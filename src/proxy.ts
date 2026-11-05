import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // necesario para que el refresco de sesion escriba cookies nuevas
  const { data: { user } } = await supabase.auth.getUser();

  // la API maneja su propio 401; el redirect HTML romperia los fetch JSON.
  // /compartir es el share-target: su route handler decide el 303 a /login
  // (necesario tambien para POST multipart con archivos).
  const esExenta =
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/registro') ||
    request.nextUrl.pathname === '/compartir';
  if (!user && !esExenta) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|map|txt|zip)$).*)',
  ],
};
