import { defineMiddleware } from 'astro:middleware';
import { getUserFromRequest, createSessionCookie, shouldUseSecureCookies } from './lib/auth/workos.server';

const workosSessionMiddleware = defineMiddleware(async ({ request, locals }, next) => {
  const middlewareStart = Date.now();
  const url = new URL(request.url);

  // Log all requests to help debug routing issues
  console.log(`[MIDDLEWARE] ${request.method} ${url.pathname} - Started at ${new Date().toISOString()}`);

  let refreshedSessionCookie: string | undefined;

  try {
    // getUserFromRequest now returns { user, refreshedSession? }
    const authResult = await getUserFromRequest(request);

    if (authResult) {
      locals.user = authResult.user;
      console.log(`[MIDDLEWARE] ${request.method} ${url.pathname} - Auth completed in ${Date.now() - middlewareStart}ms, user: ${authResult.user.email}`);

      // If session was refreshed, prepare cookie to be set
      if (authResult.refreshedSession) {
        const secure = shouldUseSecureCookies(request.url);
        refreshedSessionCookie = createSessionCookie(authResult.refreshedSession, secure);
        console.log(`[MIDDLEWARE] Session refreshed for user ${authResult.user.email}`);
      }
    } else {
      console.log(`[MIDDLEWARE] ${request.method} ${url.pathname} - No authenticated user`);
      locals.user = undefined;
    }
  } catch (error) {
    console.error(`[MIDDLEWARE] Error loading WorkOS session for ${url.pathname}:`, error);
    locals.user = undefined;
  }

  try {
    const result = await next();

    // If session was refreshed, add the new cookie to the response
    if (refreshedSessionCookie) {
      result.headers.append('Set-Cookie', refreshedSessionCookie);
    }

    console.log(`[MIDDLEWARE] ${request.method} ${url.pathname} - Completed in ${Date.now() - middlewareStart}ms`);
    return result;
  } catch (error) {
    console.error(`[MIDDLEWARE] Error in next() for ${url.pathname}:`, error);
    throw error;
  }
});

// Sentry removed - was blocking requests
export const onRequest = workosSessionMiddleware;


