export type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  path?: string;
  domain?: string;
  maxAge?: number;
  sameSite?: 'lax' | 'strict' | 'none';
  expires?: Date;
};

export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const segments = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    segments.push(`Max-Age=${Math.floor(options.maxAge)}`);
  }

  if (options.expires) {
    segments.push(`Expires=${options.expires.toUTCString()}`);
  }

  if (options.domain) {
    segments.push(`Domain=${options.domain}`);
  }

  segments.push(`Path=${options.path ?? '/'}`);

  if (options.httpOnly) {
    segments.push('HttpOnly');
  }

  if (options.secure) {
    segments.push('Secure');
  }

  if (options.sameSite) {
    const value = options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1).toLowerCase();
    segments.push(`SameSite=${value}`);
  }

  return segments.join('; ');
}

export function parseCookies(header: string | null | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  const parts = header.split(';');
  for (const part of parts) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const val = part.slice(index + 1).trim();
    if (!key) continue;
    cookies[key] = decodeURIComponent(val);
  }
  return cookies;
}

export function deleteCookie(name: string): string {
  return serializeCookie(name, '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}


