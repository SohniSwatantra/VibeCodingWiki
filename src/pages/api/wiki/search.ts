import type { APIRoute } from 'astro';
import { runConvexQuery } from '../../../lib/convex.server';

export const GET: APIRoute = async ({ url }) => {
  try {
    const query = url.searchParams.get('q') || '';

    if (!query) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    const results = await runConvexQuery<any[]>('pages:searchPages', {
      query,
      limit: 20,
    });

    return new Response(JSON.stringify(results || []), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to search.';
    return new Response(JSON.stringify({ message: errorMessage }), { status: 500 });
  }
};
