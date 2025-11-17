import type { APIRoute } from 'astro';
import { Buffer } from 'node:buffer';
import {
  getWorkOS,
  getCookiePassword,
  shouldUseSecureCookies,
  createSessionCookie,
  getClientId,
  syncWorkOSIdentityToConvex,
} from '../../../../lib/auth/workos.server';
import { serializeCookie } from '../../../../lib/auth/cookie';

type MagicLinkRequest = {
  action: 'request' | 'verify';
  email: string;
  code?: string;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const workos = getWorkOS();
    const { action, email, code } = (await request.json()) as MagicLinkRequest;

    if (!email) {
      return new Response(JSON.stringify({ message: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'request') {
      const magicAuth = await workos.userManagement.createMagicAuth({ email });
      return new Response(JSON.stringify({
        message: 'Magic code generated',
        // Expose the code in development to ease testing. In production an email should be delivered.
        devCode: magicAuth.code,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'verify') {
      if (!code) {
        return new Response(JSON.stringify({ message: 'Code is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const cookiePassword = getCookiePassword();
      const secure = shouldUseSecureCookies(request.url);

      const clientId = getClientId();

      const authentication = await workos.userManagement.authenticateWithMagicAuth({
        clientId,
        email,
        code,
        session: {
          sealSession: true,
          cookiePassword,
        },
      });

      await syncWorkOSIdentityToConvex(authentication.user);

      if (!authentication.sealedSession) {
        return new Response(JSON.stringify({ message: 'Unable to create session from magic code' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const headers = new Headers();
      headers.append('Set-Cookie', createSessionCookie(authentication.sealedSession, secure));

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
            maxAge: 60 * 10,
          }),
        );
      }

      headers.append('Content-Type', 'application/json');

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers,
      });
    }

    return new Response(JSON.stringify({ message: 'Unsupported action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Magic link error', error);
    return new Response(JSON.stringify({ message: 'Failed to process magic link request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};


