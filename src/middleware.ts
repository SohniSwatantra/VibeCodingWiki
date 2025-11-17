import { defineMiddleware } from 'astro:middleware';
import { getUserFromRequest } from './lib/auth/workos.server';

const workosSessionMiddleware = defineMiddleware(async ({ request, locals }, next) => {
  const middlewareStart = Date.now();
  const url = new URL(request.url);
  
  // Log all requests to help debug routing issues
  console.log(`[MIDDLEWARE] ${request.method} ${url.pathname} - Started at ${new Date().toISOString()}`);
  
  try {
    // getUserFromRequest now has its own 3-second timeout built in
    // This will return undefined if auth times out or fails, but won't hang
    locals.user = await getUserFromRequest(request);
    
    if (locals.user) {
      console.log(`[MIDDLEWARE] ${request.method} ${url.pathname} - Auth completed in ${Date.now() - middlewareStart}ms, user: ${locals.user.email}`);
    } else {
      console.log(`[MIDDLEWARE] ${request.method} ${url.pathname} - No authenticated user`);
    }
  } catch (error) {
    console.error(`[MIDDLEWARE] Error loading WorkOS session for ${url.pathname}:`, error);
    locals.user = undefined;
  }

  try {
    const result = await next();
    console.log(`[MIDDLEWARE] ${request.method} ${url.pathname} - Completed in ${Date.now() - middlewareStart}ms`);
    return result;
  } catch (error) {
    console.error(`[MIDDLEWARE] Error in next() for ${url.pathname}:`, error);
    throw error;
  }
});

// Sentry removed - was blocking requests
export const onRequest = workosSessionMiddleware;


