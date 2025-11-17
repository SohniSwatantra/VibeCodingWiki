import type { APIRoute } from 'astro';
import { shouldUseSecureCookies, clearAuthCookies } from '../../../../lib/auth/workos.server';
import { serializeCookie } from '../../../../lib/auth/cookie';

export const GET: APIRoute = async ({ request }) => {
  const secure = shouldUseSecureCookies(request.url);
  const headers = new Headers();
  clearAuthCookies(secure).forEach((cookie) => headers.append('Set-Cookie', cookie));
  headers.append(
    'Set-Cookie',
    serializeCookie('vcw_user_preview', '', {
      maxAge: 0,
      sameSite: 'lax',
      secure,
    }),
  );
  headers.append('Location', '/');

  return new Response(null, {
    status: 302,
    headers,
  });
};


