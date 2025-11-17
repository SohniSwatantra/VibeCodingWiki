import type { APIRoute } from 'astro';
import { runConvexMutation, runConvexQuery } from '../../lib/convex.server';
import { getConvexUserByWorkOSId } from '../../lib/wiki/convexHelpers';

/**
 * One-time fix endpoint to restore pages incorrectly set to 'pending' status
 * GET /api/fix-pending-pages
 *
 * Requires: Authenticated user with super_admin role
 */
export const GET: APIRoute = async ({ locals }) => {
  console.log('🔧 Running fix for pending pages...');

  try {
    // Check authentication
    const workosUser = locals.user;
    if (!workosUser) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Authentication required. Please sign in.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Convex user and check roles
    const convexUser = await getConvexUserByWorkOSId(workosUser.id);
    if (!convexUser) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'User profile not found in Convex.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user has super_admin role
    const userRoles = await runConvexQuery<any[]>('roles:getUserRoles', { userId: convexUser._id });
    const roleNames = userRoles?.map((r: any) => r.role) ?? [];
    const isSuperAdmin = roleNames.includes('super_admin');

    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Insufficient permissions. This endpoint requires super_admin role.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`🔐 Authorized: ${convexUser.email} (${roleNames.join(', ')})`);

    // Run the fix using admin auth (since we've already checked permissions)
    const result = await runConvexMutation(
      'fix-page-status:restorePendingPages',
      {},
      { useAdmin: true }
    );

    console.log('✅ Fix completed:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully restored pending pages to published status',
        ...result,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Fix failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to restore pages',
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
