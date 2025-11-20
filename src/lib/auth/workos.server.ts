import { WorkOS } from '@workos-inc/node';
import { createHash } from 'node:crypto';
import { parseCookies, serializeCookie, deleteCookie, type CookieOptions } from './cookie';
import { runConvexMutation } from '../convex.server';

const apiKey = import.meta.env.WORKOS_API_KEY;
const clientId = import.meta.env.WORKOS_CLIENT_ID;
const redirectUri = import.meta.env.WORKOS_REDIRECT_URI;
const rawCookiePassword = import.meta.env.WORKOS_COOKIE_PASSWORD;
const cookiePassword = normalizeCookiePassword(rawCookiePassword);

if (!apiKey) {
  console.warn('WORKOS_API_KEY is not set. Authentication endpoints will be disabled.');
}

const workos = apiKey && clientId ? new WorkOS(apiKey, { clientId }) : null;

export const SESSION_COOKIE_NAME = 'vcw_session';
export const STATE_COOKIE_NAME = 'vcw_auth_state';
export const VERIFIER_COOKIE_NAME = 'vcw_code_verifier';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function getWorkOS(): WorkOS {
  if (!workos) {
    throw new Error('WorkOS SDK not initialised. Check WORKOS_API_KEY and WORKOS_CLIENT_ID.');
  }
  return workos;
}

export function getClientId(): string {
  if (!clientId) {
    throw new Error('WORKOS_CLIENT_ID is not configured');
  }
  return clientId;
}

export function getRedirectUri(): string {
  if (!redirectUri) {
    throw new Error('WORKOS_REDIRECT_URI is not configured');
  }
  return redirectUri;
}

export function getCookiePassword(): string {
  if (!cookiePassword) {
    throw new Error('WORKOS_COOKIE_PASSWORD is not configured');
  }
  return cookiePassword;
}

export function shouldUseSecureCookies(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

export async function getUserFromRequest(request: Request): Promise<{ user: any; refreshedSession?: string } | undefined> {
  if (!cookiePassword || !workos) {
    return undefined;
  }

  const cookies = parseCookies(request.headers.get('cookie'));
  const sealedSession = cookies[SESSION_COOKIE_NAME];
  if (!sealedSession) {
    return undefined;
  }

  try {
    const session = workos.userManagement.loadSealedSession({
      sessionData: sealedSession,
      cookiePassword,
    });

    // Authenticate with ensureActive to auto-refresh if needed
    const auth = await session.authenticate({ ensureActiveSession: true });
    if (!auth.authenticated || !auth.user) {
      return undefined;
    }

    const { user } = auth;
    const userInfo = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePictureUrl: user.profilePictureUrl,
    };

    // Check if session was refreshed and seal the new session
    let refreshedSession: string | undefined;
    if (auth.sessionId && auth.sessionId !== session.sessionId) {
      try {
        const newSession = await workos.userManagement.getSession({ sessionId: auth.sessionId });
        refreshedSession = workos.userManagement.sealSession({
          sessionData: newSession,
          cookiePassword,
        });
      } catch (error) {
        console.error('Failed to seal refreshed session', error);
      }
    }

    return {
      user: userInfo,
      refreshedSession,
    };
  } catch (error) {
    console.error('Failed to load WorkOS session', error);
    return undefined;
  }
}

export function createSessionCookie(value: string, secure: boolean): string {
  return serializeCookie(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function createStateCookie(value: string, secure: boolean, options: CookieOptions = {}): string {
  return serializeCookie(STATE_COOKIE_NAME, value, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: options.maxAge ?? 600,
  });
}

export function createVerifierCookie(value: string, secure: boolean, options: CookieOptions = {}): string {
  return serializeCookie(VERIFIER_COOKIE_NAME, value, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: options.maxAge ?? 600,
  });
}

export function clearAuthCookies(secure: boolean): string[] {
  const baseOptions: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite: 'lax',
  };
  return [
    serializeCookie(STATE_COOKIE_NAME, '', { ...baseOptions, maxAge: 0 }),
    serializeCookie(VERIFIER_COOKIE_NAME, '', { ...baseOptions, maxAge: 0 }),
    serializeCookie(SESSION_COOKIE_NAME, '', { ...baseOptions, maxAge: 0 }),
  ];
}

export function parseAuthCookies(request: Request) {
  const cookies = parseCookies(request.headers.get('cookie'));
  return {
    state: cookies[STATE_COOKIE_NAME],
    codeVerifier: cookies[VERIFIER_COOKIE_NAME],
  };
}

export { parseCookies, serializeCookie, deleteCookie };

function normalizeCookiePassword(secret: string | undefined): string | undefined {
  if (!secret) {
    return undefined;
  }

  if (secret.length >= 32) {
    return secret;
  }

  const derived = createHash('sha256').update(secret).digest('hex');
  console.warn(
    'WORKOS_COOKIE_PASSWORD should be at least 32 characters. ' +
      'Using a SHA-256 digest of the provided value, but please update your .env with a longer secret.',
  );

  return derived;
}

type WorkOSProfile = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profilePictureUrl?: string | null;
};

export async function syncWorkOSIdentityToConvex(profile?: WorkOSProfile) {
  if (!profile) return;

  try {
    await runConvexMutation(
      'users:syncWorkOSIdentity',
      {
        workosUserId: profile.id,
        email: profile.email ?? '',
        firstName: profile.firstName ?? undefined,
        lastName: profile.lastName ?? undefined,
        avatarUrl: profile.profilePictureUrl ?? undefined,
      },
      { useAdmin: true },
    );
  } catch (error) {
    console.error('Failed to sync WorkOS identity with Convex', error);
  }
}


