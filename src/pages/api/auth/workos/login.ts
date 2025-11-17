import type { APIRoute } from 'astro';
import { Buffer } from 'node:buffer';
import {
  getWorkOS,
  getRedirectUri,
  createStateCookie,
  createVerifierCookie,
  shouldUseSecureCookies,
  getClientId,
  SESSION_COOKIE_NAME,
} from '../../../../lib/auth/workos.server';
import { serializeCookie } from '../../../../lib/auth/cookie';

const providerMap: Record<string, string> = {
  google: 'GoogleOAuth',
  github: 'GitHubOAuth',
};

function createCodeVerifier(): string {
  const random = crypto.randomUUID().replace(/-/g, '');
  return `${random}${crypto.randomUUID().replace(/-/g, '')}`.slice(0, 64);
}

async function createCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(new Uint8Array(digest)).toString('base64url');
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const workos = getWorkOS();
    const clientId = getClientId();
    const url = new URL(request.url);
    const providerParam = url.searchParams.get('provider');
    if (!providerParam) {
      return new Response(JSON.stringify({ message: 'provider query parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const provider = providerMap[providerParam.toLowerCase()];
    if (!provider) {
      return new Response(JSON.stringify({ message: `Unsupported provider: ${providerParam}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const state = crypto.randomUUID();
    const codeVerifier = createCodeVerifier();
    const codeChallenge = await createCodeChallenge(codeVerifier);

    const secure = shouldUseSecureCookies(request.url);
    const redirectUri = getRedirectUri();

    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
      provider,
      clientId,
      redirectUri,
      state,
      codeChallenge,
      codeChallengeMethod: 'S256',
    });

    const headers = new Headers();
    headers.append('Set-Cookie', createStateCookie(state, secure));
    headers.append('Set-Cookie', createVerifierCookie(codeVerifier, secure));
    headers.append('Location', authorizationUrl);

    // Ensure existing session cookie is cleared if starting a new login flow.
    headers.append('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 0,
    }));

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (error) {
    console.error('WorkOS login error', error);
    return new Response(JSON.stringify({ message: 'Unable to start login flow' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};


