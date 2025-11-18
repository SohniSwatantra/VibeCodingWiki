import type { APIRoute } from 'astro';
import { runConvexQuery } from '../../../lib/convex.server';

export const GET: APIRoute = async () => {
  try {
    const users = await runConvexQuery<any[]>('users:listContributors', {});

    return new Response(
      JSON.stringify(users || []),
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load contributors.';
    return new Response(
      JSON.stringify({ message: errorMessage }),
      { status: 500 }
    );
  }
};
