import type { APIRoute } from 'astro';
import { Buffer } from 'node:buffer';
import {
  getWorkOS,
  getCookiePassword,
  parseAuthCookies,
  createSessionCookie,
  shouldUseSecureCookies,
  clearAuthCookies,
  getClientId,
  syncWorkOSIdentityToConvex,
} from '../../../../lib/auth/workos.server';
import { serializeCookie } from '../../../../lib/auth/cookie';

export const GET: APIRoute = async ({ request }) => {
  try {
    const workos = getWorkOS();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const incomingState = searchParams.get('state');

    if (!code || !incomingState) {
      return new Response(JSON.stringify({ message: 'Missing code or state' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { state: cookieState, codeVerifier } = parseAuthCookies(request);
    if (!cookieState || cookieState !== incomingState || !codeVerifier) {
      return new Response(JSON.stringify({ message: 'Invalid or expired login state. Try again.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cookiePassword = getCookiePassword();
    const secure = shouldUseSecureCookies(request.url);

    const clientId = getClientId();

    const authentication = await workos.userManagement.authenticateWithCode({
      clientId,
      code,
      codeVerifier,
      session: {
        sealSession: true,
        cookiePassword,
      },
    });

    await syncWorkOSIdentityToConvex(authentication.user);

    if (!authentication.sealedSession) {
      return new Response(JSON.stringify({ message: 'Unable to establish session' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const headers = new Headers();
    const successUrl = searchParams.get('next') ?? '/';

    headers.append('Location', successUrl);

    clearAuthCookies(secure).forEach((cookie) => headers.append('Set-Cookie', cookie));
    headers.append('Set-Cookie', createSessionCookie(authentication.sealedSession, secure));

    // Provide a lightweight non-HTTP-only cookie so client-side islands can show user name if desired.
    if (authentication.user) {
      const userPreview = {
        id: authentication.user.id,
        email: authentication.user.email,
        name: `${authentication.user.firstName ?? ''} ${authentication.user.lastName ?? ''}`.trim(),
      };
      headers.append(
        'Set-Cookie',
        serializeCookie('vcw_user_preview', Buffer.from(JSON.stringify(userPreview)).toString('base64url'), {
          secure,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days - match session cookie duration
        }),
      );
    }

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (error) {
    console.error('WorkOS callback error', error);
    return new Response(JSON.stringify({ message: 'Authentication failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};


