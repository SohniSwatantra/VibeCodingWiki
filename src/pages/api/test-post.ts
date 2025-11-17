import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  console.log('🔥🔥🔥 TEST POST ENDPOINT HIT 🔥🔥🔥');
  console.log('Request method:', request.method);
  console.log('Request URL:', request.url);

  return new Response(
    JSON.stringify({ success: true, message: 'POST endpoint works!' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
