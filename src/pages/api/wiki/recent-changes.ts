import type { APIRoute } from 'astro';
import { runConvexQuery } from '../../../lib/convex.server';

export const GET: APIRoute = async () => {
  try {
    const recentChanges = await runConvexQuery<any[]>('pages:getRecentApprovedChanges', { limit: 50 });

    return new Response(
      JSON.stringify(recentChanges || []),
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load recent changes.';
    return new Response(
      JSON.stringify({ message: errorMessage }),
      { status: 500 }
    );
  }
};
