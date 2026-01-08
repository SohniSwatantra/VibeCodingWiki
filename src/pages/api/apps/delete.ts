import type { APIRoute } from 'astro';
import { runConvexMutation, runConvexQuery } from '../../../lib/convex.server';
import { getConvexUserByWorkOSId } from '../../../lib/wiki/convexHelpers';

export const POST: APIRoute = async ({ request, locals }) => {
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

    // Parse request body
    const body = await request.json();
    const { appId } = body;

    if (!appId) {
      return new Response(JSON.stringify({ success: false, message: 'App ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete the app
    const result = await runConvexMutation('apps:deleteApp', { appId }, { useAdmin: true });

    if (!result) {
      return new Response(JSON.stringify({ success: false, message: 'Failed to delete app' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `App "${result.appName}" deleted successfully`,
      appId: result.appId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error deleting app:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
