import type { APIRoute } from 'astro';
import { fetchDirectory } from '../../../lib/wiki/convexHelpers';

export const GET: APIRoute = async () => {
  const { articles, source } = await fetchDirectory();
  return new Response(
    JSON.stringify({
      articles,
      source,
    }),
    { status: 200 },
  );
};

