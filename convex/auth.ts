import type { MutationCtx, QueryCtx } from './types';

export async function getViewer(ctx: QueryCtx | MutationCtx) {
  console.log('[AUTH] getViewer: Starting authentication check');
  const identityStart = Date.now();
  const identity = await ctx.auth.getUserIdentity?.();
  console.log(`[AUTH] getUserIdentity took ${Date.now() - identityStart}ms, identity:`, identity ? `subject=${identity.subject}` : 'null');

  if (!identity) {
    console.log('[AUTH] No identity found, returning null');
    return null;
  }

  const queryStart = Date.now();
  const existing = await ctx.db
    .query('users')
    .withIndex('by_workosUserId', (q: any) => q.eq('workosUserId', identity.subject))
    .unique();
  console.log(`[AUTH] User query took ${Date.now() - queryStart}ms, found user:`, existing ? `id=${existing._id}` : 'null');

  if (!existing) {
    console.log('[AUTH] User not found in database for workosUserId:', identity.subject);
    return null;
  }

  console.log('[AUTH] getViewer completed successfully');
  return existing;
}

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  console.log('[AUTH] requireUser: Called');
  const viewer = await getViewer(ctx);
  if (!viewer) {
    console.error('[AUTH] requireUser: No viewer found, throwing authentication error');
    throw new Error('Authentication required');
  }

  console.log('[AUTH] requireUser: Success, user', viewer._id);
  return viewer;
}

