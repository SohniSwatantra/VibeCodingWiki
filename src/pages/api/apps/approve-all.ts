import type { APIRoute } from 'astro';
import { runConvexMutation, runConvexQuery } from '../../../lib/convex.server';
import { getConvexUserByWorkOSId } from '../../../lib/wiki/convexHelpers';

export const POST: APIRoute = async ({ locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      return new Response(JSON.stringify({ success: false, message: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get Convex user and check role
    const convexUser = await getConvexUserByWorkOSId(locals.user.id);
    if (!convexUser) {
      return new Response(JSON.stringify({ success: false, message: 'User profile not found' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userRoles = await runConvexQuery<any[]>('roles:getUserRoles', { userId: convexUser._id });
    const roleNames = userRoles?.map((r: any) => r.role) ?? [];
    const isSuperAdmin = roleNames.includes('super_admin');

    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ success: false, message: 'Super admin role required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Approve all pending apps
    const result = await runConvexMutation('apps:approveAllPendingApps', {}, { useAdmin: true, force: true });

    if (!result) {
      return new Response(JSON.stringify({ success: false, message: 'Failed to approve apps' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Approved ${result.approved} apps`,
      approved: result.approved,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error approving apps:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
