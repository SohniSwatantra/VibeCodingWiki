import type { APIRoute } from 'astro';
import { runConvexQuery } from '../../../lib/convex.server';

export const GET: APIRoute = async () => {
  try {
    const sponsors = await runConvexQuery<any[]>('sponsors:listSponsors', {});

    return new Response(
      JSON.stringify(sponsors || []),
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load sponsors.';
    return new Response(
      JSON.stringify({ message: errorMessage }),
      { status: 500 }
    );
  }
};
