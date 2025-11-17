import type { APIRoute } from 'astro';
import { runConvexMutation } from '../../lib/convex.server';

/**
 * One-time fix endpoint to restore pages incorrectly set to 'pending' status
 * GET /api/fix-pending-pages
 */
export const GET: APIRoute = async () => {
  console.log('🔧 Running fix for pending pages...');

  try {
    // Use admin auth to bypass user authentication
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
